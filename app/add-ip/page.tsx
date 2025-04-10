"use client";

import AddIP from "@/components/AddIP";
import Authenticated from "@/components/Authenticated";

export default function AddIPPage() {
  return (
    <Authenticated requireLit>
      <AddIP />
    </Authenticated>
  );
}
