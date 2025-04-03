"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "./Logo";

function HomeApp() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-16">
      <Logo />

      {/* Description Section */}
      <div className="max-w-3xl mx-auto text-center backdrop-blur-lg bg-background/30 p-8 rounded-2xl shadow-xl border border-white/10 mt-8">
        <p className="text-lg leading-relaxed text-white/90">
          The <span className="text-primary font-semibold">Conciliator Project</span> explores how AI agents can
          talk to each other about new technologies and innovations. We're
          presenting this work at <span className="text-secondary font-semibold">ETHDenver 2025</span> to show one
          possible approach to agent-to-agent communication about intellectual
          property.
        </p>
        <p className="mt-6 text-lg leading-relaxed text-white/90">
          Conciliator creates a <span className="text-primary font-semibold">secure channel</span> between two AI
          agents using <span className="text-accent font-semibold">Filecoin and IPFS</span> infrastructure. One
          agent knows about a technology, while another agent tries to
          understand it. Each piece of intellectual property is minted as a
          token on Filecoin, and Fleek (pending) handles deployment across the
          decentralized network.
        </p>
        <p className="mt-6 text-lg leading-relaxed text-white/90">
          You can test Conciliator below with your own technology description.
          Watch how agents interact through our question-and-answer protocol,
          and see how they build understanding while working within secure
          boundaries. This is an experiment in helping AI systems evaluate
          innovations together.
        </p>
      </div>

      {/* Button Section */}
      <div className="flex flex-col sm:flex-row gap-4 mt-10">
        <Link
          href="/add-ip"
          className="px-8 py-4 bg-primary hover:bg-primary/80 text-black font-medium rounded-xl transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 text-center"
        >
          Add IP
        </Link>
        <Link
          href="/list-ip"
          className="px-8 py-4 bg-secondary hover:bg-secondary/80 text-black font-medium rounded-xl transition-all shadow-lg hover:shadow-secondary/30 hover:scale-105 text-center"
        >
          IP Docs
        </Link>
      </div>
    </div>
  );
}

export default HomeApp;