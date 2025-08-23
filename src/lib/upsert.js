
import { supabase } from "./supabaseClient";
import { embeddings } from "./embeddings";

export async function upsertChunk(content, metadata = {}) {
  // Guard: keep content reasonably small (chunk beforehand)
  const vector = await embeddings.embedQuery(content); // number[]

  const { error } = await supabase
    .from("documents")
    .insert({ content, metadata, embedding: vector });

  if (error) throw new Error(error.message);
}
