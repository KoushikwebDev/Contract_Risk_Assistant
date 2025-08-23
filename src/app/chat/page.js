"use client";
import { useState } from "react";

export default function Ask() {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [prompt, setPrompt] = useState("");
  const [questionData, setQuestionData] = useState(null);
  const [contractAnalysis, setContractAnalysis] = useState(null);
  const [analyzingContract, setAnalyzingContract] = useState(false);
  const [contractContent, setContractContent] = useState("");
  const [contractInput, setContractInput] = useState("");
  const [analysisResponse, setAnalysisResponse] = useState("");

  async function askApi(userPrompt) {
    setAnswer("");
    setError("");
    setQuestionData(null);
    setLoading(true);

    try {
      console.log("Sending request to /api/ask with prompt:", userPrompt);
      
      const res = await fetch("/api/ask", {
        method: "POST",
        body: JSON.stringify({ 
          prompt: userPrompt,
          contractContent: contractContent
        }),
        headers: { "Content-Type": "application/json" },
      });

      console.log("Response status:", res.status);
      console.log("Response headers:", Object.fromEntries(res.headers.entries()));

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      if (!res.body) {
        throw new Error("No response body");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      console.log("Starting to read stream...");

      try {
        while (true) {
          const { value, done } = await reader.read();
          
          if (done) {
            console.log("Stream finished");
            break;
          }
          
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            console.log("Received chunk:", chunk);
            
            buffer += chunk;
            
            // Process complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer
            
            for (const line of lines) {
              console.log("Processing line:", line);
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim(); // Remove 'data: ' prefix
                console.log("Extracted data:", data);
                
                if (data === '[DONE]') {
                  console.log("Received [DONE] signal");
                  setLoading(false);
                  return;
                }
                
                if (data.startsWith('Error:')) {
                  console.log("Received error:", data);
                  setError(data);
                  setLoading(false);
                  return;
                }
                
                if (data) {
                  console.log("Adding to answer:", data);
                  setAnswer((prev) => prev + data);
                }
              }
            }
          }
        }
      } catch (streamError) {
        console.error("Stream reading error:", streamError);
        setError(`Stream error: ${streamError.message}`);
        setLoading(false);
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
      setLoading(false);
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim()) {
      askApi(prompt.trim());
    }
  };

  // Fallback to simple API if streaming fails
  const askApiSimple = async (userPrompt) => {
    try {
      console.log("Falling back to simple API...");
      const res = await fetch("/api/ask-simple", {
        method: "POST",
        body: JSON.stringify({ 
          prompt: userPrompt,
          contractContent: contractContent
        }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.answer) {
        setAnswer(`✅ Response (Simple API):\n\n${data.answer}`);
      } else {
        setError(`❌ ${data.error}: ${data.message}`);
      }
    } catch (err) {
      setError(`Simple API fallback failed: ${err.message}`);
    }
    setLoading(false);
  };

  // Analyze contract content
  const analyzeContractContent = async (contractText) => {
    setAnalyzingContract(true);
    setError("");
    setContractAnalysis(null);
    setAnalysisResponse("");
    setContractContent(contractText); // Store contract content for questions
    
    try {
      const contractId = `contract_${Date.now()}`;
      
      const res = await fetch("/api/analyze-contract", {
        method: "POST",
        body: JSON.stringify({ 
          contractContent: contractText,
          contractId: contractId
        }),
        headers: { "Content-Type": "application/json" },
      });
      
      const data = await res.json();
      
      if (data.success) {
        setContractAnalysis(data.analysis);
        setAnalysisResponse(`✅ Contract Analysis Complete!\n\n${data.summary}`);
      } else {
        setError(`❌ Analysis failed: ${data.error}`);
      }
    } catch (err) {
      setError(`Contract analysis failed: ${err.message}`);
    }
    
    setAnalyzingContract(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Contract Risk Assistant AI</h1>
          <p className="text-gray-600">Ask questions about contract risks and get AI-powered insights from your documents.</p>
        </div>

        {/* Contract Analysis Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Contract Analysis</h2>
          <p className="text-gray-600 mb-4">Paste your contract text below for AI-powered risk analysis and scoring.</p>
          
          <div className="space-y-4">
            <textarea
              placeholder="Paste your contract text here... (e.g., Service Agreement, NDA, Employment Contract, etc.)"
              className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 placeholder-gray-500 bg-white disabled:bg-gray-50 disabled:text-gray-500"
              rows="6"
              disabled={analyzingContract}
              value={contractInput}
              onChange={(e) => setContractInput(e.target.value)}
            />
                          <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {contractInput.length} characters
                </div>
                <button
                  onClick={() => analyzeContractContent(contractInput)}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                  disabled={analyzingContract || !contractInput.trim()}
                >
                {analyzingContract ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Analyzing...
                  </div>
                ) : (
                  "Analyze Contract"
                )}
              </button>
            </div>
          </div>
        </div>
      
              <form onSubmit={handleSubmit} className="mb-6">
          <div className="space-y-3">
            {contractContent && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Contract loaded! You can now ask questions about this contract.</span>
                </div>
              </div>
            )}
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={contractContent ? "Ask questions about the contract... (e.g., What are the payment terms? What happens if there's a breach?)" : "Ask about contract risk..."}
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 placeholder-gray-500 bg-white disabled:bg-gray-50 disabled:text-gray-500"
                rows="3"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (prompt.trim() && !loading) {
                      handleSubmit(e);
                    }
                  }
                }}
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                Press Enter to send, Shift+Enter for new line
              </div>
            </div>
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {prompt.length} characters
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
              disabled={loading || !prompt.trim()}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                "Ask Question"
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Test buttons */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">System Tests</h3>
        <div className="flex flex-wrap gap-2">
          <button
            className="bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-400 text-sm transition-colors duration-200"
            onClick={async () => {
              setLoading(true);
              setError("");
              try {
                const res = await fetch("/api/test-gemini");
                const data = await res.json();
                if (data.success) {
                  setAnswer(`✅ ${data.message}\n\nResponse: ${data.response}`);
                } else {
                  setError(`❌ ${data.error}: ${data.message}`);
                }
              } catch (err) {
                setError(`Test failed: ${err.message}`);
              }
              setLoading(false);
            }}
            disabled={loading}
          >
            Test Gemini Connection
          </button>
          
          <button
            className="bg-orange-500 text-white px-3 py-2 rounded-md hover:bg-orange-600 disabled:bg-gray-400 text-sm transition-colors duration-200"
            onClick={async () => {
              setLoading(true);
              setError("");
              try {
                const res = await fetch("/api/ask-simple", {
                  method: "POST",
                  body: JSON.stringify({ prompt: "What is contract risk?" }),
                  headers: { "Content-Type": "application/json" },
                });
                const data = await res.json();
                if (data.answer) {
                  setAnswer(`✅ Simple API Response:\n\n${data.answer}\n\nDocs found: ${data.docsFound}`);
                  if (data.questionData) {
                    setQuestionData(data.questionData);
                  }
                } else {
                  setError(`❌ ${data.error}: ${data.message}`);
                }
              } catch (err) {
                setError(`Simple API failed: ${err.message}`);
              }
              setLoading(false);
            }}
            disabled={loading}
          >
            Test Simple API
          </button>
          
          <button
            className="bg-purple-500 text-white px-3 py-2 rounded-md hover:bg-purple-600 disabled:bg-gray-400 text-sm transition-colors duration-200"
            onClick={() => askApiSimple("What is contract risk?")}
            disabled={loading}
          >
            Test Fallback
          </button>
        </div>
      </div>

      {/* Quick action buttons */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          {contractContent ? "Contract Questions" : "Quick Questions"}
        </h3>
        <div className="flex flex-wrap gap-2">
          {contractContent ? (
            <>
              <button
                className="bg-blue-50 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 text-sm transition-colors duration-200 border border-blue-200"
                onClick={() => askApi("What are the payment terms in this contract?")}
                disabled={loading}
              >
                Payment terms
              </button>
              <button
                className="bg-blue-50 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 text-sm transition-colors duration-200 border border-blue-200"
                onClick={() => askApi("What are the liability clauses in this contract?")}
                disabled={loading}
              >
                Liability clauses
              </button>
              <button
                className="bg-blue-50 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 text-sm transition-colors duration-200 border border-blue-200"
                onClick={() => askApi("What happens if there's a breach of this contract?")}
                disabled={loading}
              >
                Breach consequences
              </button>
              <button
                className="bg-blue-50 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 text-sm transition-colors duration-200 border border-blue-200"
                onClick={() => askApi("What are the termination conditions in this contract?")}
                disabled={loading}
              >
                Termination conditions
              </button>
            </>
          ) : (
            <>
              <button
                className="bg-blue-50 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 text-sm transition-colors duration-200 border border-blue-200"
                onClick={() => askApi("What is contract risk?")}
                disabled={loading}
              >
                What is contract risk?
              </button>
              <button
                className="bg-blue-50 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 text-sm transition-colors duration-200 border border-blue-200"
                onClick={() => askApi("How to mitigate contract risks?")}
                disabled={loading}
              >
                How to mitigate contract risks?
              </button>
              <button
                className="bg-blue-50 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 text-sm transition-colors duration-200 border border-blue-200"
                onClick={() => askApi("What are common contract risk factors?")}
                disabled={loading}
              >
                Common risk factors
              </button>
            </>
          )}
        </div>
        
        {/* Question Response Section */}
        {answer && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Answer
            </h4>
            <div className="whitespace-pre-wrap text-blue-900 leading-relaxed text-sm">
              {answer}
            </div>
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-1 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Question processing info */}
      {questionData && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Question Processing
          </h3>
          <div className="text-sm text-blue-700 space-y-2">
            <div><strong>Original:</strong> {questionData.originalQuestion}</div>
            <div><strong>Enhanced:</strong> {questionData.enhancedQuestion}</div>
            <div><strong>Key Terms:</strong> {questionData.keyTerms.join(', ')}</div>
          </div>
        </div>
      )}



      {/* Contract Analysis Results */}
      {contractAnalysis && (
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <svg className="h-5 w-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Contract Risk Analysis
          </h2>
          
          {/* Overall Risk Score */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800">Overall Risk Assessment</h3>
              <div className="flex gap-2">
                {contractAnalysis.context_used && (
                  <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center gap-1">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {contractAnalysis.context_used} KB refs
                  </div>
                )}
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  contractAnalysis.risk_level === 'Critical' ? 'bg-red-100 text-red-800' :
                  contractAnalysis.risk_level === 'High' ? 'bg-orange-100 text-orange-800' :
                  contractAnalysis.risk_level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {contractAnalysis.risk_level} Risk
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-gray-800">
                {contractAnalysis.overall_risk_score}/100
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${
                    contractAnalysis.overall_risk_score >= 75 ? 'bg-red-500' :
                    contractAnalysis.overall_risk_score >= 50 ? 'bg-orange-500' :
                    contractAnalysis.overall_risk_score >= 25 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${contractAnalysis.overall_risk_score}%` }}
                ></div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">{contractAnalysis.overall_summary}</p>
          </div>

          {/* Individual Risks */}
          {contractAnalysis.risks && contractAnalysis.risks.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Identified Risks</h3>
              {contractAnalysis.risks.map((risk, index) => (
                <div key={risk.risk_id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-lg font-medium text-gray-800">{index + 1}. {risk.title}</h4>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        risk.severity === 'High' ? 'bg-red-100 text-red-800' :
                        risk.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {risk.severity}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        risk.likelihood === 'High' ? 'bg-red-100 text-red-800' :
                        risk.likelihood === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {risk.likelihood}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {risk.score}/100
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong className="text-gray-800">Category:</strong> <span className="text-gray-800">{risk.category}</span>
                    </div>
                    <div>
                      <strong className="text-gray-800">Why Risky:</strong> <span className="text-gray-800">{risk.why_risky}</span>
                    </div>
                    
                    {risk.evidence && risk.evidence.length > 0 && (
                      <div>
                        <strong className="text-gray-800">Evidence:</strong>
                        <div className="mt-1 space-y-1">
                          {risk.evidence.map((evidence, idx) => (
                            <div key={idx} className="bg-gray-50 p-2 rounded text-xs">
                              <div className="flex items-center justify-between">
                                <strong className="text-gray-800">{evidence.section_ref}:</strong>
                                {evidence.context_supported && (
                                  <span className="text-blue-600 text-xs flex items-center gap-1">
                                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    KB supported
                                  </span>
                                )}
                              </div>
                              <div className="italic text-gray-800">"{evidence.quote}"</div>
                              <div className="text-gray-600">Confidence: {Math.round(evidence.confidence * 100)}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {risk.mitigations && risk.mitigations.length > 0 && (
                      <div>
                        <strong className="text-gray-800">Mitigations:</strong>
                        <ul className="mt-1 list-disc list-inside space-y-1">
                          {risk.mitigations.map((mitigation, idx) => (
                            <li key={idx} className="text-xs text-gray-800">{mitigation}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {risk.redline_suggestion && (
                      <div>
                        <strong className="text-gray-800">Redline Suggestion:</strong>
                        <div className="mt-1 bg-yellow-50 p-2 rounded text-xs border-l-4 border-yellow-400 text-gray-800">
                          {risk.redline_suggestion}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analysis Response Section */}
      {analysisResponse && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-green-800 mb-2 flex items-center">
            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Analysis Complete
          </h3>
          <div className="whitespace-pre-wrap text-green-900 leading-relaxed text-sm">
            {analysisResponse}
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-500"></div>
          <p className="mt-4 text-gray-600 font-medium">Getting response from Gemini...</p>
          <p className="text-sm text-gray-500">This may take a few moments</p>
        </div>
      )}
      </div>
    </div>
  );
}
