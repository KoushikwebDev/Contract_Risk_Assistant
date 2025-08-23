import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { fetchRelevantDocs } from "./search";
import config from "@/config";

// Gemini chat model (stream enabled)
const chat = new ChatGoogleGenerativeAI({
  apiKey: config.geminiApiKey,        // ✅ fixed
  model: "gemini-1.5-flash-latest",     // ✅ fixed
  temperature: 0.2,
  maxOutputTokens: 1024,
  streaming: true                     // ✅ correct flag
});

export async function* chatWithDocs(userInput) {
  // 1 · Retrieve context
  const docs = await fetchRelevantDocs(userInput, 6);

  if (!docs?.length) {
    yield "Sorry, I couldn’t find anything relevant in the knowledge base.";
    return;
  }

  const context = docs
    .map(
      (d, i) =>
        `[#${i + 1} | pg:${d.metadata?.page ?? "?"} | sim:${(d.similarity ?? 0).toFixed(
          2
        )}]\n${d.content}`
    )
    .join("\n\n");

  // 2 · Build messages (use LangChain Message classes)
  const messages = [
    new SystemMessage(
      "You are a contract-risk assistant. Use the provided context when helpful. Cite reference numbers like [#1], [#2] …"
    ),
    new HumanMessage(`Question: ${userInput}\n\nContext:\n${context}`)
  ];

  // 3 · Stream response
  const stream = await chat.stream(messages);
  for await (const chunk of stream) {
    if (chunk.delta) {
      yield chunk.delta; // ✅ stream tokens
    }
  }
}
