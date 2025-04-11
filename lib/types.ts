export type IPDoc = {
  name: string;
  description: string;
  creator: string;
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
  userId: string;
  updatedAt: Date;
  createdAt: Date;
};

export function cidAsURL(cid: string) {
  return `https://w3s.link/ipfs/${cid}`;
}
