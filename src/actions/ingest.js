"use server";

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import config from "@/config";

export async function ingestWithGemini() {
  const supabase = createClient(config.supabaseUrl, config.supabaseKey);

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: config.geminiApiKey,
    model: "text-embedding-004", // 768 dims
  });

  // 1) Load PDF (server-side)
  const loader = new PDFLoader("public/Knowledge_Base.pdf");
  const docs = await loader.load();

  // 2) Split
  const splitter = new RecursiveCharacterTextSplitter({
    separators: ["\n\n", "\n", ".", "!", "?", ",", " ", ""],
    chunkSize: 3500,
    chunkOverlap: 500,
  });
  const splitDocs = await splitter.splitDocuments(docs);

  // Optional metadata enrichment
  const withMeta = splitDocs.map((d) => ({
    ...d,
    metadata: {
      ...(d.metadata || {}),
      source_file: "Knowledge_Base.pdf",
      full_path: "public/Knowledge_Base.pdf",
      page:
        (d.metadata && d.metadata.loc && d.metadata.loc.pageNumber) ??
        (d.metadata && d.metadata.page) ??
        null,
      chunk_index: index, // Add chunk order for reconstruction
      doc_id: `knowledge_base_${index}`, // Unique identifier
      ingested_at: new Date().toISOString(),
    },
  }));

  // 3) Upsert into Supabase
  await SupabaseVectorStore.fromDocuments(splitDocs, embeddings, {
    client: supabase,
    tableName: "documents",
  });

  return { inserted: withMeta.length };
}
