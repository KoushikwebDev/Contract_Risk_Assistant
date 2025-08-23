import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { fetchRelevantDocs } from "@/lib/search";
import config from "@/config";

// ✅ Normalizer
function normalizeEnum(value, type = "risk_level") {
  if (!value) return type === "risk_level" ? "Medium" : "Medium";
  const v = String(value).toLowerCase();

  if (type === "risk_level") {
    if (v.includes("low")) return "Low";
    if (v.includes("medium")) return "Medium";
    if (v.includes("high")) return "High";
    if (v.includes("critical")) return "Critical";
    return "Medium";
  }

  if (type === "severity" || type === "likelihood") {
    if (v.includes("high")) return "High";
    if (v.includes("medium")) return "Medium";
    if (v.includes("low")) return "Low";
    return "Medium";
  }

  return "Medium";
}

// Risk Analysis Schema
const RiskSchema = z.object({
  contract_id: z.string(),
  generated_at: z.string(),
  overall_summary: z.string(),
  overall_risk_score: z.number().min(0).max(100),
  risk_level: z.enum(['Low', 'Medium', 'High', 'Critical']),
  context_used: z.number().optional(),
  risks: z.array(z.object({
    risk_id: z.string(),
    title: z.string(),
    category: z.string(),
    severity: z.enum(['High', 'Medium', 'Low']),
    likelihood: z.enum(['High', 'Medium', 'Low']),
    score: z.number().min(0).max(100),
    why_risky: z.string(),
    evidence: z.array(z.object({
      section_ref: z.string(),
      quote: z.string(),
      confidence: z.number().min(0).max(1),
      context_supported: z.boolean().optional()
    })).min(1),
    mitigations: z.array(z.string()).min(1),
    redline_suggestion: z.string(),
    tags: z.array(z.string()).optional()
  }))
});

// Contract analysis model
const contractAnalyzer = new ChatGoogleGenerativeAI({
  apiKey: config.geminiApiKey,
  model: "gemini-1.5-flash",
  temperature: 0.1,
  maxOutputTokens: 4000,
});

// Key term extraction model
const keyTermExtractor = new ChatGoogleGenerativeAI({
  apiKey: config.geminiApiKey,
  model: "gemini-1.5-flash",
  temperature: 0.1,
  maxOutputTokens: 500,
});

/**
 * Extract key terms from contract content for vector search
 * @param {string} contractContent - The contract text content
 * @returns {Promise<string[]>} - Array of key terms
 */
async function extractContractKeyTerms(contractContent) {
  try {
    const systemPrompt = `Extract 10-15 key terms from the contract that would be useful for finding relevant risk analysis information in a knowledge base.

Focus on:
- Legal terms (liability, indemnification, breach, termination, etc.)
- Risk-related terms (mitigation, assessment, exposure, etc.)
- Contract-specific terms (clauses, terms, conditions, etc.)
- Industry-specific terms
- Financial terms (payment, penalty, damages, etc.)

Return only the terms separated by commas, no explanations.`;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(`Contract content: ${contractContent.substring(0, 2000)}`)
    ];

    const response = await keyTermExtractor.invoke(messages);
    const terms = response.content.trim().split(',').map(term => term.trim());
    
    return terms.filter(term => term.length > 0);
  } catch (error) {
    console.error("Error extracting key terms:", error);
    return [];
  }
}

/**
 * Analyze contract content and generate risk assessment with vector database context
 * @param {string} contractContent - The contract text content
 * @param {string} contractId - Unique identifier for the contract
 * @returns {Promise<Object>} - Risk analysis results
 */
export async function analyzeContract(contractContent, contractId) {
  try {
    console.log("Starting contract analysis for:", contractId);

    // Step 1: Extract key terms from contract for vector search
    console.log("Extracting key terms for vector search...");
    const keyTerms = await extractContractKeyTerms(contractContent);
    console.log("Extracted key terms:", keyTerms);

    // Step 2: Retrieve relevant context from vector database
    console.log("Retrieving relevant context from vector database...");
    const searchQuery = keyTerms.length > 0 
      ? `${contractContent.substring(0, 500)} ${keyTerms.join(' ')}`
      : contractContent.substring(0, 1000);
    
    const relevantDocs = await fetchRelevantDocs(searchQuery, 8);
    console.log("Found relevant documents:", relevantDocs?.length || 0);

    // Step 3: Build context from vector database
    let vectorContext = "";
    if (relevantDocs && relevantDocs.length > 0) {
      vectorContext = relevantDocs
        .map((doc, i) => 
          `[Reference ${i + 1} | Similarity: ${(doc.similarity || 0).toFixed(2)}]\n${doc.content}`
        )
        .join("\n\n");
    }

    const systemPrompt = `You are a professional contract risk analyst specializing in identifying and assessing risks in business contracts.

Your task is to:
1. Analyze the contract content thoroughly
2. Use the provided knowledge base context to enhance your analysis
3. Identify potential risks across different categories
4. Provide evidence from the contract text and knowledge base
5. Suggest mitigations and redline recommendations based on best practices
6. Calculate risk scores based on severity and likelihood

Risk Categories to focus on:
- Payment and Financial Risks
- Liability and Indemnification
- Termination and Breach
- Intellectual Property
- Confidentiality and Data Protection
- Force Majeure and Unforeseen Events
- Dispute Resolution
- Regulatory Compliance

For each risk identified:
- Provide specific quotes from the contract as evidence
- Reference relevant knowledge base information when applicable
- Assess severity (High/Medium/Low) and likelihood (High/Medium/Low)
- Calculate a risk score (0-100)
- Suggest practical mitigations based on best practices
- Provide redline suggestions for contract improvement

Use the knowledge base context to:
- Identify industry-specific risks
- Provide more accurate risk assessments
- Suggest proven mitigation strategies
- Reference relevant case studies or examples

Output must be valid JSON following the exact schema provided.`;

    const analysisPrompt = `
Contract Content:
${contractContent}

Knowledge Base Context (for enhanced analysis):
${vectorContext || "No relevant context found in knowledge base."}

Please analyze this contract using both the contract content and the knowledge base context to provide a comprehensive risk assessment.

Return the analysis in the following JSON format:
{
  "contract_id": "${contractId}",
  "generated_at": "${new Date().toISOString()}",
  "overall_summary": "Brief summary of the contract and overall risk assessment",
  "overall_risk_score": 75,
  "risk_level": "High",
  "context_used": ${relevantDocs ? relevantDocs.length : 0},
  "risks": [
    {
      "risk_id": "risk_001",
      "title": "Payment Delay Risk",
      "category": "Financial",
      "severity": "High",
      "likelihood": "Medium",
      "score": 75,
      "why_risky": "Explanation of why this is risky",
      "evidence": [
        {
          "section_ref": "Section 3.2",
          "quote": "Exact quote from contract",
          "confidence": 0.9,
          "context_supported": true
        }
      ],
      "mitigations": ["Specific mitigation strategies"],
      "redline_suggestion": "Suggested contract language changes",
      "tags": ["payment", "financial"]
    }
  ]
}

Ensure all risk scores are between 0-100 and confidence levels between 0-1.`;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(analysisPrompt)
    ];

    console.log("Sending contract to Gemini for analysis...");
    const response = await contractAnalyzer.invoke(messages);
    
    console.log("Received analysis response, parsing JSON...");
    const analysisText = response.content;
    
    // Extract JSON from the response (in case there's extra text)
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }
    
    const parsedAnalysis = JSON.parse(jsonMatch[0]);

    // ✅ Normalize enums before validation
    parsedAnalysis.risk_level = normalizeEnum(parsedAnalysis.risk_level, "risk_level");
    parsedAnalysis.risks = parsedAnalysis.risks?.map(risk => ({
      ...risk,
      severity: normalizeEnum(risk.severity, "severity"),
      likelihood: normalizeEnum(risk.likelihood, "likelihood")
    })) || [];

    // Validate against schema
    const validatedAnalysis = RiskSchema.parse(parsedAnalysis);
    
    console.log("Contract analysis completed successfully");
    return validatedAnalysis;

  } catch (error) {
    console.error("Error analyzing contract:", error);
    
    // Return a basic error structure
    return {
      contract_id: contractId,
      generated_at: new Date().toISOString(),
      overall_summary: "Analysis failed due to an error",
      overall_risk_score: 0,
      risk_level: "Unknown",
      risks: [],
      error: error.message
    };
  }
}

/**
 * Calculate overall risk score from individual risks
 * @param {Array} risks - Array of risk objects
 * @returns {Object} - Overall risk metrics
 */
export function calculateOverallRisk(risks) {
  if (!risks || risks.length === 0) {
    return {
      overall_risk_score: 0,
      risk_level: "Low"
    };
  }

  const totalScore = risks.reduce((sum, risk) => sum + risk.score, 0);
  const averageScore = totalScore / risks.length;
  
  let riskLevel = "Low";
  if (averageScore >= 75) riskLevel = "Critical";
  else if (averageScore >= 50) riskLevel = "High";
  else if (averageScore >= 25) riskLevel = "Medium";

  return {
    overall_risk_score: Math.round(averageScore),
    risk_level: riskLevel
  };
}

/**
 * Generate risk summary for display
 * @param {Object} analysis - Risk analysis results
 * @returns {string} - Formatted summary
 */
export function generateRiskSummary(analysis) {
  if (analysis.error) {
    return `Analysis Error: ${analysis.error}`;
  }

  const { overall_risk_score, risk_level, risks, context_used } = analysis;
  
  let summary = `Overall Risk Score: ${overall_risk_score}/100 (${risk_level} Risk Level)\n`;
  if (context_used) {
    summary += `Enhanced with ${context_used} knowledge base references\n`;
  }
  summary += `\nFound ${risks.length} potential risks:\n\n`;
  
  risks.forEach((risk, index) => {
    summary += `${index + 1}. ${risk.title} (${risk.category})\n`;
    summary += `   Severity: ${risk.severity} | Likelihood: ${risk.likelihood} | Score: ${risk.score}/100\n`;
    summary += `   Why Risky: ${risk.why_risky}\n`;
    summary += `   Mitigations: ${risk.mitigations.join(', ')}\n`;
    if (risk.evidence && risk.evidence.some(e => e.context_supported)) {
      summary += `   📚 Knowledge base supported\n`;
    }
    summary += `\n`;
  });
  
  return summary;
}
