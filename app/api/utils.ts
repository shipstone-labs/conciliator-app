// Conditional import to prevent server-side issues
let litWrapperModule: any = null
async function getLitWrapper() {
  if (!litWrapperModule) {
    litWrapperModule = await import('lit-wrapper')
  }
  return litWrapperModule
}

// Type imports (these don't execute at runtime)
import type {
  LitResourceAbilityRequest,
  AuthCallbackParams,
  LitNodeClient,
} from 'lit-wrapper'
import { OpenAI } from 'openai'
import {
  createPublicClient,
  http,
  type WalletClient,
  type PrivateKeyAccount,
  type SignableMessage,
  zeroAddress,
} from 'viem'
import { filecoinCalibration } from 'viem/chains'
import { getFirebase } from './firebase'
import { estimateFeesPerGas, waitForTransactionReceipt } from 'viem/actions'
import { initAPIConfig } from '@/lib/apiUtils'
import { withTracing } from '@/lib/tracing'

const NAMES = [
  {
    postfix: '_API_KEY',
    name: 'apiKey',
    default: 'junkApi',
  },
  {
    postfix: '_PROJECT_ID',
    name: 'projectId',
  },
  {
    postfix: '_ORGANIZATION_ID',
    name: 'organizationId',
  },
  {
    postfix: '_STORAGE_ID',
    name: 'storageId',
  },
  {
    postfix: '_BASE_URL',
    name: 'baseURL',
  },
  {
    postfix: '_STORAGE_ID',
    name: 'storageId',
  },
]

export function getModel(name: string) {
  const model =
    process.env[`${name}_MODEL`] || (name === 'IMAGE' ? 'dall-e-3' : 'gpt-4o')
  if (!model) {
    throw new Error(`Missing ${name}_MODEL`)
  }
  return model
}

function readConfig(name: string) {
  const output = Object.fromEntries(
    (
      NAMES.map(({ postfix, name: _name, default: _default }) => {
        const value = process.env[`${name}${postfix}`] || _default || ''
        if (value) {
          return [_name, value] as [string, unknown]
        }
        return undefined
      }).filter(Boolean) as [string, unknown][]
    ).concat([['dangerouslyAllowBrowser', true] as [string, unknown]])
  )
  return output
}

let _imageAI: OpenAI | undefined
export function getImageAI() {
  initAPIConfig()
  if (_imageAI) {
    return _imageAI
  }
  _imageAI = new OpenAI(readConfig('IMAGE'))
  return _imageAI
}

let _completionAI: OpenAI | undefined
export function getCompletionAI() {
  initAPIConfig()
  if (_completionAI) {
    return _completionAI
  }
  _completionAI = new OpenAI(readConfig('COMPLETION'))
  return _completionAI
}

export const indexName = 'ip-embeddings'

export const genAuthSig = async (
  wallet: PrivateKeyAccount,
  client: LitNodeClient,
  uri: string,
  resources: LitResourceAbilityRequest[]
) => {
  const blockHash = client.latestBlockhash || '0'
  const { createSiweMessageWithRecaps, generateAuthSig } = await import(
    'lit-wrapper'
  )
  const message = await createSiweMessageWithRecaps({
    walletAddress: wallet.address,
    nonce: blockHash,
    litNodeClient: client,
    resources,
    expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
    uri,
  })
  const authSig = await generateAuthSig({
    signer: {
      signMessage: (message: SignableMessage) =>
        wallet.signMessage({ message }),
      getAddress: async () => wallet.address,
    },
    toSign: message,
    address: wallet.address,
  })

  return authSig
}

export const genSession = async (
  wallet: PrivateKeyAccount,
  client: LitNodeClient,
  resources: LitResourceAbilityRequest[]
) => {
  const sessionSigs = await client.getSessionSigs({
    chain: 'filecoinCalibrationTestnet',
    resourceAbilityRequests: resources,
    authNeededCallback: async (params: AuthCallbackParams) => {
      if (!params.expiration) {
        throw new Error('expiration is required')
      }

      if (!params.resources) {
        throw new Error('resourceAbilityRequests is required')
      }

      if (!params.uri) {
        throw new Error('uri is required')
      }

      // generate the authSig for the inner signature of the session
      // we need capabilities to assure that only one api key may be decrypted
      const authSig = genAuthSig(
        wallet,
        client,
        params.uri as string,
        (params.resourceAbilityRequests as LitResourceAbilityRequest[]) ?? []
      )
      return authSig
    },
  })

  return sessionSigs
}

export async function replaceDummyNonce(
  wallet: WalletClient,
  address: string,
  nonce: number
) {
  if (!wallet.account) {
    throw new Error('Wallet account is not set')
  }
  const db = getFirebase()
  const trans = {
    account: wallet.account,
    from: address,
    to: zeroAddress,
    value: 0n,
    nonce,
    chain: wallet.chain,
    maxFeePerGas: 2n,
  }
  const ref = db.ref(`nonce/${address}`)
  const { maxFeePerGas, maxPriorityFeePerGas } = await estimateFeesPerGas(
    wallet,
    trans
  )
  await wallet
    .sendTransaction({
      ...trans,
      maxFeePerGas: maxFeePerGas + 2n,
      maxPriorityFeePerGas: maxPriorityFeePerGas + 2n,
    })
    .then(async (hash) => {
      await waitForTransactionReceipt(wallet, {
        hash,
      })
      await ref.update({
        [`pending/${nonce}`]: null,
      })
      return hash
    })
}

// NOTE: This function is in two places because of firebase functions
export async function runWithNonce<T>(
  wallet: WalletClient,
  call: (nonce: number) => Promise<T>
): Promise<T> {
  const client = createPublicClient({
    chain: filecoinCalibration,
    transport: http(),
  })
  const db = getFirebase()
  const addresses = await wallet.getAddresses()
  const address = addresses[0]
  const rpcNoncePending = await client.getTransactionCount({
    address,
    blockTag: 'pending',
  })
  const rpcNonce = await client.getTransactionCount({
    address,
    blockTag: 'pending',
  })
  const ref = db.ref(`nonce/${address}`)
  const snap = await ref.once('value')
  const _data = snap.val()
  const now = Date.now()
  const { snapshot: finalSnap } = await ref.transaction((__data) => {
    const {
      nonce: _currentNonce,
      pending: _pending,
      lastUpdated: _lastUpdated,
    } = __data || _data || { nonce: rpcNonce }
    let lastUpdated = _lastUpdated
    let currentNonce = _currentNonce
    const pending = _pending || {}
    if (
      rpcNoncePending > currentNonce &&
      lastUpdated &&
      lastUpdated < now - 1000 * 60 * 5
    ) {
      // We must have missed one (this is unlikely to happen)
      lastUpdated = now
      currentNonce = rpcNonce
    } else if (
      rpcNonce < currentNonce &&
      (!lastUpdated || lastUpdated < now - 1000 * 60)
    ) {
      // We are behind, so we need to update the nonce
      currentNonce = rpcNonce
      lastUpdated = now
    }
    while (pending[currentNonce]) {
      currentNonce += 1
      lastUpdated = now
    }
    const out = {
      nonce: currentNonce + 1,
      pending: { ...pending, [currentNonce]: true },
      current: currentNonce,
      lastUpdated: lastUpdated || now,
    }
    return out
  })
  const nonce = finalSnap.val?.()?.current || rpcNonce
  return (await call(nonce)
    .then(async (result) => {
      await ref.update({
        [`pending/${nonce}`]: null,
      })
      return result
    })
    .catch(async (error) => {
      await replaceDummyNonce(wallet, address, nonce)

      return Promise.reject(error)
    })) as T
}

let litClient: Promise<LitNodeClient> | undefined
export async function getLit() {
  if (litClient) {
    return await litClient
  }
  litClient = (async () => {
    return await withTracing(
      'litClient',
      async () => {
        const litWrapper = await getLitWrapper()
        if (!litWrapper) {
          throw new Error('lit-wrapper not available in server environment')
        }
        const litClient = await litWrapper.createLitClient({
          litNetwork: litWrapper.LIT_NETWORK.Datil,
          debug: false,
        })
        global.document = { dispatchEvent: (_event: Event) => true } as Document
        await litClient.connect()
        return litClient
      },
      {},
      { root: true }
    )
  })()
  return await litClient
}

export function getContractInfo() {
  const contract_name =
    process.env.FILCOIN_CONTRACT_VERIFIED ||
    process.env.FILCOIN_CONTRACT_NAME ||
    'IPDocV8'
  const contract_dynamic = `FILCOIN_CONTRACT_${contract_name.toUpperCase()}`
  const contract: `0x${string}` = (
    process.env.FILCOIN_CONTRACT_VERIFIED
      ? process.env[contract_dynamic]
      : process.env.FILCOIN_CONTRACT
  ) as `0x${string}`
  return { contract, contract_name }
}
