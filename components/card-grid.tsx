"use client";

import { useEffect, useState, useCallback } from "react";
import Loading from "@/components/Loading";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import Image from "next/image";
import Link from "next/link";
import HomeLink from "./HomeLink";

const itemsPerPage = 16; // 4 Cards per page

export type Data = {
  name: string;
  url: string;
  description: string;
  tokenId: number;
};

const CardGrid = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [imageWidth, setImageWidth] = useState(200); // Default width

  const [items, setItems] = useState<Data[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const onRetrieve = useCallback(
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
      onRetrieve(0, 10);
    }
  }, [onRetrieve, loading]);

  // Responsive image size calculation
  useEffect(() => {
    const updateImageWidth = () => {
      const screenWidth = window.innerWidth;

      if (screenWidth < 640) {
        setImageWidth(150); // Mobile
      } else if (screenWidth < 1024) {
        setImageWidth(180); // Tablet
      } else {
        setImageWidth(250); // Desktop
      }
    };

    updateImageWidth(); // Set initial width
    window.addEventListener("resize", updateImageWidth);

    return () => window.removeEventListener("resize", updateImageWidth);
  }, []);
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleItems = items.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    if (page > totalPages) {
      onRetrieve(items.length, itemsPerPage);
    }
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (!loaded) {
    return <Loading />;
  }

  return (
    <div className="w-full flex flex-col items-center p-3">
      <HomeLink />

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
        {visibleItems.map((item, index) => (
          <Card
            key={`${item.name}-${item.description}-${index}`}
            className="shadow-xl hover:shadow-primary/20 transition-all hover:-translate-y-1 backdrop-blur-md hover:backdrop-blur-lg"
          >
            {/* Name (Title) with Tooltip */}
            <CardHeader className="p-4 rounded-t-xl text-center h-16">
              <Tooltip>
                <TooltipTrigger className="block w-full">
                  <CardTitle className="text-sm font-bold leading-tight max-h-12 overflow-hidden line-clamp-2 text-ellipsis">
                    {item.name}
                  </CardTitle>
                </TooltipTrigger>
                <TooltipContent className="bg-background/80 backdrop-blur-md text-white p-3 rounded-xl max-w-xs border border-white/10 shadow-lg">
                  {item.name}
                </TooltipContent>
              </Tooltip>
            </CardHeader>

            {/* Image */}
            <CardContent className="flex justify-center p-4">
              <Image
                src={`${item.url.replace(
                  /ipfs:\/\//,
                  "/api/download/"
                )}?img-width=${imageWidth}&img-dpr=${
                  typeof window !== "undefined"
                    ? window.devicePixelRatio || 1
                    : 1
                }`}
                alt={item.name}
                width={200}
                height={200}
                className="rounded-xl object-cover shadow-md border border-white/10 hover:border-primary/30 transition-all"
              />
            </CardContent>

            {/* Description with Tooltip */}
            <CardContent className="p-4 h-32 overflow-hidden">
              <Tooltip>
                <TooltipTrigger className="block w-full">
                  <p className="text-white/80 text-sm line-clamp-5 text-ellipsis">
                    {item.description}
                  </p>
                </TooltipTrigger>
                <TooltipContent className="bg-background/80 backdrop-blur-md text-white p-3 rounded-xl max-w-sm border border-white/10 shadow-lg">
                  {item.description}
                </TooltipContent>
              </Tooltip>
            </CardContent>

            <CardContent className="p-3 flex justify-center">
              <Link
                className="px-8 py-2 h-11 rounded-xl bg-primary text-black font-medium
                  hover:bg-primary/80 hover:scale-105
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                  disabled:opacity-50 disabled:pointer-events-none ring-offset-background
                  shadow-lg hover:shadow-primary/30 transition-all"
                href={`/discovery/${item.tokenId}`}
              >
                Learn More
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center space-x-3 mt-8">
        <button
          type="button"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-5 py-2 h-11 bg-background/50 backdrop-blur-sm border border-white/10 rounded-xl text-white/90 disabled:opacity-30 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        >
          Prev
        </button>

        {/* Display up to 5 page numbers dynamically */}
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
          <button
            type="button"
            key={`page-${i + 1}`}
            onClick={() => goToPage(i + 1)}
            className={`px-4 py-2 h-11 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all ${
              currentPage === i + 1
                ? "bg-primary text-black font-medium"
                : "bg-background/50 backdrop-blur-sm border border-white/10 text-white/90 hover:bg-background/70"
            }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          type="button"
          onClick={() => goToPage(currentPage + 1)}
          className="px-5 py-2 h-11 bg-background/50 backdrop-blur-sm border border-white/10 rounded-xl text-white/90 disabled:opacity-30 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CardGrid;
