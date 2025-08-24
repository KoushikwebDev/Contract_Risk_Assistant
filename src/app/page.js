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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg ring-1 ring-white/30" />
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-slate-900">
              Agentic{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                AI
              </span>
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-slate-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-sm">Ready</span>
          </div>
        </div>

        {/* Content card */}
        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          {/* Primary action panel */}
          <div className="lg:col-span-2">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 backdrop-blur shadow-xl">
              {/* Accent bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600" />

              <div className="p-8">
                <p className="text-sm uppercase tracking-wider text-slate-500">
                  Document Ingestion
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Ingest your contract for vector search
                </h2>
                <p className="mt-2 text-slate-600">
                  We’ll split the PDF into smart chunks and embed them for fast,
                  accurate retrieval.
                </p>

                <div className="mt-6 flex items-center gap-4">
                  <button
                    onClick={handleEmbedding}
                    disabled={isPending}
                    className={`group relative inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium text-white
                transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer
                ${
                  isPending
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus-visible:ring-blue-600"
                }`}
                  >
                    <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 transition group-hover:opacity-100" />
                    {isPending ? (
                      <span className="inline-flex items-center gap-2">
                        <svg
                          className="h-4 w-4 animate-spin"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
                          />
                        </svg>
                        Ingesting…
                      </span>
                    ) : (
                      "Ingest Document"
                    )}
                  </button>

                  {status && (
                    <span className="text-sm text-slate-600">{status}</span>
                  )}
                </div>

                {/* Progress / tips row */}
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Step 1
                    </p>
                    <p className="mt-1 font-medium text-slate-900">Load PDF</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Step 2
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      Chunk & Embed
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Step 3
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      Store in Supabase
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Brand panel */}
          <div className="flex flex-col">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/60 backdrop-blur shadow-xl">
              <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 blur-3xl" />
              <div className="p-8 relative">
                <div className="flex items-center gap-3">
                  <img
                    src="/agentic-ai-logo.png"
                    alt="Agentic AI"
                    className="h-12 w-12 rounded-xl shadow ring-1 ring-slate-200 object-cover"
                  />
                  <div>
                    <p className="text-sm text-slate-500">Platform</p>
                    <p className="text-lg font-semibold text-slate-900">
                      Agentic AI
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Enterprise‑grade ingestion for retrieval‑augmented analysis.
                  Clean splits, robust embeddings, and lightning‑fast search.
                </p>

                <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  System healthy
                </div>
              </div>
            </div>

            <div className="mt-4 text-center text-xs text-slate-500">
              © {new Date().getFullYear()} Agentic AI. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
