"use client";

import { api } from "@/trpc/react";
import { useState } from "react";

export default function Home() {
  // 1. The Query (Like GET)
  // Watch Intellisense work when you type "api.example..."
  const hello = api.example.hello.useQuery({ text: "Steven" });

  // 2. The Mutation (Like POST)
  const createTestUser = api.example.createTestUser.useMutation({
    onSuccess: () => {
      alert("User created in DB!");
    },
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Clarity<span className="text-[hsl(280,100%,70%)]">Tracking</span> v2
        </h1>

        <div className="flex flex-col items-center gap-2">
          <p className="text-2xl text-white">
            {hello.data ? hello.data.greeting : "Loading tRPC..."}
          </p>

          <button
            onClick={() => createTestUser.mutate({ email: "test@example.com" })}
            className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
            disabled={createTestUser.isPending}
          >
            {createTestUser.isPending ? "Saving..." : "Test DB Write"}
          </button>
        </div>
      </div>
    </main>
  );
}