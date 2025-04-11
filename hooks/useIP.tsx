import type { IPDoc } from "@/lib/types";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useIP(tokenId: string) {
  const fs = getFirestore();
  const [ideaData, setIdexData] = useState<IPDoc | undefined>();
  useEffect(() => {
    const fetchData = async () => {
      const docRef = await getDoc(doc(fs, "ip", tokenId));
      if (docRef.exists()) {
        setIdexData(docRef.data() as IPDoc);
      } else {
        setIdexData(undefined);
      }
    };
    fetchData();
  }, [fs, tokenId]);
  return ideaData;
}
