import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import config from "@/config";

export async function GET() {
  try {
    // Check if API key is configured
    if (!config.geminiApiKey) {
      return new Response(
        JSON.stringify({ 
          error: "Gemini API key not configured",
          message: "Please set NEXT_APP_GEMINI_API_KEY environment variable"
        }), 
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Test Gemini connection
    const chat = new ChatGoogleGenerativeAI({
      apiKey: config.geminiApiKey,
      model: "gemini-1.5-flash",
      temperature: 0.1,
      maxOutputTokens: 100,
    });

    const response = await chat.invoke([
      new HumanMessage("Say 'Hello from Gemini!' in one sentence.")
    ]);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Gemini API is working!",
        response: response.content,
        model: "gemini-1.5-flash"
      }), 
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Gemini test error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Gemini API test failed",
        message: error.message,
        details: error.toString()
      }), 
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
