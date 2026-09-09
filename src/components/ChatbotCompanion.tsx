import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Sparkles,
  Bot,
  User,
  ExternalLink,
  Globe,
  Check,
  RefreshCw,
  Search,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { ChatMessage, UxSMission } from '../types';

interface ChatbotCompanionProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, model: string) => Promise<void>;
  isLoading: boolean;
  mission: UxSMission;
  onApplySuggestedUpdates: (updates: any) => void;
}

export const ChatbotCompanion: React.FC<ChatbotCompanionProps> = ({
  messages,
  onSendMessage,
  isLoading,
  mission,
  onApplySuggestedUpdates,
}) => {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite'>('gemini-3.5-flash');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput('');
    await onSendMessage(text, selectedModel);
  };

  const handleQuickPrompt = async (prompt: string) => {
    if (isLoading) return;
    await onSendMessage(prompt, selectedModel);
  };

  return (
    <div id="manta-ai-chatbot-container" className="flex-1 flex flex-col bg-[#070c17] text-slate-200 overflow-hidden font-sans">
      {/* Chatbot Header */}
      <div className="px-3.5 py-2.5 bg-[#0a1220] border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-purple-950/80 border border-purple-500/40 text-purple-300">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-cyan-100 font-sans">
              MANTA Companion AI
            </span>
            <span className="text-[10px] text-cyan-400 font-mono ml-2">
              Search Grounded
            </span>
          </div>
        </div>

        {/* Model Selector Badge */}
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3 h-3 text-slate-400" />
          <select
            id="gemini-model-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as any)}
            className="bg-[#111e33] text-[11px] font-mono text-cyan-200 border border-cyan-500/30 rounded px-2 py-0.5 outline-none cursor-pointer"
          >
            <option value="gemini-3.5-flash">gemini-3.5-flash (Search Grounded)</option>
            <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex Tasks)</option>
            <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra Fast)</option>
          </select>
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-slate-400">
              {msg.sender === 'user' ? (
                <>
                  <span>You</span>
                  <User className="w-3 h-3 text-cyan-400" />
                </>
              ) : (
                <>
                  <Bot className="w-3 h-3 text-purple-400" />
                  <span className="text-purple-300 font-semibold">MANTA Lens AI</span>
                  {msg.modelUsed && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950/60 border border-purple-800 text-purple-300">
                      {msg.modelUsed}
                    </span>
                  )}
                  <span>• {msg.timestamp}</span>
                </>
              )}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[92%] rounded-xl p-3.5 text-xs leading-relaxed shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-cyan-600 text-slate-950 font-medium ml-4'
                  : 'bg-[#0e192c] border border-cyan-500/25 text-slate-200 mr-4'
              }`}
            >
              <div className="markdown-body">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>

              {/* Actionable JSON Suggestion Card if assistant provided structured updates */}
              {msg.sender === 'assistant' && parseSuggestedUpdates(msg.text) && (
                <div className="mt-3 p-2.5 rounded-lg bg-[#070e1a] border border-emerald-500/40 text-[11px] font-sans">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Suggested Metadata Updates Detected
                    </span>
                    <button
                      onClick={() => onApplySuggestedUpdates(parseSuggestedUpdates(msg.text))}
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-[10px] font-mono transition-transform active:scale-95 cursor-pointer"
                    >
                      Apply to Form & Map
                    </button>
                  </div>
                  <div className="text-[10px] font-mono text-slate-300">
                    Click above to automatically update the form, coordinates, and GCMD keywords!
                  </div>
                </div>
              )}

              {/* Grounding Sources */}
              {msg.groundingSources && msg.groundingSources.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-cyan-500/20 text-[10px]">
                  <span className="text-slate-400 font-mono flex items-center gap-1 mb-1">
                    <Globe className="w-3 h-3 text-cyan-400" /> Google Search Sources:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.groundingSources.map((src, i) => (
                      <a
                        key={i}
                        href={src.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#13233c] hover:bg-[#1b3459] text-cyan-300 border border-cyan-500/30 transition-colors truncate max-w-[240px]"
                      >
                        <span className="truncate">{src.title || src.uri}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#0e192c] border border-cyan-500/20 text-xs text-cyan-300 font-mono animate-pulse mr-4">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>Consulting NOAA NCEI & CoMET CEDIT Knowledge Base...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Strip */}
      <div className="px-3 py-1.5 bg-[#09101d] border-t border-cyan-500/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() =>
            handleQuickPrompt(
              `Review our current mission "${mission.title}" and suggest authentic GCMD Science Keywords and sensor instrumentation for CoMET CEDIT upload.`
            )
          }
          className="px-2 py-1 rounded bg-[#101e33] hover:bg-[#182e4e] text-[10px] font-mono text-cyan-300 border border-cyan-500/25 shrink-0 transition-colors"
        >
          ✦ Suggest GCMD & Sensors
        </button>

        <button
          onClick={() =>
            handleQuickPrompt(
              `Examine the geographic coordinates [${mission.spatialExtent.west}, ${mission.spatialExtent.south}, ${mission.spatialExtent.east}, ${mission.spatialExtent.north}] for ${mission.spatialExtent.placeName}. Are they valid for ISO 19115-2?`
            )
          }
          className="px-2 py-1 rounded bg-[#101e33] hover:bg-[#182e4e] text-[10px] font-mono text-cyan-300 border border-cyan-500/25 shrink-0 transition-colors"
        >
          ✦ Verify Spatial Bounds
        </button>

        <button
          onClick={() =>
            handleQuickPrompt(
              `Explain the NOAA CEDIT OpenAPI (https://data.noaa.gov/cedit/openApiDoc.html) requirements for pushing an uncrewed systems (UxS) mission draft.`
            )
          }
          className="px-2 py-1 rounded bg-[#101e33] hover:bg-[#182e4e] text-[10px] font-mono text-cyan-300 border border-cyan-500/25 shrink-0 transition-colors"
        >
          ✦ CEDIT API Requirements
        </button>
      </div>

      {/* Chat Input */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-[#0a1220] border-t border-cyan-500/20 flex items-center gap-2"
      >
        <input
          id="chat-user-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask MANTA Lens about ISO 19115, GCMD keywords, CEDIT API..."
          disabled={isLoading}
          className="flex-1 bg-[#101b30] border border-cyan-500/30 rounded-lg px-3 py-2 text-xs text-cyan-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
        />
        <button
          id="send-chat-btn"
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
};

// Helper function to extract structured suggestions JSON from assistant text
function parseSuggestedUpdates(text: string): any | null {
  try {
    const jsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.suggestedUpdates) {
        return parsed.suggestedUpdates;
      }
    }
  } catch (e) {
    // Ignore JSON parse errors
  }
  return null;
}
