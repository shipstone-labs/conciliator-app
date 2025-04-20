import { SecretManagerServiceClient } from '@google-cloud/secret-manager'
import { parse } from 'dotenv'
import { error, debug } from 'firebase-functions/logger'
/**
 * Loads secrets from Google Secret Manager and applies them to process.env
 *
 * @param {string[]} secretNames - Array of secret names to load
 * @param {string} [projectId] - Google Cloud project ID (defaults to function config or GOOGLE_CLOUD_PROJECT env var)
 * @param {boolean} [overwrite=false] - Whether to overwrite existing env vars
 * @returns {Promise<Record<string, string>>} - Object containing loaded secrets
 *
 * @example
 * // Load specific secrets
 * await loadSecrets(['DATABASE_URL', 'API_KEY']);
 *
 * // Load with a specific project and allow overwriting
 * await loadSecrets(['DATABASE_URL'], 'my-project-id', true);
 */
export async function loadSecrets(
  secretNames: string[],
  secretFullName?: string
): Promise<Record<string, string>> {
  // Use the provided project ID, or config, or default to env var
  let name = secretFullName
  if (!name) {
    const project =
      process.env.SECRET_PROJECT || process.env.GOOGLE_CLOUD_PROJECT
    if (!project) {
      throw new Error(
        'No project ID provided, no SECRETS_PROJECT_ID or GOOGLE_CLOUD_PROJECT environment variable not set'
      )
    }

    const secretsName = process.env.SECRET_NAME
    if (!secretsName) {
      throw new Error(
        'No SECRETS_NAME provided, please set the SECRETS_NAME environment variable'
      )
    }
    const _version = process.env.SECRET_VERSION || 'latest'
    name = `projects/${project}/secrets/${secretsName}/versions/${_version}`
  }
  const client = new SecretManagerServiceClient()
  const [version] = await client.accessSecretVersion({ name })
  const payload = version.payload?.data?.toString() || ''
  if (!payload) {
    error('No payload found in secret version')
  }
  const loadedSecrets: Record<string, string> = parse(payload)
  const contract_name =
    loadedSecrets.FILCOIN_CONTRACT_VERIFIED ||
    loadedSecrets.FILCOIN_CONTRACT_NAME ||
    'IPDocV8'
  const contract_dynamic = `FILCOIN_CONTRACT_${contract_name.toUpperCase()}`
  const contract: `0x${string}` = (
    loadedSecrets.FILCOIN_CONTRACT_VERIFIED
      ? loadedSecrets[contract_dynamic]
      : loadedSecrets.FILCOIN_CONTRACT
  ) as `0x${string}`
  loadedSecrets.CONTRACT = contract
  loadedSecrets.CONTRACT_NAME = contract_name
  debug('has names', Object.keys(loadedSecrets))
  for (const key of secretNames) {
    if (!loadedSecrets[key]) {
      error(`Secret ${key} not found in loaded secrets`)
    }
  }

  return Object.fromEntries(
    Object.entries(loadedSecrets).filter(([key]) => secretNames.includes(key))
  )
}
