import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createQuestionChain } from "@/lib/questionChain";
import config from "@/config";

// Gemini chat model (non-streaming for testing)
const chat = new ChatGoogleGenerativeAI({
  apiKey: config.geminiApiKey,
  model: "gemini-1.5-flash",
  temperature: 0.2,
  maxOutputTokens: 1024,
  streaming: false, // Non-streaming for testing
});

export async function POST(req) {
  try {
    const { prompt, contractContent } = await req.json();

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

    console.log("Processing prompt:", prompt.trim());

    // 1 · Process question through question chain
    const questionData = await createQuestionChain(prompt.trim());
    console.log("Question chain result:", questionData);

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

    // 3 · Get Gemini response
    console.log("Calling Gemini API...");
    const response = await chat.invoke(messages);
    console.log("Gemini response received:", response.content);

    return new Response(
      JSON.stringify({ 
        answer: response.content,
        questionData: questionData
      }), 
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("POST handler error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error.message 
      }), 
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
