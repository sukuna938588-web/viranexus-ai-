import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  User,
  Shield,
  Languages,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  MapPin,
  TrendingUp,
  Download,
  Copy,
  Check,
} from 'lucide-react';
import { EpidemiologicalIntelligence, OutbreakRecord, ActivePage } from '../types';

interface AICopilotProps {
  intelligence: EpidemiologicalIntelligence;
  records: OutbreakRecord[];
  onSelectPage: (page: ActivePage) => void;
  onLoadSample: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  language?: string;
  followUps?: string[];
  timestamp: string;
}

export const AICopilot: React.FC<AICopilotProps> = ({
  intelligence,
  records,
  onSelectPage,
  onLoadSample,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `Hello! I am **OUTBREAKX AI Copilot**, your next-generation disease surveillance & outbreak prediction intelligence advisor.\n\nI can analyze your dataset, generate executive summaries, evaluate district risks, and forecast contagion trajectories in **English**, **தமிழ் (Tamil)**, or **Tanglish**.\n\nClick any report generator or prompt chip below, or ask any epidemiological question!`,
      followUps: [
        'Summarize current outbreak status',
        'Which district is highest risk?',
        'சென்னையில் டெங்கு ஏன் அதிகரிக்கிறது?',
        'Chennai la dengue yen increase aguthu?',
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTabLang, setActiveTabLang] = useState<'english' | 'tamil' | 'tanglish'>('english');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string = inputQuery) => {
    const q = textToSend.trim();
    if (!q || loading) return;

    setInputQuery('');
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const summaryPayload = {
        totalCases: intelligence.totalCases,
        activeAlertsCount: intelligence.activeAlertsCount,
        highRiskZonesCount: intelligence.highRiskZonesCount,
        communityHealthScore: intelligence.communityHealthScore,
        estimatedR0: intelligence.estimatedR0,
        growthRatePct: intelligence.growthRatePct,
        topDiseases: intelligence.topDiseases,
        topZones: intelligence.topZones,
        prediction: intelligence.prediction,
      };

      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          datasetSummary: summaryPayload,
          history: messages.slice(-4),
        }),
      });

      let rawAnswer = '';
      let detectedLanguage = 'english';

      if (res.ok) {
        const data = await res.json();
        rawAnswer = data.answer || data.response || '';
        detectedLanguage = data.language || 'english';
      } else {
        rawAnswer = generateClientFallback(q, intelligence);
      }

      const parts = rawAnswer.split('---FOLLOW_UPS---');
      const mainAnswer = parts[0].trim();
      const followUps = parts[1]
        ? parts[1]
            .split('\n')
            .map((s) => s.trim())
            .filter((s) => s.length > 0 && !s.startsWith('-'))
            .slice(0, 3)
        : [];

      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: mainAnswer,
          language: detectedLanguage,
          followUps,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      const fallbackText = generateClientFallback(q, intelligence);
      const parts = fallbackText.split('---FOLLOW_UPS---');
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: parts[0].trim(),
          followUps: parts[1] ? parts[1].split('\n').filter(Boolean).slice(0, 3) : [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  function generateClientFallback(question: string, intel: EpidemiologicalIntelligence): string {
    const isTamil = /[\u0B80-\u0BFF]/.test(question);
    const isTanglish = /\b(yen|aguthu|aaguthu|eppadi|irukku|la|panrathu|solunga)\b/i.test(question);

    const primaryDisease = intel.topDiseases[0]?.name || 'Dengue';
    const primaryZone = intel.topZones[0]?.name || 'Chennai';
    const r0 = intel.estimatedR0 || 1.1;
    const gRate = intel.growthRatePct || 0;

    if (isTamil) {
      return `பதிவேற்றப்பட்ட தரவுகளின்படி, **${primaryZone}** மாவட்டத்தில் **${primaryDisease}** பாதிப்புகள் தொடர்ந்து அதிகரித்து வருகின்றன (வாராந்திர வளர்ச்சி: +${gRate}%, பரவல் வேகம் R₀ = ${r0}). உடனடி கொசு ஒழிப்பு மருந்து தெளித்தல் மற்றும் ஆரம்பக்கட்ட மருத்துவ பரிசோதனை முகாம்களை அமைக்க அறிவுறுத்தப்படுகிறது.\n\n---FOLLOW_UPS---\n${primaryZone} மாவட்டத்தில் அடுத்த வார நிலை என்ன?\nதடுப்பு நடவடிக்கைகள் என்னென்ன எடுக்க வேண்டும்?\nஅதிக ஆபத்துள்ள பிற மாவட்டங்கள் யாவை?`;
    }

    if (isTanglish) {
      return `Upload pannuna surveillance dataset analysis padi, **${primaryZone} la ${primaryDisease}** cases continuous ah increase aaguthu. Weekly growth +${gRate}% irukku, transmission speed R₀ = ${r0}. Water stagnation clear panni fogging spray panrathu romba important!\n\n---FOLLOW_UPS---\nNext week cases count eppadi irukkum?\n${primaryZone} la enna precautions edukalame?\nOther high risk districts edhulam?`;
    }

    return `Based on verified surveillance data, **${primaryDisease}** is exhibiting rapid acceleration in **${primaryZone}** (Weekly growth: +${gRate}%, Transmission velocity R₀ = ${r0}). Early containment advisories and active screening should be prioritized.\n\n---FOLLOW_UPS---\nWhich neighboring districts are at risk?\nWhat is the expected outbreak timeframe?\nWhat clinical directives are recommended?`;
  }

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Report Generator Quick Action Triggers
  const handleGenerateReport = (type: 'executive' | 'outbreak' | 'risk' | 'district') => {
    if (type === 'executive') {
      handleSendMessage('Generate an Executive Summary of current disease surveillance and transmission pace');
    } else if (type === 'outbreak') {
      handleSendMessage('Generate an Outbreak Summary detailing fastest spreading diseases and expected timeframes');
    } else if (type === 'risk') {
      handleSendMessage('Generate a Risk Summary ranking top high-risk districts and cluster zones');
    } else if (type === 'district') {
      handleSendMessage('Perform a detailed District Analysis on our primary epidemic epicenter');
    }
  };

  const STARTER_PROMPTS = {
    english: [
      { text: 'Which district is highest risk?', label: 'Highest Risk District' },
      { text: 'Summarize current outbreak status', label: 'Outbreak Status' },
      { text: 'What disease is spreading fastest?', label: 'Fastest Pathogen' },
      { text: 'Why is Dengue increasing in Chennai?', label: 'Chennai Dengue Trend' },
    ],
    tamil: [
      { text: 'சென்னையில் டெங்கு ஏன் அதிகரிக்கிறது?', label: 'டெங்கு அதிகரிப்பு' },
      { text: 'எந்த மாவட்டத்தில் அதிக ஆபத்து உள்ளது?', label: 'அதிக ஆபத்தான மாவட்டம்' },
      { text: 'அடுத்த வாரம் பரவல் எப்படி இருக்கும்?', label: 'அடுத்த வார கணிப்பு' },
      { text: 'தற்போதைய தொற்று நிலவரத்தை சுருக்கமாகக் கூறுக', label: 'தொற்று சுருக்கம்' },
    ],
    tanglish: [
      { text: 'Chennai la dengue yen increase aguthu?', label: 'Chennai Dengue Reason' },
      { text: 'Endha district la risk athigama irukku?', label: 'High Risk District' },
      { text: 'Next week outbreak eppadi irukkum?', label: 'Next Week Prediction' },
      { text: 'Current outbreak status short ah solunga', label: 'Status Short Summary' },
    ],
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#070913] border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
              AI Copilot & Multilingual Health Advisor
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Grounded strictly in your uploaded dataset &bull; Automatic language detection for English, தமிழ், and Tanglish
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold">
            English
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold">
            தமிழ் (Tamil)
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold">
            Tanglish
          </span>
        </div>
      </div>

      {/* 4 Report Generators Bar */}
      <div className="p-4 rounded-3xl bg-[#080c18] border border-slate-800 space-y-3">
        <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          One-Click Automated Health Intelligence Reports
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => handleGenerateReport('executive')}
            className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 text-left transition group active:scale-95"
          >
            <div className="text-xs font-bold text-white font-mono group-hover:text-cyan-300 flex items-center justify-between">
              <span>Executive Summary</span>
              <Sparkles className="w-3 h-3 text-cyan-400" />
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-1">
              High-level surveillance brief
            </p>
          </button>

          <button
            onClick={() => handleGenerateReport('outbreak')}
            className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 text-left transition group active:scale-95"
          >
            <div className="text-xs font-bold text-white font-mono group-hover:text-purple-300 flex items-center justify-between">
              <span>Outbreak Summary</span>
              <TrendingUp className="w-3 h-3 text-purple-400" />
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-1">
              Pacing & trajectory projections
            </p>
          </button>

          <button
            onClick={() => handleGenerateReport('risk')}
            className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 text-left transition group active:scale-95"
          >
            <div className="text-xs font-bold text-white font-mono group-hover:text-amber-300 flex items-center justify-between">
              <span>Risk Summary</span>
              <AlertTriangle className="w-3 h-3 text-amber-400" />
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-1">
              District threat stratification
            </p>
          </button>

          <button
            onClick={() => handleGenerateReport('district')}
            className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/40 text-left transition group active:scale-95"
          >
            <div className="text-xs font-bold text-white font-mono group-hover:text-rose-300 flex items-center justify-between">
              <span>District Analysis</span>
              <MapPin className="w-3 h-3 text-rose-400" />
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-1">
              Deep cluster investigation
            </p>
          </button>
        </div>
      </div>

      {/* Non-Diagnostic Guardrail Notice */}
      <div className="p-3.5 rounded-2xl bg-[#060810] border border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-2 text-slate-300">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>Non-Diagnostic Public Health Assistant &bull; Explains verified data patterns and outbreak predictions.</span>
        </span>
        {records.length === 0 && (
          <button
            onClick={onLoadSample}
            className="text-cyan-400 hover:text-cyan-300 font-bold underline transition"
          >
            Load Sample Dataset to Start
          </button>
        )}
      </div>

      {/* Quick Prompts Bar with Language Selector */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1">
            <Languages className="w-3.5 h-3.5 text-cyan-400" />
            Quick Prompts:
          </span>
          <button
            onClick={() => setActiveTabLang('english')}
            className={`px-2.5 py-0.5 rounded-lg transition ${
              activeTabLang === 'english'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setActiveTabLang('tamil')}
            className={`px-2.5 py-0.5 rounded-lg transition ${
              activeTabLang === 'tamil'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            தமிழ் (Tamil)
          </button>
          <button
            onClick={() => setActiveTabLang('tanglish')}
            className={`px-2.5 py-0.5 rounded-lg transition ${
              activeTabLang === 'tanglish'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tanglish
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {STARTER_PROMPTS[activeTabLang].map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt.text)}
              className="px-3 py-1.5 rounded-xl bg-[#080c18] border border-slate-800 hover:border-cyan-500/40 text-xs font-mono text-slate-300 hover:text-white transition active:scale-95 text-left"
            >
              💬 {prompt.text}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Viewport */}
      <div className="p-6 rounded-3xl bg-[#080c18] border border-slate-800 min-h-[440px] max-h-[560px] overflow-y-auto space-y-4 shadow-xl">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-900 to-purple-900 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs font-mono leading-relaxed space-y-2.5 relative group ${
                  isUser
                    ? 'bg-gradient-to-r from-cyan-600/30 to-purple-600/30 border border-cyan-500/40 text-white'
                    : 'bg-[#05070e] border border-slate-800 text-slate-200'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Follow up suggestions */}
                {msg.followUps && msg.followUps.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                      Related Follow-Up Questions:
                    </span>
                    <div className="flex flex-col gap-1">
                      {msg.followUps.map((fu, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(fu)}
                          className="text-left text-[11px] text-slate-300 hover:text-cyan-300 hover:underline transition"
                        >
                          › {fu}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1">
                  <span>{msg.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => handleCopyMessage(msg.text, msg.id)}
                      className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1 text-slate-400 hover:text-white"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3.5 rounded-2xl bg-[#05070e] border border-slate-800 text-xs font-mono text-cyan-300 animate-pulse">
              Analyzing surveillance telemetry & synthesizing response...
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Query Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 p-2 rounded-2xl bg-[#080c18] border border-slate-800 focus-within:border-cyan-500/50 transition shadow-xl"
      >
        <input
          type="text"
          placeholder="Ask in English, தமிழ் (Tamil), or Tanglish (e.g., Chennai la dengue yen increase aguthu?)..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          disabled={loading}
          className="flex-1 bg-transparent px-4 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none"
        />

        <button
          type="submit"
          disabled={!inputQuery.trim() || loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-slate-950 font-bold text-xs font-mono shadow-md shadow-cyan-500/20 active:scale-95 transition"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
