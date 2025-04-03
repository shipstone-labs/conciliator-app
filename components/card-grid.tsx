"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import Image from "next/image";
import Link from "next/link";

const itemsPerPage = 16; // 4 Cards per page

export type Data = {
  name: string;
  url: string;
  description: string;
  tokenId: number;
};

type Props = {
  items: Data[];
  onRetrieve: (start: number, limit: number) => Promise<void>;
};
const CardGrid = ({ items, onRetrieve }: Props) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [imageWidth, setImageWidth] = useState(200); // Default width

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

  return (
    <div className="w-full flex flex-col items-center p-3">
      <Link
        href="/"
        className="fixed top-6 left-6 bg-primary/80 backdrop-blur-lg text-black w-12 h-12 flex items-center justify-center rounded-full shadow-lg hover:bg-primary transition-all hover:scale-110 border border-white/20"
      >
        🏠
      </Link>
      <Link
        href="/add-ip"
        className="fixed top-6 right-6 bg-secondary/80 backdrop-blur-lg text-black text-3xl w-14 h-14 flex items-center justify-center rounded-full shadow-lg hover:bg-secondary transition-all hover:scale-110 border border-white/20"
      >
        +
      </Link>

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
                  window.devicePixelRatio || 1
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
                className="px-6 py-2 rounded-xl bg-primary text-black font-medium
                  hover:bg-primary/80 hover:scale-105
                  focus:ring-2 focus:ring-primary/50 focus:outline-none
                  disabled:opacity-50 disabled:cursor-not-allowed
                  shadow-md hover:shadow-primary/30 transition-all"
                href={`/${item.tokenId}`}
              >
                Seek
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
          className="px-5 py-2 bg-background/50 backdrop-blur-sm border border-white/10 rounded-xl text-white/90 disabled:opacity-30 shadow-md hover:shadow-lg hover:bg-background/70 transition-all"
        >
          Prev
        </button>

        {/* Display up to 5 page numbers dynamically */}
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
          <button
            type="button"
            key={`page-${i + 1}`}
            onClick={() => goToPage(i + 1)}
            className={`px-4 py-2 rounded-xl shadow-md transition-all ${
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
          className="px-5 py-2 bg-background/50 backdrop-blur-sm border border-white/10 rounded-xl text-white/90 disabled:opacity-30 shadow-md hover:shadow-lg hover:bg-background/70 transition-all"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CardGrid;
