export type IPDoc = {
  id: string; // firestore doc id
  name: string;
  description: string;
  creator: string; // userId
  category: string;
  tags: string[]; // Tags for the idea
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
  // Terms information for the idea
  terms?: {
    businessModel: string;
    evaluationPeriod: string;
    pricing: {
      dayPrice: string;
      weekPrice: string;
      monthPrice: string;
    };
    ndaRequired: boolean;
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

export function formatDate(date: any): string {
  if (!date) return 'Unknown Date';
  
  // Handle Firebase Timestamp objects (they have a toDate method)
  if (typeof date === 'object' && date.toDate && typeof date.toDate === 'function') {
    return date.toDate().toLocaleDateString();
  }
  
  // Handle Date objects
  if (date instanceof Date) {
    return date.toLocaleDateString();
  }
  
  // Handle ISO strings
  if (typeof date === 'string') {
    try {
      return new Date(date).toLocaleDateString();
    } catch (e) {
      return date;
    }
  }
  
  // Handle numeric timestamps
  if (typeof date === 'number') {
    return new Date(date).toLocaleDateString();
  }
  
  return 'Unknown Date';
}
