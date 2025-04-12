export type IPDocJSON = {
  id: string // firestore doc id
  name: string
  description: string
  creator: string // userId
  category: string
  tags: string[] // This wasn't populated yet.
  metadata: {
    tokenId: `0x${string}`
    cid: string
    mint: `0x${string}`
    transfer: `0x${string}`
    update: `0x${string}`
  }
  // Terms information for the idea
  terms?: {
    businessModel: string
    evaluationPeriod: string
    pricing: {
      dayPrice: string
      weekPrice: string
      monthPrice: string
    }
    ndaRequired: boolean
  }
  image?: { cid: string; width: number; height: number; mimeType: string }
  encrypted: {
    cid: string
    acl: string // JSON in here (firestore has problems with arrays in arrays)
    hash: string
  }
  downSampled: {
    cid: string
    acl: string // JSON in here
    hash: string
  }
  updatedAt: unknown
  createdAt: unknown
}

export type IPAuditJSON = {
  status: string
  creator: string
  address: `0x${string}`
  tokenId: `0x${string}`
  updatedAt: unknown
  createdAt: unknown
}

export function cidAsURL(cid?: string) {
  if (!cid) {
    return undefined
  }
  return `https://w3s.link/ipfs/${cid}`
}
