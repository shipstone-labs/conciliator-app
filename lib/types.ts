export type IPDoc = {
  id: string; // firestore doc id
  name: string;
  description: string;
  creator: string; // userId
  category: string;
  tags: string[]; // This wasn't populated yet.
  tokenId: string;
  image?: { cid: string; width: number; height: number; mimeType: string };
  encrypted: {
    cid: string;
    acl: string; // JSON in here (firestore has problems with arrays in arrays)
    hash: string;
  };
  downSampled: {
    cid: string;
    acl: string; // JSON in here
    hash: string;
  };
  updatedAt: Date;
  createdAt: Date;
};

export function cidAsURL(cid?: string) {
  if (!cid) {
    return undefined;
  }
  return `https://w3s.link/ipfs/${cid}`;
}
