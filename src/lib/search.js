

import { embeddings } from "./embeddings";
import { supabaseClient } from "./supabaseClient";

export async function fetchRelevantDocs(query, k = 6, threshold = 0.65) {
      const supabase = supabaseClient();
  // 1) Embed the user query
  const qVec = await embeddings.embedQuery(query);

  // 2) Call your RPC (match_documents)
  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: qVec,
    match_count: k,
    filter: {}                      // add JSON filter if desired
  });
  if (error) throw new Error(error.message);

  return data;                      // [{content, metadata, similarity}, ...]
}
