"use client";

import { authContext } from "@/app/authLayout";
import { useContext } from "react";

export const useAuth = () => {
  const context = useContext(authContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
