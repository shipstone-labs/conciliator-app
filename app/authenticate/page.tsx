"use client";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStytch, useStytchUser } from "@stytch/nextjs";
import { LoginOrSignupForm } from "@/components/LoginOrSignupForm";
import AuthenticatedLayout from "@/components/Authenticated";
import { Logo } from "@/components/Logo";

function Authenticate() {
  const { user, isInitialized } = useStytchUser();
  const stytch = useStytch();
  const query = useSearchParams();
  const router = useRouter();
  const pickedUp = useRef(false);
  useEffect(() => {
    if (stytch && !user && isInitialized && query) {
      const tokenType = query.get("stytch_token_type");
      const token = query.get("token");
      if (token && tokenType === "magic_links" && !pickedUp.current) {
        pickedUp.current = true;
        console.log("Token received:", token);
        stytch.magicLinks
          .authenticate(token, {
            session_duration_minutes: 60,
          })
          .catch((error) => {
            console.error("Error authenticating with Stytch:", error);
            return undefined;
          })
          .then((response) => {
            console.log("Authentication response:", response);
          });
      }
    }
  }, [isInitialized, query, stytch, user]);
  useEffect(() => {
    if (isInitialized && user) {
      router.replace(query.get("redirect") || "/dashboard");
    }
  }, [isInitialized, user, router, query]);
  return <LoginOrSignupForm />;
}

export default function AuthenticatePage() {
  return (
    <AuthenticatedLayout alwaysShow>
      <main>
        <div className="flex flex-col items-center justify-center min-h-screen px-6 py-16">
          <Logo />

          {/* Description Section */}
          <div className="max-w-3xl mx-auto text-center backdrop-blur-lg bg-background/30 p-8 rounded-2xl shadow-xl border border-white/10 mt-8">
            <Authenticate />
          </div>
        </div>
      </main>
    </AuthenticatedLayout>
  );
}
