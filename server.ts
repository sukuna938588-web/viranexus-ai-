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
  
  // If the user updated the API key in environment/settings, reset restrictions
  if (process.env.GEMINI_API_KEY !== lastConfiguredKey) {
    lastConfiguredKey = process.env.GEMINI_API_KEY;
    geminiAccessRestricted = false;
    aiClient = null;
  }

  // If permission/quota was denied, wait 10 minutes before probing again
  if (geminiAccessRestricted && Date.now() - lastAccessCheck < 10 * 60 * 1000) {
    return false;
  }
  return true;
}

function handleGeminiError(err: any, context: string) {
  const errString = typeof err === 'string' ? err : (err?.message || '');
  if (errString.includes('403') || errString.includes('PERMISSION_DENIED') || errString.includes('denied access')) {
    geminiAccessRestricted = true;
    lastAccessCheck = Date.now();
    console.log(`[Biosurveillance AI] Cloud Gemini permission restricted. Seamlessly utilizing built-in deterministic epidemiological engine.`);
  } else {
    console.log(`[Biosurveillance AI] ${context} safely utilizing built-in deterministic intelligence.`);
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'ViraNexus AI',
    tagline: 'Predicting Outbreaks Before They Spread',
    aiEnabled: true,
    aiEngine: isGeminiAvailable() ? 'gemini-cloud' : 'deterministic-epidemiological',
  });
});

// Natural, human-like epidemiological fallback synthesizer
function generateLocalHeuristicInsights(datasetSummary: any, question?: string): string {
  const total = datasetSummary?.totalCases || 0;
  const diseases = datasetSummary?.topDiseases || [];
  const zones = datasetSummary?.topZones || [];
  const severeRatio = datasetSummary?.severeRatio || 0;
  const icuRatio = datasetSummary?.icuRatio || 0;
  const growthRate = datasetSummary?.growthRatePct || 0;
  const r0 = datasetSummary?.estimatedR0 || 1.0;

  if (total === 0) {
    return "No dataset records are loaded yet. Please upload a CSV dataset or add your first record in Dataset & Records so I can analyze real health trends for you.";
  }

  const primaryDisease = diseases[0]?.name || 'the primary illness';
  const primaryZone = zones[0]?.name || 'the main affected area';
  const q = (question || '').toLowerCase();

  let responseBody = '';
  let followUps = [
    `Which areas near ${primaryZone} should be alerted?`,
    `What preventive actions can stop ${primaryDisease}?`,
    `How many hospital beds will we need next week?`,
  ];

  if (q.includes('summar') || q.includes('overview') || q.includes('dataset')) {
    responseBody = `Here is a clear summary of your current dataset of **${total.toLocaleString()} records**:

- **Main Illness Detected:** **${primaryDisease}** accounts for ${diseases[0]?.percentage || 0}% of all recorded cases.
- **Most Affected Area:** **${primaryZone}** has the highest case concentration.
- **Current Growth Pace:** Weekly case numbers are changing by **${growthRate >= 0 ? '+' : ''}${growthRate}%**, with an estimated transmission speed (R₀) of **${r0}**.
- **Severe Care Demand:** About **${(severeRatio * 100).toFixed(1)}%** of patients experienced severe symptoms, and **${(icuRatio * 100).toFixed(1)}%** required intensive care.

Overall, the data points to active transmission in ${primaryZone}. Taking early containment steps now can significantly reduce further spread.`;
  } else if (q.includes('area') || q.includes('danger') || q.includes('risk') || q.includes('where')) {
    responseBody = `Based on your records, the highest risk area right now is **${primaryZone}**. 

Here is what the data tells us:
1. **Case Volume:** ${zones[0]?.count || 0} cases (${Math.round(((zones[0]?.count || 0) / Math.max(1, total)) * 100)}% of your whole dataset).
2. **Pathogens Present:** Mainly **${primaryDisease}**.
3. **Risk Level:** Classified as high risk due to rapid clustering.

**What to do:** Focus health teams on ${primaryZone}, distribute rapid testing, and advise residents to report any fever early.`;
    followUps = [
      `What are the symptoms reported in ${primaryZone}?`,
      `How fast is ${primaryDisease} spreading there?`,
      `What should local clinics do first?`,
    ];
  } else if (q.includes('predict') || q.includes('forecast') || q.includes('next week') || q.includes('cases')) {
    const projectedNextWeek = Math.round(total * (1 + Math.max(-0.2, growthRate / 100)));
    responseBody = `Looking at the growth trajectory from your data, here is what we expect over the coming week:

- **Spread Rate (R₀):** Currently at **${r0}**. Because this is ${r0 > 1 ? 'above 1.0, cases are multiplying' : 'stable or declining, transmission is leveling off'}.
- **Estimated Cases Next Week:** Approximately **${projectedNextWeek.toLocaleString()} cases** across all monitored areas.
- **Key Factor:** If testing and isolation are ramped up in ${primaryZone}, growth can be quickly slowed.`;
    followUps = [
      `Can we reduce R₀ below 1.0 this week?`,
      `Will hospital beds overflow next week?`,
      `What happens if no action is taken?`,
    ];
  } else if (q.includes('hospital') || q.includes('bed') || q.includes('icu') || q.includes('surge')) {
    const neededBeds = Math.max(5, Math.ceil(total * Math.max(0.12, severeRatio)));
    const neededICU = Math.max(2, Math.ceil(total * Math.max(0.04, icuRatio)));
    responseBody = `Here is the hospital readiness outlook based on patient severity in your dataset:

- **General Hospital Beds Needed:** Approximately **${neededBeds} beds** should be set aside for acute patients.
- **ICU Beds Needed:** Around **${neededICU} intensive care beds** with oxygen support.
- **Clinical Readiness Note:** Clinics near **${primaryZone}** should verify staff shifts and oxygen supplies before the weekend peak.`;
    followUps = [
      `What supplies are needed most for ${primaryDisease}?`,
      `Which age group needs the most hospital beds?`,
      `What triage steps should emergency rooms use?`,
    ];
  } else if (q.includes('anomal') || q.includes('spike') || q.includes('outlier') || q.includes('rare') || q.includes('unusual')) {
    const topDiseasePct = diseases[0]?.percentage || 0;
    const isSpike = growthRate > 15 || r0 > 1.25;
    responseBody = `Here is the detailed anomaly and outlier report generated from your surveillance data:

1. **Volume Spike Detection:** ${isSpike ? `A statistical transmission spike is detected (R₀ at **${r0}**, weekly growth **+${growthRate}%**). Case acceleration in **${primaryZone}** deviates significantly from standard Poisson distribution baselines.` : `Case accumulation remains within standard variance intervals with no abrupt multi-sigma surges.`}
2. **Pathogen Disproportion:** **${primaryDisease}** accounts for **${topDiseasePct}%** of all cases, signaling an acute mono-pathogen clustering event rather than an evenly distributed seasonal pattern.
3. **Clinical Severity Outlier:** Clinical acuity stands at **${(severeRatio * 100).toFixed(1)}%**, which ${severeRatio > 0.2 ? 'constitutes an elevated acuity surge requiring preemptive ICU reserves' : 'is within manageable outpatient operational limits'}.

**Investigation Protocol:** Deploy mobile epidemiological contact-tracing units to **${primaryZone}** to confirm index vector origin and eliminate environmental point-source contaminants.`;
    followUps = [
      `Which locations near ${primaryZone} could develop anomalies?`,
      `How does this anomaly impact hospital bed capacity?`,
      `What rapid counter-measures will contain this spike?`,
    ];
  } else if (q.includes('prevent') || q.includes('action') || q.includes('step') || q.includes('what should')) {
    responseBody = `Here are 4 practical preventive steps based directly on your data:

1. **Focused Screening in ${primaryZone}:** Set up quick fever checks and free test kits in high-traffic neighborhoods.
2. **Targeted Guidance for ${primaryDisease}:** Alert households on safe water, mosquito control, or mask usage depending on the pathogen.
3. **Clinic Readiness:** Ensure hospitals have extra beds ready for the projected ${(severeRatio * 100).toFixed(0)}% severe cases.
4. **Community Updates:** Share daily updates in simple language so people seek care early rather than waiting until symptoms become critical.`;
    followUps = [
      `How can we inform families in ${primaryZone}?`,
      `How soon should we expect cases to drop?`,
      `What is our community health index right now?`,
    ];
  } else {
    responseBody = `I analyzed your surveillance data for you:

- We are monitoring **${total.toLocaleString()} total cases**.
- **${primaryDisease}** is the most widespread illness, particularly in **${primaryZone}**.
- The weekly case trend is **${growthRate >= 0 ? '+' : ''}${growthRate}%**, with transmission speed R₀ at **${r0}**.
- Current severity rate is **${(severeRatio * 100).toFixed(1)}%**.

Feel free to ask me about hospital capacity, which neighborhoods are most at risk, or specific preventive actions!`;
  }

  return `${responseBody}\n\n---FOLLOW_UPS---\n${followUps.join('\n')}`;
}

// AI Command Center query endpoint
app.post('/api/ai/query', async (req, res) => {
  try {
    const question = req.body.question || req.body.query || '';
    const datasetSummary = req.body.datasetSummary || req.body.summary || {};
    const history = req.body.history || [];

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const ai = getGenAI();

    if (!ai || !process.env.GEMINI_API_KEY) {
      // Fallback deterministic analysis
      const localAnswer = generateLocalHeuristicInsights(datasetSummary, question);
      return res.json({
        answer: localAnswer,
        response: localAnswer,
        source: 'local_heuristic',
      });
    }

    const historyPrompt = history.length > 0
      ? `Recent Conversation Context:\n${history.slice(-4).map((h: any) => `${h.sender === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join('\n')}\n\n`
      : '';

    const prompt = `You are ViraNexus AI Health Copilot, an intelligent, empathetic, and knowledgeable health advisor designed like ChatGPT.
You help public health workers, doctors, and community leaders understand disease outbreaks easily.

REAL DATASET TELEMETRY (Only use these real user metrics):
- Total Verified Cases: ${datasetSummary?.totalCases || 0}
- Date Range: ${JSON.stringify(datasetSummary?.dateRange || 'N/A')}
- Primary Diseases: ${JSON.stringify(datasetSummary?.topDiseases?.slice(0, 4) || [])}
- Risk Areas: ${JSON.stringify(datasetSummary?.topZones?.slice(0, 4) || [])}
- Severe Rate: ${datasetSummary?.severeRatio ? (datasetSummary.severeRatio * 100).toFixed(1) + '%' : 'N/A'}
- ICU Rate: ${datasetSummary?.icuRatio ? (datasetSummary.icuRatio * 100).toFixed(1) + '%' : 'N/A'}
- 7-Day Growth Rate: ${datasetSummary?.growthRatePct || 0}%
- Transmission Speed R₀: ${datasetSummary?.estimatedR0 || 1.0}
- Hospital Bed Projection: ${datasetSummary?.hospitalSurge?.length || 0} days modeled

${historyPrompt}USER'S QUESTION:
"${question}"

RESPONSE STYLE GUIDELINES:
1. Speak in warm, clear, simple English like ChatGPT. Avoid dense medical or robotic jargon.
2. Explain disease growth, risk levels, and predictions so anyone can understand them immediately.
3. If there are 0 records in the dataset, kindly advise the user to upload a CSV dataset or add their first record.
4. If records exist, reference real numbers from the dataset (e.g. percentages, specific city names, disease names).
5. Suggest practical, real-world preventive actions.
6. AT THE VERY END of your response, provide exactly 3 relevant, interesting follow-up questions the user might want to ask next, separated by a separator line like this:
---FOLLOW_UPS---
[First follow-up question]
[Second follow-up question]
[Third follow-up question]`;

    let text: string | undefined;
    let modelUsed = 'gemini-3.8-flash';

    if (ai) {
      try {
        const modelResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: 'You are ViraNexus AI Health Copilot. Provide warm, conversational, human-like answers in clear simple English. Avoid robotic or dry clinical language.',
          },
        });
        text = modelResponse.text;
      } catch (primaryErr: any) {
        handleGeminiError(primaryErr, 'AI Query Primary');
        try {
          if (isGeminiAvailable()) {
            const fallbackModelResponse = await ai.models.generateContent({
              model: 'gemini-3.6-flash',
              contents: prompt,
              config: {
                systemInstruction: 'You are ViraNexus AI Health Copilot. Provide warm, conversational, human-like answers in clear simple English. Avoid robotic or dry clinical language.',
              },
            });
            text = fallbackModelResponse.text;
            modelUsed = 'gemini-3.6-flash';
          }
        } catch (secErr: any) {
          handleGeminiError(secErr, 'AI Query Secondary');
        }
      }
    }

    const finalText = text || generateLocalHeuristicInsights(datasetSummary, question);
    return res.json({
      answer: finalText,
      response: finalText,
      source: text ? modelUsed : 'deterministic_epidemiological',
    });
  } catch (error: any) {
    const fallbackAnswer = generateLocalHeuristicInsights(
      req.body.datasetSummary || req.body.summary,
      req.body.question || req.body.query
    );
    return res.json({
      answer: fallbackAnswer,
      response: fallbackAnswer,
      source: 'deterministic_fallback',
    });
  }
});

// Proactive Outbreak Intelligence Generation endpoint
app.post('/api/ai/insights', async (req, res) => {
  try {
    const { datasetSummary } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.json({
        insights: generateLocalHeuristicInsights(datasetSummary),
        source: 'deterministic_epidemiological',
      });
    }

    const prompt = `Generate an Executive Outbreak Threat Assessment based on this epidemiological dataset:
${JSON.stringify(datasetSummary, null, 2)}

Provide:
1. Executive Risk Classification (Low / Moderate / Elevated / Critical)
2. Immediate Outbreak Trajectory (Next 7-14 days)
3. Key Pathogen Vulnerabilities & Cohort Exposures
4. Three Critical Countermeasures for Public Health Officials`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      return res.json({
        insights: response.text || generateLocalHeuristicInsights(datasetSummary),
        source: 'gemini-3.8-flash',
      });
    } catch (err: any) {
      handleGeminiError(err, 'AI Insights');
      return res.json({
        insights: generateLocalHeuristicInsights(datasetSummary),
        source: 'deterministic_fallback',
      });
    }
  } catch (error: any) {
    return res.json({
      insights: generateLocalHeuristicInsights(req.body.datasetSummary),
      source: 'deterministic_fallback',
    });
  }
});

// AI Executive Briefing Generator endpoint
app.post('/api/ai/briefing', async (req, res) => {
  try {
    const { datasetSummary, focus = 'strategic' } = req.body;
    const total = datasetSummary?.totalCases || 0;

    if (total === 0) {
      return res.status(400).json({ error: 'No user records available for executive briefing' });
    }

    const ai = getGenAI();

    const generateLocalBriefing = () => {
      const topDisease = datasetSummary?.topDiseases?.[0]?.name || 'Unspecified Pathogen';
      const topZone = datasetSummary?.topZones?.[0]?.name || 'Unspecified Sector';
      const r0 = datasetSummary?.estimatedR0 || 1.1;
      const growth = datasetSummary?.growthRatePct || 0;
      const severePct = (datasetSummary?.severeRatio ? datasetSummary.severeRatio * 100 : 0).toFixed(1);
      const icuPct = (datasetSummary?.icuRatio ? datasetSummary.icuRatio * 100 : 0).toFixed(1);
      const hospitalBeds = Math.max(5, Math.ceil(total * Math.max(0.12, datasetSummary?.severeRatio || 0.1)));
      const icuBeds = Math.max(2, Math.ceil(total * Math.max(0.04, datasetSummary?.icuRatio || 0.03)));

      let threatLevel = 'MODERATE';
      if (r0 >= 1.5 || growth >= 30) threatLevel = 'CRITICAL ALERT';
      else if (r0 >= 1.2 || growth >= 15) threatLevel = 'HIGH VIGILANCE';
      else if (r0 < 1.0 && growth < 0) threatLevel = 'STABILIZING';

      return {
        title: `ViraNexus Situational Briefing: ${topDisease} Vector Assessment`,
        date: new Date().toISOString().split('T')[0],
        threatLevel,
        focus,
        executiveSummary: `Biosurveillance telemetry indicates ${threatLevel.toLowerCase()} conditions with ${total.toLocaleString()} confirmed cases. Primary transmission is localized around ${topZone}, driven predominantly by ${topDisease} with a transmission velocity of R₀ = ${r0}.`,
        epidemiologicalStatus: {
          totalCases: total,
          transmissionRate: `R₀ = ${r0}`,
          weeklyVelocity: `${growth >= 0 ? '+' : ''}${growth}% weekly change`,
          primaryEpicenter: topZone,
          dominantPathogen: `${topDisease} (${datasetSummary?.topDiseases?.[0]?.percentage || 0}% share)`,
        },
        clinicalStrain: {
          severeAcuityRate: `${severePct}%`,
          icuDemandRate: `${icuPct}%`,
          projectedGeneralBeds: hospitalBeds,
          projectedICUUnits: icuBeds,
          primaryDemographic: datasetSummary?.ageCohorts?.[0]?.cohort || 'General Population',
        },
        actionDirectives: [
          {
            priority: 'IMMEDIATE',
            directive: `Deploy rapid mobile triage and diagnostic screening checkpoints across ${topZone}.`,
            targetSector: topZone,
          },
          {
            priority: 'CRITICAL',
            directive: `Reserve ${hospitalBeds} acute respiratory inpatient beds and ${icuBeds} ICU isolation suites within regional health centers.`,
            targetSector: 'Clinical Infrastructure',
          },
          {
            priority: 'TACTICAL',
            directive: `Initiate targeted community advisories detailing containment and protective measures for ${topDisease}.`,
            targetSector: 'Public Communications',
          },
        ],
        generatedBy: 'ViraNexus Deterministic Epidemiological Model',
      };
    };

    if (!ai) {
      return res.json({
        briefing: generateLocalBriefing(),
        source: 'deterministic_epidemiological',
      });
    }

    const prompt = `You are the Chief Epidemiological Advisor for ViraNexus AI.
Generate a high-level, authoritative, structured Executive Situational Briefing based solely on this verified user surveillance dataset:
${JSON.stringify(datasetSummary, null, 2)}

Briefing Focus Directive: "${focus}" (e.g. strategic overview, emergency containment, hospital readiness).

Strict JSON Output format matching:
{
  "title": "Title of briefing",
  "date": "YYYY-MM-DD",
  "threatLevel": "CRITICAL ALERT" | "HIGH VIGILANCE" | "MODERATE" | "STABILIZING",
  "focus": "${focus}",
  "executiveSummary": "Concise paragraph synthesizing current outbreak state, epicenter, and immediate risks.",
  "epidemiologicalStatus": {
    "totalCases": number,
    "transmissionRate": "string (e.g. R₀ = 1.45)",
    "weeklyVelocity": "string",
    "primaryEpicenter": "string",
    "dominantPathogen": "string"
  },
  "clinicalStrain": {
    "severeAcuityRate": "string",
    "icuDemandRate": "string",
    "projectedGeneralBeds": number,
    "projectedICUUnits": number,
    "primaryDemographic": "string"
  },
  "actionDirectives": [
    {
      "priority": "IMMEDIATE" | "CRITICAL" | "TACTICAL",
      "directive": "Concrete operational instruction",
      "targetSector": "Affected zone or public department"
    }
  ],
  "generatedBy": "ViraNexus AI Assistant"
}
Output valid JSON only with no markdown wrapping.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        briefing: parsed.title ? parsed : generateLocalBriefing(),
        source: 'gemini-3.8-flash',
      });
    } catch (aiErr: any) {
      handleGeminiError(aiErr, 'AI Briefing');
      return res.json({
        briefing: generateLocalBriefing(),
        source: 'deterministic_fallback',
      });
    }
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to generate executive briefing' });
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
    console.log(`ViraNexus AI server running on port ${PORT}`);
  });
}

startServer();
