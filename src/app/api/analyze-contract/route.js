import { analyzeContract, generateRiskSummary } from "@/lib/contractAnalyzer";
import config from "@/config";

export async function POST(req) {
  try {
    const { contractContent, contractId } = await req.json();

    if (!contractContent || !contractId) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields: contractContent and contractId" 
        }), 
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
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

    console.log("Starting contract analysis for ID:", contractId);

    // Analyze the contract
    const analysis = await analyzeContract(contractContent, contractId);
    
    // Generate summary for display
    const summary = generateRiskSummary(analysis);

    return new Response(
      JSON.stringify({ 
        success: true,
        analysis: analysis,
        summary: summary,
        contractId: contractId
      }), 
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Contract analysis API error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Contract analysis failed",
        message: error.message 
      }), 
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
