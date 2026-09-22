import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  Cpu,
  Trash2,
  Copy,
  Check,
  Zap,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Activity,
  MapPin,
  TrendingUp,
  MessageSquare,
  CornerDownLeft,
} from 'lucide-react';
import { EpidemiologicalIntelligence, OutbreakRecord } from '../types';
import { EmptyState } from '../components/EmptyState';

interface AICommandCenterProps {
  intelligence: EpidemiologicalIntelligence;
  records: OutbreakRecord[];
  onUploadRecords: (records: OutbreakRecord[], mode: 'append' | 'replace') => void;
  onOpenAddModal: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  followUps?: string[];
  timestamp: string;
  isStreaming?: boolean;
}

export const AICommandCenter: React.FC<AICommandCenterProps> = ({
  intelligence,
  records,
  onUploadRecords,
  onOpenAddModal,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('viranexus_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  const [inputValue, setInputValue] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [thinkingStage, setThinkingStage] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Clear messages if records are completely emptied
  useEffect(() => {
    if (records.length === 0 && messages.length > 0) {
      setMessages([]);
      localStorage.removeItem('viranexus_chat_history');
    }
  }, [records.length, messages.length]);

  // Conversational thinking stages
  const THINKING_STAGES = [
    'Reviewing your outbreak data...',
    'Evaluating growth pace and affected communities...',
    'Checking hospital bed readiness...',
    'Writing clear health recommendations...',
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isQuerying) {
      setThinkingStage(0);
      timer = setInterval(() => {
        setThinkingStage((prev) => (prev + 1) % THINKING_STAGES.length);
      }, 800);
    }
    return () => clearInterval(timer);
  }, [isQuerying]);

  // Persist messages to localStorage
  useEffect(() => {
    localStorage.setItem('viranexus_chat_history', JSON.stringify(messages));
  }, [messages]);

  // Initial welcome message if records are loaded and chat is empty
  useEffect(() => {
    if (records.length > 0 && messages.length === 0) {
      const topDis = intelligence.topDiseases[0]?.name || 'the primary disease';
      const topLoc = intelligence.topZones[0]?.name || 'the main affected area';
      const initMsg: ChatMessage = {
        id: 'msg-init',
        sender: 'assistant',
        text: `Hello! I am your AI Health Copilot. I have reviewed your current dataset of **${records.length.toLocaleString()} patient records**:\n\n- **Most Prevalent Illness:** ${topDis}\n- **Most Affected Area:** ${topLoc}\n- **Weekly Trend:** ${intelligence.growthRatePct >= 0 ? '+' : ''}${intelligence.growthRatePct}%\n- **Spread Speed (R₀):** ${intelligence.estimatedR0}\n\nAsk me anything in plain English about which areas need attention, how cases will trend next week, hospital readiness, or what preventive actions to take!`,
        followUps: [
          `Summarize this dataset in simple English`,
          `Which area is at highest risk right now?`,
          `What preventive actions should we take?`,
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([initMsg]);
    }
  }, [records.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isQuerying]);

  if (records.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">AI Health Copilot</h1>
            <p className="text-xs text-slate-400 font-mono">
              Intelligent conversational assistant grounded exclusively in your data
            </p>
          </div>
        </div>
        <EmptyState
          onUploadRecords={onUploadRecords}
          onOpenAddModal={onOpenAddModal}
          title="No Dataset Loaded Yet"
          description="Upload CSV Dataset or Add Your First Record to Start AI Analysis"
        />
      </div>
    );
  }

  const handleClearHistory = () => {
    setMessages([]);
    localStorage.removeItem('viranexus_chat_history');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to parse follow-ups from raw assistant text
  const parseResponseAndFollowUps = (rawText: string): { cleanText: string; followUps: string[] } => {
    if (rawText.includes('---FOLLOW_UPS---')) {
      const parts = rawText.split('---FOLLOW_UPS---');
      const clean = parts[0].trim();
      const followUpLines = parts[1]
        .split('\n')
        .map((l) => l.replace(/^[-*•\d.]+\s*/, '').trim())
        .filter((l) => l.length > 3 && !l.startsWith('[') && !l.endsWith(']'))
        .slice(0, 3);
      return { cleanText: clean, followUps: followUpLines };
    }
    return { cleanText: rawText, followUps: [] };
  };

  // Stream text word-by-word like ChatGPT
  const streamText = (fullText: string, followUps: string[], msgId: string) => {
    const words = fullText.split(' ');
    let wordIndex = 0;
    const interval = setInterval(() => {
      wordIndex += 2;
      if (wordIndex >= words.length) {
        clearInterval(interval);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? { ...m, text: fullText, followUps, isStreaming: false }
              : m
          )
        );
      } else {
        const partial = words.slice(0, wordIndex).join(' ');
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, text: partial, isStreaming: true } : m
          )
        );
      }
    }, 35);
  };

  const handleSendMessage = async (queryText: string) => {
    if (!queryText.trim() || isQuerying) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: queryText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Update message state
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsQuerying(true);

    const assistantMsgId = `ast-${Date.now()}`;

    try {
      // Build conversation history for memory
      const conversationHistory = messages.slice(-6).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: queryText.trim(),
          datasetSummary: {
            totalCases: intelligence.totalCases,
            topDiseases: intelligence.topDiseases,
            topZones: intelligence.topZones,
            severeRatio: intelligence.severeRatio,
            icuRatio: intelligence.icuRatio,
            growthRatePct: intelligence.growthRatePct,
            estimatedR0: intelligence.estimatedR0,
            dateRange: intelligence.dateRange,
          },
          history: conversationHistory,
        }),
      });

      let responseText = '';
      if (res.ok) {
        const data = await res.json();
        responseText = data.response || data.answer || '';
      }

      if (!responseText) {
        responseText = `I analyzed your question regarding "${queryText}". In your current dataset of ${records.length} records, ${intelligence.topDiseases[0]?.name || 'the primary disease'} in ${intelligence.topZones[0]?.name || 'monitored areas'} is the main trend to track. Transmission speed is R₀ ${intelligence.estimatedR0}.\n\n---FOLLOW_UPS---\nWhich areas near there should be alerted?\nWhat supplies do local clinics need?\nHow will cases look next week?`;
      }

      const { cleanText, followUps } = parseResponseAndFollowUps(responseText);

      // Add assistant placeholder and stream
      const assistantMessage: ChatMessage = {
        id: assistantMsgId,
        sender: 'assistant',
        text: '',
        followUps: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      streamText(cleanText, followUps, assistantMsgId);
    } catch {
      const fallback = `I was unable to connect to the cloud AI, but here is what your local data shows:\n\n- Monitored Cases: **${records.length}**\n- Dominant Illness: **${intelligence.topDiseases[0]?.name || 'Active Disease'}**\n- Focal Area: **${intelligence.topZones[0]?.name || 'Main Zone'}**\n- Growth Pace: **${intelligence.growthRatePct >= 0 ? '+' : ''}${intelligence.growthRatePct}%**\n\n---FOLLOW_UPS---\nWhat preventive actions can we take?\nHow many hospital beds will we need?\nWhich age group is most affected?`;
      const { cleanText, followUps } = parseResponseAndFollowUps(fallback);

      const assistantMessage: ChatMessage = {
        id: assistantMsgId,
        sender: 'assistant',
        text: '',
        followUps: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isStreaming: true,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      streamText(cleanText, followUps, assistantMsgId);
    } finally {
      setIsQuerying(false);
    }
  };

  // Dynamic starter prompts based on actual data
  const topAreaName = intelligence.topZones[0]?.name || 'our area';
  const topDisName = intelligence.topDiseases[0]?.name || 'cases';

  const DYNAMIC_STARTERS = [
    { text: `Summarize dataset: Core statistics, diseases & growth pace`, icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" /> },
    { text: `Risk assessment: Evaluate highest hazard zones & ${topAreaName}`, icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> },
    { text: `Explain anomalies: Statistical spikes, outliers & unusual patterns`, icon: <Zap className="w-3.5 h-3.5 text-amber-400" /> },
    { text: `How fast is ${topDisName} growing and what is R₀?`, icon: <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> },
    { text: 'Hospital surge: Inpatient & ICU bed capacity forecast', icon: <Activity className="w-3.5 h-3.5 text-blue-400" /> },
    { text: 'What 4 preventive actions should health teams take first?', icon: <Check className="w-3.5 h-3.5 text-emerald-400" /> },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#080b15] border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Bot className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              AI Health Copilot
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
              CHATGPT MODE
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Human-like conversations grounded exclusively in your {records.length.toLocaleString()} uploaded health records
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-400 hover:text-slate-200 transition"
            title="Clear conversation memory"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Chat</span>
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400">
            <Cpu className="w-3.5 h-3.5" />
            <span>Gemini Intelligence Core</span>
          </div>
        </div>
      </div>

      {/* Main Chat Conversation Container */}
      <div className="flex flex-col h-[600px] rounded-3xl bg-[#060812] border border-slate-800/90 shadow-2xl overflow-hidden relative">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Message Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 relative z-10">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-cyan-900 to-purple-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 shadow-lg shadow-cyan-950/40 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`group relative max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-950/30'
                    : 'bg-[#0e1324] border border-slate-800/90 text-slate-200'
                }`}
              >
                {/* Message Body */}
                <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed">
                  {msg.text}
                  {msg.isStreaming && (
                    <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-pulse align-middle" />
                  )}
                </div>

                {/* Follow-up question chips */}
                {msg.sender === 'assistant' && !msg.isStreaming && msg.followUps && msg.followUps.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-1.5">
                    <div className="text-[10px] font-mono text-cyan-400 flex items-center gap-1 uppercase font-bold">
                      <Sparkles className="w-3 h-3" />
                      Suggested Follow-Ups:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.followUps.map((fu, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(fu)}
                          disabled={isQuerying}
                          className="text-left px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/20 hover:border-cyan-500/50 text-[11px] text-cyan-200 hover:text-white transition active:scale-95 disabled:opacity-50"
                        >
                          → {fu}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamp & Action Bar */}
                <div
                  className={`mt-2.5 flex items-center justify-between text-[10px] font-mono ${
                    msg.sender === 'user' ? 'text-cyan-200' : 'text-slate-500'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'assistant' && !msg.isStreaming && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Thinking State */}
          {isQuerying && (
            <div className="flex gap-3 items-center animate-fade-in">
              <div className="w-8 h-8 rounded-2xl bg-[#0e1324] border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              </div>
              <div className="rounded-2xl px-4 py-3 bg-[#0e1324] border border-slate-800 text-xs font-mono text-cyan-300 flex items-center gap-2.5">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"
                    style={{ animationDelay: '0.4s' }}
                  />
                </div>
                <span>{THINKING_STAGES[thinkingStage]}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic Starter Questions Shelf */}
        <div className="px-4 py-2 bg-[#090d1c] border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto relative z-10 scrollbar-none">
          <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-slate-400 uppercase shrink-0">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Ask:
          </span>
          {DYNAMIC_STARTERS.map((item) => (
            <button
              key={item.text}
              onClick={() => handleSendMessage(item.text)}
              disabled={isQuerying}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-xs font-medium text-slate-300 hover:text-white transition disabled:opacity-50"
            >
              {item.icon}
              <span>{item.text}</span>
            </button>
          ))}
        </div>

        {/* User Input Bar */}
        <div className="p-4 bg-[#080b18] border-t border-slate-800 relative z-10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about disease spread, hospital surge, or preventive actions..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isQuerying}
              className="flex-1 rounded-2xl bg-slate-900/90 border border-slate-700/80 px-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
            <button
              type="submit"
              disabled={isQuerying || !inputValue.trim()}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition active:scale-95"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
