"use client";


import { ingestWithGemini } from "@/actions/ingest";
import Image from "next/image";
import { useState, useTransition } from "react";

export default function Home() {
  const [status, setStatus] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleEmbedding = () => {
    setStatus("You Don't have permission to access this feature. Please contact your administrator.");
    return;
    setStatus("");
    startTransition(async () => {
      try {
        const res = await ingestWithGemini();
        setStatus(`Ingested ${res.inserted} chunks.`);
      } catch (e) {
        console.error(e);
        setStatus(`Error: ${e?.message || "failed"}`);
      }
    });
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <h1 className="text-4xl sm:text-6xl font-bold">Agentic AI</h1>
      {/* <Image
        src="/agentic-ai-logo.png"
        alt="Agentic AI Logo"
        width={400}
        height={300}
        style={{ width: "100%", height: "600px" }}
      /> */}
      <button
        onClick={handleEmbedding}
        disabled={isPending}
        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-60"
      >
        {isPending ? "Ingesting..." : "Ingest Document"}
      </button>
      {status && <p className="mt-4 text-sm text-gray-700">{status}</p>}
    </div>
  );
}
