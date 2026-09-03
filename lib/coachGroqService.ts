import { OnboardingAnswers } from '../types/onboarding';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';

/**
 * Production-verified chat models available on Groq:
 * 1. openai/gpt-oss-120b — flagship intelligence, deeply empathetic & articulate
 * 2. openai/gpt-oss-20b — lightning fast, reliable lightweight fallback
 * 3. qwen/qwen3.8-27b — conversational robustness fallback
 */
const GROQ_ACTIVE_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
];

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface WeeklySignal {
  /** Whether this message should be saved for weekly workout analysis */
  shouldSave: boolean;
  /** Category tag for the weekly analysis */
  tag: string;
  /** Short extracted insight (1 sentence) */
  insight: string;
  /** Specific workout adjustment if requested */
  workoutAdjustment?: string;
}

export interface GroqResponse {
  reply: string;
  success: boolean;
  error?: string;
  /** AI-determined weekly analysis signal — replaces keyword-based classifier */
  weeklySignal?: WeeklySignal;
}

/**
 * Build system prompt with user context.
 * The prompt instructs Groq to append a structured JSON block AFTER the reply
 * so we can parse weekly-analysis metadata without a second API call.
 */
function buildSystemContext(
  answers?: OnboardingAnswers | null,
  recentData?: {
    lastWorkout?: string;
    currentFeeling?: string;
    savedPreferences?: string;
    recentSignals?: string;
  }
): string {
  const name = answers?.first_name || 'Member';

  const userContext = answers ? `
User Profile:
- Name: ${name}
- Energy baseline: ${answers.energy_baseline || 'Not specified'}
- Joint sensitivities: ${answers.joint_sensitivities?.join(', ') || 'None noted'}
- Weekly training goal: ${answers.weekly_frequency || '3-4 days'}
- Session length: ${answers.time_commitment === '15_min' ? '15 minutes' : answers.time_commitment === '45_min' ? '45 minutes' : '25-30 minutes'}
- Training location: ${answers.training_location === 'gym' ? 'Gym' : 'Home'}
- Target focus: ${answers.target_focus?.join(', ') || 'General longevity & joint care'}
${recentData?.lastWorkout ? `- Last workout performed: ${recentData.lastWorkout}` : ''}
${recentData?.currentFeeling ? `- Today's reported feeling: ${recentData.currentFeeling}` : ''}
${recentData?.savedPreferences ? `- Saved training preferences: ${recentData.savedPreferences}` : ''}
${recentData?.recentSignals ? `- Recent health signals (last 7 days): ${recentData.recentSignals}` : ''}
` : `\nNo profile data yet — respond warmly and encourage the user to share how they are feeling.`;

  return `You are FortyWell's AI Coach — a compassionate, science-informed fitness coach built exclusively for women 40+.

CORE IDENTITY:
- Trained in hormone physiology, joint longevity, pelvic health, and nervous system pacing
- Specialises in perimenopause, menopause, and post-menopausal fitness
- Always prioritises injury prevention and listening to the body
- Adjusts workout recommendations dynamically based on energy, sleep quality, stress, soreness, and cycle phase

RESPONSE RULES:
1. Be real — give specific, substantive answers. Do NOT reply with vague platitudes like "I'm here to help" alone.
2. If the user describes a physical feeling (tired, sore, stiff, low energy, back pain), IMMEDIATELY suggest a concrete workout adjustment or recovery activity.
3. If the user mentions a goal (glutes, core, strength, weight loss), confirm you have saved it and describe exactly how their next sessions will change.
4. Use the user's name when you know it. Keep tone warm, human, and encouraging.
5. For casual messages, still engage meaningfully — ask a follow-up question about their body, energy, or goals. Never give a one-liner and stop.
6. Formatting: Use bullet points or short paragraphs. Keep replies under 200 words unless the user asks for a detailed plan.

${userContext}

---
IMPORTANT — You MUST always end your reply with this exact JSON on a new line. No exceptions:
[[SIGNAL:{"shouldSave":true/false,"tag":"Category • Label","insight":"One sentence describing what this message reveals about the user\'s fitness state or goals"}]]

shouldSave=true when the message contains: energy levels, sleep quality, mood, stress, soreness, pain, fatigue, readiness to train, hormonal symptoms, or any recovery/health signal.
shouldSave=false only for pure greetings or unrelated small talk.
---`;
}

/**
 * Determine if a message should be handled by Groq AI.
 * Always true — Groq is the primary responder for all real conversation.
 */
export function shouldUseGroqAI(input: string, _intentType: string): boolean {
  if (!input || !input.trim()) return false;
  return true;
}

/**
 * Parse the [[SIGNAL:...]] block appended by Groq at the end of its reply.
 */
function parseWeeklySignal(raw: string): { reply: string; weeklySignal?: WeeklySignal } {
  const signalMatch = raw.match(/\[\[SIGNAL:([\s\S]*?)\]\]/);
  if (!signalMatch) {
    return { reply: raw.trim() };
  }

  // Strip the signal block from the visible reply
  const reply = raw.replace(/\n?\[\[SIGNAL:[\s\S]*?\]\]/g, '').trim();

  try {
    const parsed = JSON.parse(signalMatch[1].trim());
    const weeklySignal: WeeklySignal = {
      shouldSave: Boolean(parsed.shouldSave),
      tag: String(parsed.tag || '💾 Weekly Analysis'),
      insight: String(parsed.insight || ''),
    };
    return { reply, weeklySignal };
  } catch {
    // JSON parse failed — still return the clean reply
    return { reply };
  }
}

/**
 * Send a message to Groq and get an AI response.
 * Returns both the coaching reply and a weekly analysis signal
 * determined by the AI (not by keyword matching).
 */
export async function sendToGroq(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant' | 'coach'; content: string }>,
  answers?: OnboardingAnswers | null,
  recentData?: {
    lastWorkout?: string;
    currentFeeling?: string;
    savedPreferences?: string;
    recentSignals?: string;
  }
): Promise<GroqResponse> {
  if (!GROQ_API_KEY) {
    console.error('Groq API key is missing — check EXPO_PUBLIC_GROQ_API_KEY in .env');
    return { reply: '', success: false, error: 'Missing API key' };
  }

  try {
    const systemMessage = buildSystemContext(answers, recentData);

    // Build conversation messages — keep last 8 turns for better continuity
    const messages = [
      { role: 'system' as const, content: systemMessage },
      ...conversationHistory.slice(-8).map(msg => ({
        role: msg.role === 'coach' ? 'assistant' as const : msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: userMessage },
    ];

    /**
     * Inner helper — attempt a single model and return raw text or throw.
     */
    async function attemptModel(model: string): Promise<string> {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData?.error?.message || JSON.stringify(errorData);
        if (response.status === 401) {
          throw new Error(`[Auth 401] Invalid or missing API key. Check EXPO_PUBLIC_GROQ_API_KEY in .env`);
        } else if (response.status === 404) {
          throw new Error(`[Model 404] Model "${model}" not found on Groq.`);
        } else if (response.status === 429) {
          throw new Error(`[Rate Limit 429] Too many requests. ${errMsg}`);
        }
        throw new Error(`[API ${response.status}] ${errMsg}`);
      }

      const data = await response.json();
      if (!data.choices?.[0]) throw new Error('No choices in response');

      return (data.choices[0].message?.content || '')
        .replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '')
        .trim();
    }

    // Try models in order of capability: 120B -> 20B -> 27B
    let rawReply = '';
    let lastError: any = null;

    for (const model of GROQ_ACTIVE_MODELS) {
      try {
        rawReply = await attemptModel(model);
        if (rawReply) break;
      } catch (err) {
        lastError = err;
        console.warn(`[Groq] Model ${model} failed:`, err, '— trying next model...');
      }
    }

    if (!rawReply) {
      if (lastError) throw lastError;
      return { reply: '', success: false, error: 'Empty reply from all models' };
    }

    const { reply, weeklySignal } = parseWeeklySignal(rawReply);
    return { reply, success: true, weeklySignal };

  } catch (error) {
    console.error('[Groq] Service error:', error);
    return {
      reply: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fallback response when Groq is completely unreachable (offline/airplane mode)
 */
export function getFallbackReply(userFirstName?: string): string {
  const greeting = userFirstName ? ` ${userFirstName}` : '';
  return `I'm having a bit of trouble connecting to the network right now${greeting}. Your previous check-ins and preferences are saved safely. Tell me how your body is feeling, and once our connection is back, I'll tune your sessions!`;
}