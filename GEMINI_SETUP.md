# Gemini AI Setup Guide

## Overview
This project uses Google's Gemini AI model (`gemini-1.5-flash`) for contract risk analysis with Supabase vector search.

## Setup Steps

### 1. Get Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

### 2. Environment Variables
Create a `.env.local` file in your project root with:

```env
# Gemini API Key
NEXT_APP_GEMINI_API_KEY=your_gemini_api_key_here

# Supabase (if not already set)
NEXT_APP_SUPABASE_API_KEY=your_supabase_api_key
NEXT_APP_SUPABASE_URL=your_supabase_url
```

### 3. Test the Setup
1. Start your development server: `npm run dev`
2. Go to `/chat` page
3. Click "Test Gemini Connection" button
4. If successful, you'll see a green checkmark and response

## Troubleshooting

### Common Issues

#### 1. "Gemini API key not configured" Error
- Check that `NEXT_APP_GEMINI_API_KEY` is set in `.env.local`
- Restart your development server after adding environment variables
- Verify the API key is valid at [Google AI Studio](https://makersuite.google.com/app/apikey)

#### 2. "Gemini API test failed" Error
- Check your internet connection
- Verify the API key has proper permissions
- Check the browser console for detailed error messages

#### 3. No Response from Chat
- Use the "Test Gemini Connection" button first
- Check browser network tab for API errors
- Verify Supabase is properly configured for vector search

### Debug Steps
1. Check browser console for errors
2. Check terminal/server logs for API errors
3. Test Gemini connection using the test button
4. Verify all environment variables are set correctly

## Model Information
- **Model**: `gemini-1.5-flash`
- **Type**: Free tier friendly
- **Features**: Streaming responses, context-aware responses
- **Limits**: 1024 max output tokens per response

## API Endpoints
- `/api/ask` - Main chat endpoint with Supabase context
- `/api/test-gemini` - Test endpoint for Gemini connectivity

## Features
- ✅ Streaming responses
- ✅ Supabase vector search integration
- ✅ Error handling and user feedback
- ✅ Modern UI with loading states
- ✅ Quick action buttons for common questions
