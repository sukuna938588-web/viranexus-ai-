import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Lazy Gemini AI initialization & access guardian
let aiClient: GoogleGenAI | null = null;
let geminiAccessRestricted = false;
let lastAccessCheck = 0;
let lastConfiguredKey = process.env.GEMINI_API_KEY;

function isGeminiAvailable(): boolean {
  if (!process.env.GEMINI_API_KEY) return false;

  if (process.env.GEMINI_API_KEY !== lastConfiguredKey) {
    lastConfiguredKey = process.env.GEMINI_API_KEY;
    geminiAccessRestricted = false;
    aiClient = null;
  }

  // If quota was exhausted or permission denied, pause calls for 5 minutes
  if (geminiAccessRestricted && Date.now() - lastAccessCheck < 5 * 60 * 1000) {
    return false;
  }
  return true;
}

function handleGeminiError(err: any, context: string) {
  const errString = typeof err === 'string' ? err : (err?.message || '');
  if (
    errString.includes('403') ||
    errString.includes('429') ||
    errString.includes('RESOURCE_EXHAUSTED') ||
    errString.includes('quota') ||
    errString.includes('overloaded') ||
    errString.includes('rate-limit')
  ) {
    geminiAccessRestricted = true;
    lastAccessCheck = Date.now();
    console.log(`[OUTBREAKX AI] Cloud Gemini quota reached (${context}). Seamlessly switching to local deterministic epidemiological engine.`);
  } else {
    console.log(`[OUTBREAKX AI] ${context} utilizing local deterministic engine.`);
  }
}

function getGenAI(): GoogleGenAI | null {
  if (!isGeminiAvailable()) return null;
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Language detector: English, Tamil (தமிழ் script), or Tanglish (Tamil in Latin script)
function detectLanguage(text: string): 'tamil' | 'tanglish' | 'english' {
  // Check for Tamil Unicode range (U+0B80 to U+0BFF)
  if (/[\u0B80-\u0BFF]/.test(text)) {
    return 'tamil';
  }

  // Check for standalone Tanglish keywords and phonetic particles using word boundaries
  const tanglishRegex = /\b(vanakkam|vanakam|epdi|irukinga|neenga|yaaru|nandri|yen|eppadi|enge|aguthu|aaguthu|irukku|panrathu|panradhu|romba|solunga|pannalam|edhuku|ethukku|theriyuma|kooda|la|layum|adhu|idhu|varuthu|varum|paravuthu|paravutha|pathukalam|avasiyama|enna|nalla|illa|illai)\b/i;
  if (tanglishRegex.test(text)) {
    return 'tanglish';
  }

  return 'english';
}

function isGreetingOrConversational(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  const greetingRegex = /^(hi|hello|hey|vanakkam|vanakam|வணக்கம்|காலை வணக்கம்|மாலை வணக்கம்|epdi irukinga|how are you|who are you|neenga yaaru|who r u|what can you do|good morning|good evening|good afternoon|nandri|thanks|thank you|நன்றி|bye|goodbye|help|start|hola)(\s*[!?.])?$/i;
  if (greetingRegex.test(normalized)) return true;
  if (/\b(how are you|who are you|neenga yaaru|epdi irukinga|what are you|enna panra)\b/i.test(normalized)) return true;
  return false;
}

// Natural, multi-language deterministic epidemiological synthesizer
function generateLocalHeuristicInsights(datasetSummary: any, question: string = ''): string {
  const total = datasetSummary?.totalCases || 0;
  const diseases = datasetSummary?.topDiseases || [];
  const zones = datasetSummary?.topZones || [];
  const growthRate = datasetSummary?.growthRatePct || 0;
  const r0 = datasetSummary?.estimatedR0 || 1.1;
  const lang = detectLanguage(question);

  // Conversational & Greeting support
  if (isGreetingOrConversational(question)) {
    if (lang === 'tamil') {
      return `வணக்கம்! நான் **OUTBREAKX AI Copilot**, உங்கள் பொது சுகாதார மற்றும் தொற்று நோய் கண்காணிப்பு AI ஆலோசகர்.\n\nநான் உங்களுக்கு எவ்வாறு உதவ முடியும்? பதிவேற்றப்பட்ட தரவுகளின் அடிப்படையில் மாவட்ட அபாயங்கள், தொற்று வளர்ச்சி விகிதம், பரவல் வேகம் (R₀), மற்றும் எதிர்கால கணிப்புகளைப் பற்றி நீங்கள் என்னிடம் கேட்கலாம்.\n\n---FOLLOW_UPS---\nதற்போதைய தொற்று நிலவரத்தை சுருக்கமாகக் கூறுக\nஎந்த மாவட்டத்தில் அதிக ஆபத்து உள்ளது?\nஅடுத்த வாரம் பரவல் எப்படி இருக்கும்?`;
    }
    if (lang === 'tanglish') {
      return `Vanakkam! Naan **OUTBREAKX AI Copilot**, ungaloda disease surveillance and outbreak prediction assistant.\n\nNaan ungalukku eppadi help panna mudiyum? Ungaloda dataset la irukkura disease spread, high-risk districts, reproduction speed (R₀), and future outbreak predictions pathi enkitta keka mudiyum!\n\n---FOLLOW_UPS---\nCurrent outbreak status short ah solunga\nEndha district la risk athigama irukku?\nNext week outbreak eppadi irukkum?`;
    }
    return `Hello! I am **OUTBREAKX AI Copilot**, your intelligent epidemiological surveillance and outbreak forecasting assistant.\n\nHow can I help you today? You can ask me to evaluate disease clusters, analyze growth trends, calculate reproduction speeds (R₀), or project future outbreak windows in English, தமிழ் (Tamil), or Tanglish.\n\n---FOLLOW_UPS---\nSummarize current outbreak status\nWhich district is highest risk?\nWhat pathogen is spreading fastest?`;
  }

  const primaryDisease = diseases[0]?.name || 'Dengue';
  const primaryZone = zones[0]?.name || 'Chennai';
  const secondaryZone = zones[1]?.name || 'Chengalpattu';

  // Empty state handling
  if (total === 0) {
    if (lang === 'tamil') {
      return 'இன்னும் கண்காணிப்பு தரவுகள் எதுவும் பதிவேற்றப்படவில்லை. பகுப்பாய்வைத் தொடங்க CSV கோப்பை பதிவேற்றவும் அல்லது "Add Record" மூலம் புதிய பதிவைச் சேர்க்கவும்.\n\n---FOLLOW_UPS---\nமாதிரி தரவுத்தொகுப்பை எவ்வாறு ஏற்றுவது?\nOUTBREAKX எவ்வாறு நோய்களைக் கணிக்கிறது?\nடெங்கு எச்சரிக்கைகள் எவ்வாறு செயல்படுகின்றன?';
    }
    if (lang === 'tanglish') {
      return 'Innum dataset ethuvum upload pannala. Analysis start panna CSV file upload pannunga or "Add Record" click panni data add pannunga.\n\n---FOLLOW_UPS---\nSample dataset eppadi load panrathu?\nOUTBREAKX eppadi disease predict pannuthu?\nDengue alert eppadi work aaguthu?';
    }
    return 'No surveillance dataset is loaded yet. Please upload a CSV file in Dataset Upload or click "Load Sample Dataset" to begin real-time outbreak prediction and monitoring.\n\n---FOLLOW_UPS---\nHow do I load the Tamil Nadu sample dataset?\nHow does OUTBREAKX predict upcoming outbreaks?\nWhat disease alerts are currently active?';
  }

  // TAMIL RESPONSE
  if (lang === 'tamil') {
    return `பதிவேற்றப்பட்ட **${total.toLocaleString()} வழக்குகள்** கொண்ட கண்காணிப்புத் தரவுகளின்படி:

1. **முக்கிய நோய் பரவல்:** **${primaryDisease}** மொத்த வழக்குகளில் **${diseases[0]?.percentage || 0}%** பங்கை வகிக்கிறது.
2. **அதிக பாதிப்புக்குள்ளான மாவட்டம்:** **${primaryZone}** அதிகபட்ச வழக்குகளுடன் (${zones[0]?.count || 0} வழக்குகள்) தீவிர கண்காணிப்பில் உள்ளது.
3. **பரவல் வேகம் & வளர்ச்சி:** வாராந்திர வளர்ச்சி விகிதம் **${growthRate >= 0 ? '+' : ''}${growthRate}%** ஆகவும், பரவல் வேகம் **R₀ = ${r0}** ஆகவும் பதிவாகியுள்ளது.
4. **அடுத்த கட்ட அபாயம்:** அருகில் உள்ள **${secondaryZone}** மற்றும் அருகாமை மாவட்டங்களுக்கும் பரவல் வாய்ப்பு உள்ளதாக கணிக்கப்பட்டுள்ளது.

**பரிந்துரைக்கப்பட்ட தடுப்பு நடவடிக்கைகள்:**
${primaryZone} பகுதிகளில் உடனடி கொசு ஒழிப்பு, தேங்கிய நீர் மேலாண்மை மற்றும் மொபைல் மருத்துவ பரிசோதனை முகாம்களை அமைக்க அறிவுறுத்தப்படுகிறது.

---FOLLOW_UPS---
${primaryZone} மாவட்டத்தில் என்னென்ன அறிகுறிகள் உள்ளன?
அடுத்த வாரம் பரவல் வேகம் எவ்வாறு இருக்கும்?
${primaryDisease} பரவலைக் கட்டுப்படுத்த என்ன முன்னெச்சரிக்கை எடுக்க வேண்டும்?`;
  }

  // TANGLISH RESPONSE
  if (lang === 'tanglish') {
    return `Upload pannuna surveillance dataset (**${total.toLocaleString()} records**) analysis padi:

1. **Main Outbreak Pathogen:** **${primaryDisease}** thaan highest ah irukku (overall cases la **${diseases[0]?.percentage || 0}%**).
2. **Top Affected District:** **${primaryZone}** la thaan maximum cases (${zones[0]?.count || 0} cases) report aagirukku.
3. **Spread Velocity (R₀):** Current transmission rate **R₀ = ${r0}** and weekly case growth **${growthRate >= 0 ? '+' : ''}${growthRate}%** aaguthu.
4. **Next Risk Zones:** Nearby district **${secondaryZone}** layum similar spread trend start aagirukku.

**Enna Action Panradhu?**
${primaryZone} la immediate vector control (fogging spray), stagnant water clear panrathu, and fever camps organize panrathu romba avasiyam.

---FOLLOW_UPS---
${primaryZone} la Dengue yen athigamaaguthu?
Next week cases count eppadi irukkum?
Secondary outbreak entha district la vara chance irukku?`;
  }

  // ENGLISH RESPONSE (Default)
  return `Based on your uploaded surveillance dataset of **${total.toLocaleString()} records**:

- **Dominant Pathogen:** **${primaryDisease}** accounts for **${diseases[0]?.percentage || 0}%** of all indexed infections.
- **Primary Epicenter:** **${primaryZone}** has recorded the highest concentration with **${zones[0]?.count || 0} cases** (${zones[0]?.riskCategory || 'High'} Risk).
- **Transmission Momentum:** Weekly cases are trending at **${growthRate >= 0 ? '+' : ''}${growthRate}%**, with an estimated reproduction speed (R₀) of **${r0}**.
- **Cross-District Spread:** Secondary transmission signals are emerging toward **${secondaryZone}** and adjacent travel corridors.

**Operational Recommendation:** Deploy localized vector control, reinforce fever screening kiosks, and alert regional primary health centers in ${primaryZone}.

---FOLLOW_UPS---
Why is ${primaryDisease} increasing in ${primaryZone}?
What is the expected outbreak window for the next 2-4 weeks?
Which districts are at medium risk right now?`;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'OUTBREAKX',
    tagline: 'AI-Powered Disease Outbreak Prediction & Early Warning System',
    aiEngine: isGeminiAvailable() ? 'gemini-cloud' : 'deterministic-epidemiological',
  });
});

// AI Copilot Query Endpoint with multi-language support (English, Tamil, Tanglish)
app.post('/api/ai/query', async (req, res) => {
  try {
    const { question, datasetSummary, history = [] } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const detectedLang = detectLanguage(question);
    const ai = getGenAI();

    if (!ai || !process.env.GEMINI_API_KEY) {
      const localAnswer = generateLocalHeuristicInsights(datasetSummary, question);
      return res.json({
        answer: localAnswer,
        response: localAnswer,
        source: 'outbreakx_intelligence_engine',
        language: detectedLang,
      });
    }

    const historyPrompt = history.length > 0
      ? `Recent Conversation Context:\n${history.slice(-4).map((h: any) => `${h.sender === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join('\n')}\n\n`
      : '';

    const prompt = `You are OUTBREAKX AI Copilot, an advanced epidemiological and disease outbreak intelligence advisor.

SURVEILLANCE DATASET TELEMETRY (Ground all statements strictly in this real data):
- Total Cases: ${datasetSummary?.totalCases || 0}
- Active Alerts: ${datasetSummary?.activeAlertsCount || 0}
- High Risk Districts: ${datasetSummary?.highRiskZonesCount || 0}
- Primary Diseases: ${JSON.stringify(datasetSummary?.topDiseases?.slice(0, 4) || [])}
- Monitored Districts: ${JSON.stringify(datasetSummary?.topZones?.slice(0, 4) || [])}
- 7-Day Growth Rate: ${datasetSummary?.growthRatePct || 0}%
- Transmission Speed (R₀): ${datasetSummary?.estimatedR0 || 1.1}
- Outbreak Prediction: ${JSON.stringify(datasetSummary?.prediction || {})}

USER'S QUESTION:
"${question}"
USER'S DETECTED LANGUAGE: ${detectedLang.toUpperCase()}

CRITICAL LANGUAGE & SYSTEM RULES:
1. DETECT THE USER'S LANGUAGE AND RESPOND IN THE EXACT SAME LANGUAGE:
   - If the user asked in Tamil (தமிழ்), write the response completely in fluent, natural TAMIL (தமிழ் எழுத்துகளில்).
   - If the user asked in Tanglish (Tamil expressed in Latin script, e.g. "Chennai la dengue yen increase aguthu?"), respond naturally in TANGLISH.
   - If the user asked in English, respond in clear, professional ENGLISH.
2. DO NOT ACT AS A DOCTOR. Do NOT provide personal medical diagnosis, triage advice, or individual drug prescriptions.
3. DO NOT GENERATE FAKE DATA. Only explain information derived from the provided dataset and platform analytics.
4. Explain dataset trends, predictions, alerts, and district risks clearly so public health authorities, researchers, and judges can evaluate them easily.
6. WORK AS A NORMAL CONVERSATIONAL ASSISTANT:
   - If the user sends greetings (e.g. 'hello', 'hi', 'vanakkam', 'வணக்கம்', 'how are you', 'who are you', 'thanks'), respond naturally and warmly to the greeting first, introduce yourself as OUTBREAKX AI Copilot, and offer helpful guidance.
   - Answer general questions about disease prevention, vector control, epidemiological metrics, or platform usage smoothly and conversationally.
5. Provide 3 relevant follow-up questions at the very end in the SAME language, formatted exactly as:
---FOLLOW_UPS---
[First follow-up question]
[Second follow-up question]
[Third follow-up question]`;

    let text: string | undefined;
    let modelUsed = 'gemini-3.8-flash';

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI generation timeout')), 8000)
    );

    try {
      const modelPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are OUTBREAKX AI Copilot. Match the exact user language (English, Tamil தமிழ், or Tanglish) and explain outbreak patterns factually without medical diagnosis.',
        },
      });
      const modelResponse = await Promise.race([modelPromise, timeoutPromise]);
      text = modelResponse.text;
    } catch (primaryErr: any) {
      handleGeminiError(primaryErr, 'Copilot Query');
      // If primary model failed (e.g. quota exhausted or timeout), fall back gracefully
    }

    const finalText = text || generateLocalHeuristicInsights(datasetSummary, question);
    return res.json({
      answer: finalText,
      response: finalText,
      source: text ? modelUsed : 'outbreakx_intelligence_engine',
      language: detectedLang,
    });
  } catch (error: any) {
    const fallbackAnswer = generateLocalHeuristicInsights(
      req.body.datasetSummary,
      req.body.question
    );
    return res.json({
      answer: fallbackAnswer,
      response: fallbackAnswer,
      source: 'outbreakx_intelligence_engine',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OUTBREAKX server running on port ${PORT}`);
  });
}

startServer();
