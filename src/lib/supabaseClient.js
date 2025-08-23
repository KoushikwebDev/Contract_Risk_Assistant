import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";
import { embeddings } from "@/lib/embeddings"; // the Gemini embeddings above
import config from "@/config";

export function supabaseClient() {
  return createClient(
    config.supabaseUrl,
    config.supabaseKey
  );
}

export async function upsertChunks(chunks) {
  const supabase = supabaseClient();

  // Each chunk should be a LangChain Document-like object:
  // { pageContent: string, metadata?: any }
  await SupabaseVectorStore.fromDocuments(chunks, embeddings, {
    client: supabase,
    tableName: "documents",
    // queryName: "match_documents", // optional if using an RPC
  });
}
