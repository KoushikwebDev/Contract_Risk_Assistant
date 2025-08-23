const config = {
    supabaseKey : process.env.NEXT_APP_SUPABASE_API_KEY,
    supabaseUrl : process.env.NEXT_APP_SUPABASE_URL,
    openAiKey : process.env.NEXT_APP_OPENAI_API_KEY,
    geminiApiKey : process.env.NEXT_APP_GEMINI_API_KEY,
};

// Add validation and logging for debugging
if (!config.geminiApiKey) {
    console.warn("⚠️  Gemini API key not found. Please set NEXT_APP_GEMINI_API_KEY environment variable.");
}

export default config;