import { pinata } from '@/app/api/utils';

// Simple function to store NDA PDFs using the existing Pinata integration
export async function storeNdaPdf(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  try {
    // Create the file object for Pinata
    const file = new File([buffer], fileName, { type: 'application/pdf' });
    
    // Upload to IPFS through Pinata
    const result = await pinata.pinFile({ data: file });
    
    return result.cid;
  } catch (error) {
    console.error('Error storing NDA PDF:', error);
    throw new Error('Failed to store NDA PDF');
  }
}