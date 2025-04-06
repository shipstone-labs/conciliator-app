"use client";

import Authenticated from "@/components/Authenticated";
import CardGrid, { type Data } from "@/components/card-grid";
import Loading from "@/components/Loading";
import { useCallback, useEffect, useState } from "react";

export default function Home() {
  const [items, setItems] = useState<Data[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
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
        console.log(await response.text());
        throw new Error("Failed to retrieve items");
      }
      const data = (await response.json()) as Data[];
      setItems([...items, ...data]);
      setLoaded(true);
    },
    [items]
  );
  useEffect(() => {
    if (!loading) {
      setLoading(true);
      retrieve(0, 10);
    }
  }, [retrieve, loading]);
  if (!loaded) {
    return <Loading />;
  }
  return (
    <Authenticated>
      <CardGrid items={items} onRetrieve={retrieve} />
    </Authenticated>
  );
}
