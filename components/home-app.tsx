"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

const Logo = () => (
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
      <p className="mt-1 text-sm text-blue-500">Valuing Agreement</p>
    </div>
  </div>
);

const HomeApp = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Logo />

        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">IP Value Discovery</CardTitle>
            <CardDescription>
              Discover the value of intellectual property through structured
              dialogue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex flex-row items-center justify-center">
            <Link
              href="/add-ip"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
            >
              Add IP
            </Link>
            <Link
              href="/list-ip"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
            >
              IP Docs
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HomeApp;
