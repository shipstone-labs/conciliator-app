"use client";

import Link from "next/link";
import { Logo } from "./Logo";
import AuthenticatedLayout from "./Authenticated";

// This is a placeholder for the actual login detection logic
function HomeApp({ isLoggedIn }: { isLoggedIn?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-16">
      <Logo />

      {/* Description Section */}
      <div className="max-w-3xl mx-auto text-center backdrop-blur-lg bg-background/30 p-8 rounded-2xl shadow-xl border border-white/10 mt-8">
        <p className="text-lg leading-relaxed text-white/90">
          Welcome to{" "}
          <span className="text-primary font-semibold">SafeIdea.net</span>. This
          is the alpha version of our IP protection platform. We help creators
          and inventors store, share, and monetize their ideas securely.
        </p>
        <p className="mt-6 text-lg leading-relaxed text-white/90">
          To try it out, click on the{" "}
          <span className="text-primary font-semibold">Add Idea</span> button
          below to upload your invention details. This version works best with
          text or markdown documents. If you&apos;d like to explore existing
          ideas, click on the{" "}
          <span className="text-secondary font-semibold">Idea Database</span>{" "}
          button to browse what&apos;s already in the system.
        </p>
        <p className="mt-6 text-lg leading-relaxed text-white/90">
          SafeIdea provides three key benefits: First, secure storage
          establishes proof that you had a specific idea at a particular time.
          Second, controlled sharing creates records of who accessed your work
          and when. Third, our platform connects you with opportunities to
          monetize your ideas on your terms.
        </p>
        <p className="mt-6 text-lg leading-relaxed text-white/90">
          This version of SafeIdea was designed to leverage technology within
          the{" "}
          <span className="text-accent font-semibold">Filecoin ecosystem</span>.
          We&apos;re using tokens from the Filecoin system, Storacha&apos;s file
          storage tools and Lilypad&apos;s AI modules. We&apos;re using LIT
          Protocol for encryption, which is integrated with Storacha. SafeIdea
          is an open source project, necessary if you want to make sure the
          developers don&apos;t know about your secrets.
        </p>
        <p className="mt-6 text-lg leading-relaxed text-white/90">
          SafeIdea launches commercially in late 2025. Want early access? Apply
          now for our beta program. We&apos;re looking for inventors and
          creators ready to help us protect their intellectual property in the
          digital age.
        </p>
      </div>

      {/* Button Section */}
      <div className="flex flex-col sm:flex-row gap-4 mt-10">
        {isLoggedIn ? (
          <>
            <Link
              href="/add-ip"
              className="px-8 py-4 bg-primary hover:bg-primary/80 text-black font-medium rounded-xl transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 text-center"
            >
              Add Idea
            </Link>
            <Link
              href="/list-ip"
              className="px-8 py-4 bg-secondary hover:bg-secondary/80 text-black font-medium rounded-xl transition-all shadow-lg hover:shadow-secondary/30 hover:scale-105 text-center"
            >
              Idea Database
            </Link>
          </>
        ) : (
          <Link
            href="/authenticate"
            className="px-8 py-4 bg-secondary hover:bg-secondary/80 text-black font-medium rounded-xl transition-all shadow-lg hover:shadow-secondary/30 hover:scale-105 text-center"
          >
            Login
          </Link>
        )}
      </div>
    </div>
  );
}

function RootHomeApp({ detectLogin = false }: { detectLogin?: boolean }) {
  if (detectLogin) {
    return (
      <AuthenticatedLayout>
        <HomeApp isLoggedIn={true} />
      </AuthenticatedLayout>
    );
  }
  return <HomeApp />;
}

export default RootHomeApp;
