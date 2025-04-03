"use client";
import Image from "next/image";
import React from "react";

export const Logo = () => (
  <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto mb-8">
    {/* Logo Image */}
    <Image
      width={192} // 3 times larger than 64px (64 * 3)
      height={192} // Maintain square aspect ratio
      className="rounded-md" // Optional: Add rounded corners
      priority // Ensures the image is loaded immediately
      src="/logo.png"
      alt="Logo"
    />

    {/* Text Container */}
    <div className="text-center mt-4">
      <h1 className="text-4xl font-bold text-blue-500">Conciliator Project</h1>
      <p className="mt-1 text-sm text-blue-500">A Part of SafeIdea</p>
    </div>
  </div>
);
