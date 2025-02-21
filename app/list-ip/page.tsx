"use client";

import CardGrid, { type Data } from "@/components/card-grid";
import Loading from "@/components/Loading";
import { useCallback, useEffect, useState } from "react";

export default function Home() {
  const [items, setItems] = useState<Data[]>([]);
  const [loaded, setLoaded] = useState(false);
  const retrieve = useCallback(
    async (_start: number, limit: number) => {
      let start = _start;
      if (start < items.length) {
        start = items.length;
      }
      const response = await fetch("/api/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start,
          limit,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to retrieve items");
      }
      const data = (await response.json()) as Data[];
      setItems([...items, ...data]);
    },
    [items]
  );
  useEffect(() => {
    if (!loaded) {
      setLoaded(true);
      retrieve(0, 10);
    }
  }, [retrieve, loaded]);
  if (!loaded) {
    return <Loading />;
  }
  return (
    <main>
      <CardGrid items={items} onRetrieve={retrieve} />
    </main>
  );
}
