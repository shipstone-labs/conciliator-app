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

function HomeApp() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 bg-gray-50">
      <Logo />

      {/* Description Section */}
      <div className="max-w-3xl text-center text-gray-700">
        <p className="text-lg leading-relaxed">
          The <strong>Conciliator Project</strong> explores how AI agents can
          talk to each other about new technologies and innovations. We’re
          presenting this work at <strong>ETHDenver 2025</strong> to show one
          possible approach to agent-to-agent communication about intellectual
          property.
        </p>
        <p className="mt-4 text-lg leading-relaxed">
          Conciliator creates a <strong>secure channel</strong> between two AI
          agents using <strong>Filecoin and IPFS</strong> infrastructure. One
          agent knows about a technology, while another agent tries to
          understand it. Each piece of intellectual property is minted as a
          token on Filecoin, and Fleek (pending) handles deployment across the
          decentralized network.
        </p>
        <p className="mt-4 text-lg leading-relaxed">
          You can test Conciliator below with your own technology description.
          Watch how agents interact through our question-and-answer protocol,
          and see how they build understanding while working within secure
          boundaries. This is an early experiment in helping AI systems evaluate
          innovations together.
        </p>
      </div>

      {/* Button Section */}
      <div className="flex space-x-4 mt-8">
        <Link
          href="/add-ip"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition"
        >
          Add IP
        </Link>
        <Link
          href="/list-ip"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition"
        >
          IP Docs
        </Link>
      </div>
    </div>
  );
}

export default HomeApp;
