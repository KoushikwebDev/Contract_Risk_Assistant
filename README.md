# Contract Analysis AI

An AI-powered contract risk analysis platform built with Next.js, Google Gemini AI, and Supabase vector database. This application provides intelligent contract analysis, risk assessment, and interactive Q&A capabilities for legal documents.

## Features

- **AI-Powered Contract Analysis**: Comprehensive risk assessment using Google Gemini AI
- **Vector Search**: Semantic search through contract knowledge base using Supabase
- **Interactive Chat**: Ask questions about contracts and get AI-powered responses
- **Risk Scoring**: Detailed risk analysis with severity levels and mitigation strategies
- **Streaming Responses**: Real-time AI responses with streaming support
- **Document Ingestion**: PDF processing and vector embedding for enhanced search

## Installation

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Supabase account
- Google AI Studio account (for Gemini API)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd agentic-ai
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 3. Environment Setup

Create a `.env` file in the project root with the following variables:

```env
# Supabase Configuration
NEXT_APP_SUPABASE_URL=your_supabase_project_url
NEXT_APP_SUPABASE_API_KEY=your_supabase_anon_key

# Google Gemini AI Configuration
NEXT_APP_GEMINI_API_KEY=your_gemini_api_key

# OpenAI Configuration (Optional - for alternative embeddings)
NEXT_APP_OPENAI_API_KEY=your_openai_api_key
```

#### Getting API Keys:

**Supabase Setup:**
1. Go to [Supabase](https://supabase.com) and create a new project
2. Navigate to Settings > API
3. Copy your Project URL and anon/public key
4. Set up the vector database using the provided `supabase_table.sql`

**Google Gemini API:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key to your environment variables

### 4. Database Setup

Execute the SQL commands in `supabase_table.sql` in your Supabase SQL editor to create the required tables and functions for vector search.

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── actions/
│   └── ingest.js              # Document ingestion logic
├── app/
│   ├── api/                   # API routes
│   │   ├── analyze-contract/  # Contract analysis endpoint
│   │   ├── ask/              # Main chat endpoint with streaming
│   │   ├── ask-simple/       # Simple chat endpoint (fallback)
│   │   └── test-gemini/      # Gemini API test endpoint
│   ├── chat/                 # Chat interface page
│   ├── globals.css           # Global styles
│   ├── layout.js             # Root layout
│   └── page.js               # Home page
├── config/
│   └── index.js              # Environment configuration
└── lib/
    ├── chat.js               # Chat utilities
    ├── contractAnalyzer.js   # Contract risk analysis logic
    ├── embeddings.js         # Vector embeddings configuration
    ├── questionChain.js      # Question processing and enhancement
    ├── search.js             # Vector search functionality
    ├── supabaseClient.js     # Supabase client configuration
    └── upsert.js             # Document upsert utilities
```

## API Routes

### `/api/analyze-contract` (POST)
Analyzes contract content and provides comprehensive risk assessment.

**Request Body:**
```json
{
  "contractContent": "string",
  "contractId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "contract_id": "string",
    "overall_risk_score": 75,
    "risk_level": "High",
    "risks": [...],
    "overall_summary": "string"
  },
  "summary": "string"
}
```

### `/api/ask` (POST)
Main chat endpoint with streaming responses for contract questions.

**Request Body:**
```json
{
  "prompt": "string",
  "contractContent": "string (optional)"
}
```

**Response:** Server-Sent Events stream with AI responses

### `/api/ask-simple` (POST)
Simple chat endpoint without streaming (fallback option).

**Request Body:**
```json
{
  "prompt": "string",
  "contractContent": "string (optional)"
}
```

**Response:**
```json
{
  "answer": "string",
  "questionData": {
    "originalQuestion": "string",
    "enhancedQuestion": "string",
    "keyTerms": ["string"]
  }
}
```

### `/api/test-gemini` (GET)
Tests Gemini API connectivity and configuration.

**Response:**
```json
{
  "success": true,
  "message": "Gemini API is working!",
  "response": "string",
  "model": "gemini-1.5-flash"
}
```

## Core Functionality

### 1. Contract Analysis
- **Risk Assessment**: Comprehensive analysis of contract risks across multiple categories
- **Evidence Extraction**: Identifies specific contract clauses that pose risks
- **Risk Scoring**: Calculates risk scores based on severity and likelihood
- **Mitigation Strategies**: Provides actionable recommendations for risk reduction
- **Redline Suggestions**: Offers specific contract language improvements

### 2. Vector Search Integration
- **Semantic Search**: Uses Google Gemini embeddings for intelligent document retrieval
- **Context Enhancement**: Enriches AI responses with relevant knowledge base content
- **Similarity Matching**: Finds related contract clauses and risk patterns
- **Knowledge Base**: Maintains searchable repository of contract risk information

### 3. Interactive Chat Interface
- **Streaming Responses**: Real-time AI responses with typing indicators
- **Context Awareness**: Maintains conversation context for follow-up questions
- **Quick Actions**: Pre-defined buttons for common contract questions
- **Error Handling**: Graceful fallback mechanisms for API failures

### 4. Question Processing Chain
- **Question Enhancement**: Improves user queries for better AI responses
- **Key Term Extraction**: Identifies important terms for vector search
- **Context Building**: Combines user input with relevant knowledge base content
- **Response Optimization**: Ensures concise, relevant answers

### 5. Document Ingestion
- **PDF Processing**: Extracts text content from contract documents
- **Smart Chunking**: Divides documents into semantically meaningful segments
- **Vector Embedding**: Converts text chunks into searchable vector representations
- **Database Storage**: Stores embeddings in Supabase for fast retrieval

## Technology Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **AI/ML**: Google Gemini AI (gemini-1.5-flash), LangChain
- **Database**: Supabase (PostgreSQL with pgvector)
- **Vector Embeddings**: Google Generative AI Embeddings (text-embedding-004)
- **Validation**: Zod schema validation
- **Styling**: Tailwind CSS with custom components

## Configuration

The application uses environment variables for configuration. Key settings include:

- **Model Configuration**: Uses Gemini 1.5 Flash for optimal performance and cost
- **Embedding Model**: Google text-embedding-004 for vector representations
- **Temperature Settings**: Low temperature (0.1-0.2) for consistent, factual responses
- **Token Limits**: Configured for optimal response length and cost management

## Development

### Running Tests
```bash
# Test Gemini API connection
curl http://localhost:3000/api/test-gemini

# Test contract analysis
curl -X POST http://localhost:3000/api/analyze-contract \
  -H "Content-Type: application/json" \
  -d '{"contractContent": "sample contract text", "contractId": "test_001"}'
```

### Building for Production
```bash
npm run build
npm run start
```

## Troubleshooting

### Common Issues

1. **Gemini API Key Not Configured**
   - Ensure `NEXT_APP_GEMINI_API_KEY` is set in your `.env` file
   - Verify the API key is valid at Google AI Studio
   - Restart the development server after adding environment variables

2. **Supabase Connection Issues**
   - Check `NEXT_APP_SUPABASE_URL` and `NEXT_APP_SUPABASE_API_KEY`
   - Ensure the database schema is properly set up
   - Verify network connectivity to Supabase

3. **Vector Search Not Working**
   - Confirm the `match_documents` RPC function exists in Supabase
   - Check that documents have been properly ingested
   - Verify embedding model configuration

4. **Streaming Responses Failing**
   - Use the "Test Fallback" button to try the simple API
   - Check browser console for network errors
   - Verify server logs for detailed error messages

## License

This project is private and proprietary. All rights reserved.
