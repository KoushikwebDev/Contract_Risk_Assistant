
import config from "@/config";
import { OpenAIEmbeddings } from "@langchain/openai";

// export const embeddings = new OpenAIEmbeddings({
//   modelName: "text-embedding-3-small", // 1536 dims, cost-effective
//   openAIApiKey: config.openAiKey,
//   // Optional: dimensions: 1536, // specify if you want to enforce
// });

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: config.geminiApiKey,
  model: "text-embedding-004", // or "text-embedding-005"
  // taskType: "retrieval_document", // optional; other options: "retrieval_query", "semantic_similarity"
});

