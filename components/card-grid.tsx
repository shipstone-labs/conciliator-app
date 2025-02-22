"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
        href="/add-ip"
        className="fixed top-6 right-6 bg-blue-600 text-white text-3xl w-14 h-14 flex items-center justify-center rounded-full shadow-lg hover:bg-blue-700 transition-all"
      >
        +
      </Link>

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
        {visibleItems.map((item, index) => (
          <Card
            key={`${item.name}-${item.description}-${index}`}
            className="shadow-lg border border-gray-200 rounded-lg"
          >
            {/* Name (Title) */}
            <CardHeader className="bg-gray-100 p-4 rounded-t-lg text-center h-14">
              <CardTitle className="text-base font-semibold max-h-12 overflow-auto line-clamp-2">
                {item.name}
              </CardTitle>
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
                className="rounded-md object-cover"
              />
            </CardContent>

            {/* Description */}
            <CardContent className="p-4 max-h-32 h-32 overflow-auto line-clamp-5">
              <p className="text-gray-600 text-sm overflow-hidden max-h-24">
                {item.description}
              </p>
            </CardContent>

            <CardContent className="p-2 flex justify-center">
              <Link
                className="px-4 py-2 rounded-md bg-blue-500 text-white font-medium 
             hover:bg-blue-600 
             focus:ring-2 focus:ring-blue-400 focus:outline-none 
             disabled:bg-gray-300 disabled:cursor-not-allowed"
                href={`/${item.tokenId}`}
              >
                Seek
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center space-x-2 mt-6">
        <button
          type="button"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 bg-gray-200 rounded-md disabled:opacity-50"
        >
          Prev
        </button>

        {/* Display up to 5 page numbers dynamically */}
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
          <button
            type="button"
            key={`page-${i + 1}`}
            onClick={() => goToPage(i + 1)}
            className={`px-3 py-2 rounded-md ${
              currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          type="button"
          onClick={() => goToPage(currentPage + 1)}
          className="px-3 py-2 bg-gray-200 rounded-md disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CardGrid;
