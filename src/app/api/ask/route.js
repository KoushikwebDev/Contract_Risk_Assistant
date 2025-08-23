import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createQuestionChain } from "@/lib/questionChain";

import config from "@/config";

// Gemini chat model (stream enabled)
const chat = new ChatGoogleGenerativeAI({
  apiKey: config.geminiApiKey,
  model: "gemini-1.5-flash", // Free-tier friendly model
  temperature: 0.2,
  maxOutputTokens: 1024,
  streaming: true,
});

async function* chatWithDocs(userInput, contractContent) {
  try {
    console.log("chatWithDocs called with:", { userInput: userInput?.substring(0, 100), contractContent: contractContent ? "Present" : "Not provided" });
    
    // 1 · Process question through question chain
    console.log("Processing question chain for:", userInput);
    const questionData = await createQuestionChain(userInput);
    
    console.log("Question chain result:", {
      original: questionData.originalQuestion,
      enhanced: questionData.enhancedQuestion,
      keyTerms: questionData.keyTerms,
      searchQuery: questionData.searchQuery
    });

    // 2 · Use provided contract content or show appropriate message
    const contractText = contractContent || "No contract content provided. Please use the contract analysis feature to analyze a contract first, then ask questions about it.";
    
    // 3 · Build messages for contract-specific question answering
    const messages = [
      new SystemMessage(
        `You are a contract analysis assistant. Your role is to answer questions about contract content concisely and directly.

Guidelines:
- Provide SHORT, TO-THE-POINT answers (1-3 sentences maximum)
- Focus on the most relevant information only
- Use direct quotes from the contract when essential
- Be precise and avoid unnecessary explanations
- If the information is not in the contract, say "Not specified in the contract"
- Keep responses under 100 words

Original question: ${questionData.originalQuestion}
Enhanced question: ${questionData.enhancedQuestion}
Key terms identified: ${questionData.keyTerms.join(', ')}`
      ),
      new HumanMessage(`Question: ${questionData.enhancedQuestion}\n\nContract Content:\n${contractText}`),
    ];

    // 3 · Stream Gemini response
    const stream = await chat.stream(messages);

    for await (const chunk of stream) {
      console.log("Received chunk from Gemini:", chunk);
      
      // Handle different chunk formats
      if (chunk.content && Array.isArray(chunk.content)) {
        for (const part of chunk.content) {
          if (part.type === "text") {
            console.log("Yielding text part:", part.text);
            yield part.text;
          }
        }
      } else if (typeof chunk.content === "string") {
        console.log("Yielding string content:", chunk.content);
        yield chunk.content;
      } else if (chunk.text) {
        console.log("Yielding text property:", chunk.text);
        yield chunk.text;
      } else {
        console.log("Unknown chunk format:", chunk);
      }
    }

    // mark end
    yield "[DONE]";
  } catch (error) {
    console.error("Error in chatWithDocs:", error);
    yield `Error: ${error.message}`;
    yield "[DONE]";
  }
}

export async function POST(req) {
  try {
    const { prompt, contractContent } = await req.json();
    
    console.log("Received request:", { prompt: prompt?.substring(0, 100), contractContent: contractContent ? "Present" : "Not provided" });

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return new Response(JSON.stringify({ error: "Empty prompt" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if API key is configured
    if (!config.geminiApiKey) {
      return new Response(
        JSON.stringify({ 
          error: "Gemini API key not configured. Please set NEXT_APP_GEMINI_API_KEY environment variable." 
        }), 
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log("Starting to stream response for prompt:", prompt.trim());
          for await (const chunk of chatWithDocs(prompt.trim(), contractContent)) {
            const message = `data: ${chunk}\n\n`;
            console.log("Sending chunk:", message);
            controller.enqueue(encoder.encode(message));
          }
          console.log("Streaming complete, closing controller");
          controller.close();
        } catch (err) {
          console.error("API error:", err);
          const errorMessage = `data: Error: ${err.message}\n\n`;
          controller.enqueue(encoder.encode(errorMessage));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("POST handler error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }), 
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
