"use client";
import Image from "next/image";
import React from "react";

export const Logo = () => (
  <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto mb-10">
    {/* Logo Image */}
    <Image
      width={192}
      height={192}
      className="rounded-full shadow-lg border-2 border-primary/30"
      priority
      src="/logo.png"
      alt="Logo"
    />

    {/* Text Container */}
    <div className="text-center mt-6">
      <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
        Conciliator Project
      </h1>
      <p className="mt-2 text-base text-white/70">A Part of SafeIdea</p>
    </div>
  </div>
);
