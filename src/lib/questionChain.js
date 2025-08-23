import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import config from "@/config";

// Question processing model
const questionProcessor = new ChatGoogleGenerativeAI({
  apiKey: config.geminiApiKey,
  model: "gemini-1.5-flash",
  temperature: 0.1,
  maxOutputTokens: 200,
});

/**
 * Process and enhance user questions for better LLM responses
 * @param {string} userInput - Raw user input
 * @returns {Promise<string>} - Enhanced question
 */
export async function processQuestion(userInput) {
  try {
    const systemPrompt = `You are a question enhancement specialist for contract risk analysis. 
    
Your task is to:
1. Clarify vague questions
2. Add context about contract risk if missing
3. Make questions more specific and actionable
4. Keep the enhanced question concise and focused
5. Maintain the original intent of the user

Examples:
- "What is risk?" → "What are the key types of risks in business contracts?"
- "How to avoid problems?" → "What are the best practices to avoid common contract risks?"
- "Tell me about liability" → "What are the different types of liability clauses in contracts and how do they protect parties?"

Return only the enhanced question, nothing else.`;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(`Original question: ${userInput}`)
    ];

    const response = await questionProcessor.invoke(messages);
    return response.content.trim();
  } catch (error) {
    console.error("Error processing question:", error);
    // Return original input if processing fails
    return userInput;
  }
}

/**
 * Extract key terms from user question for better search
 * @param {string} question - User question
 * @returns {Promise<string[]>} - Array of key terms
 */
export async function extractKeyTerms(question) {
  try {
    const systemPrompt = `Extract 3-5 key terms from the question that would be useful for searching contract risk documents. 
    
Focus on:
- Legal terms (liability, indemnification, breach, etc.)
- Risk-related terms (mitigation, assessment, exposure, etc.)
- Contract-specific terms (clauses, terms, conditions, etc.)

Return only the terms separated by commas, no explanations.`;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(`Question: ${question}`)
    ];

    const response = await questionProcessor.invoke(messages);
    return response.content.trim().split(',').map(term => term.trim());
  } catch (error) {
    console.error("Error extracting key terms:", error);
    return [];
  }
}

/**
 * Create a comprehensive question chain
 * @param {string} userInput - Raw user input
 * @returns {Promise<Object>} - Processed question data
 */
export async function createQuestionChain(userInput) {
  try {
    console.log("Processing question chain for:", userInput);
    
    // Step 1: Process and enhance the question
    const enhancedQuestion = await processQuestion(userInput);
    console.log("Enhanced question:", enhancedQuestion);
    
    // Step 2: Extract key terms for search
    const keyTerms = await extractKeyTerms(enhancedQuestion);
    console.log("Key terms:", keyTerms);
    
    // Step 3: Create search query combining original and enhanced
    const searchQuery = keyTerms.length > 0 
      ? `${enhancedQuestion} ${keyTerms.join(' ')}`
      : enhancedQuestion;
    
    return {
      originalQuestion: userInput,
      enhancedQuestion: enhancedQuestion,
      keyTerms: keyTerms,
      searchQuery: searchQuery,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error in question chain:", error);
    return {
      originalQuestion: userInput,
      enhancedQuestion: userInput,
      keyTerms: [],
      searchQuery: userInput,
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}
