import { OnboardingAnswers } from '../types/onboarding';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const GROQ_MODEL = 'qwen/qwen3.8-27b';
/** Fallback model used if the primary model fails (rate limit, timeout, etc.) */
const GROQ_FALLBACK_MODEL = 'groq/compound-mini';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface WeeklySignal {
  /** Whether this message should be saved for weekly workout analysis */
  shouldSave: boolean;
  /** Category tag for the weekly analysis */
  tag: string;
  /** Short extracted insight (1 sentence) */
  insight: string;
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
  recentData?: { lastWorkout?: string; currentFeeling?: string }
): string {
  const userContext = answers ? `
User Profile Context:
- Name: ${answers.first_name || 'User'}
- Energy baseline: ${answers.energy_baseline || 'Not specified'}
- Joint sensitivities: ${answers.joint_sensitivities?.join(', ') || 'None noted'}
- Weekly training frequency goal: ${answers.weekly_frequency || '3-4 days'}
- Time commitment: ${answers.time_commitment === '15_min' ? '15 minutes' : answers.time_commitment === '45_min' ? '45 minutes' : '25-30 minutes'}
- Training location: ${answers.training_location === 'gym' ? 'Gym' : 'Home'}
- Target focus: ${answers.target_focus?.join(', ') || 'General longevity & joint care'}
${recentData?.lastWorkout ? `- Last workout performed: ${recentData.lastWorkout}` : ''}
${recentData?.currentFeeling ? `- User's current reported feeling: ${recentData.currentFeeling}` : ''}
` : '';

  return `You are FortyWell's AI Coach — a compassionate, science-informed fitness coach specifically designed for women 40+.

CORE IDENTITY:
- You're a supportive coach trained in hormone physiology, joint longevity, and nervous system pacing
- You specialize in perimenopause, menopause, and post-menopausal fitness
- You prioritize injury prevention, sustainable habits, and listening to the body's signals
- You adapt workouts based on energy, sleep, stress, and cycle phase

PRIORITIES IN YOUR RESPONSES:
1. Safety first — never recommend exercises that could harm joints or muscles
2. Honor energy levels — if someone is tired, suggest gentle movement or rest
3. Be supportive and non-judgmental — celebrate small wins
4. Consider hormone fluctuations and how they affect energy, mood, and recovery
5. Keep responses concise but personal — 2-4 sentences typically, more for complex questions

RESPONSE STYLE:
- Warm, conversational tone — like a supportive friend who happens to be a fitness expert
- Use the user's name when you know it
- Include practical, actionable advice
- Reference their profile when relevant
- Never make up medical information — defer to professionals for health concerns

${userContext}

Remember: You're coaching women over 40. Adapt your recommendations for:
- Joint sensitivity and protection
- Hormonal fluctuations affecting energy and recovery
- Time-efficient workouts (many women 40+ are busy)
- Sustainable, long-term habit building over quick fixes

AFTER your coaching reply, on a NEW LINE, append EXACTLY this JSON block (no markdown fences, no extra text):
[[SIGNAL:{"shouldSave":true/false,"tag":"Category • Label","insight":"One sentence summary of the health/fitness signal in this message"}]]

Set shouldSave=true if the message contains any of: energy level, sleep quality, soreness, mood, stress, workout readiness, pain, fatigue, motivation, hormonal symptoms, or any body signal relevant to weekly fitness analysis.
Set shouldSave=false for greetings, general questions about exercises, or unrelated topics.`;
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
  recentData?: { lastWorkout?: string; currentFeeling?: string }
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
          max_tokens: 600,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API error ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      if (!data.choices?.[0]) throw new Error('No choices in response');

      return (data.choices[0].message?.content || '')
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .trim();
    }

    // Try primary model first; fall back to lighter model on failure
    let rawReply = '';
    try {
      rawReply = await attemptModel(GROQ_MODEL);
    } catch (primaryErr) {
      console.warn(`[Groq] Primary model (${GROQ_MODEL}) failed:`, primaryErr, '— retrying with fallback model');
      try {
        rawReply = await attemptModel(GROQ_FALLBACK_MODEL);
      } catch (fallbackErr) {
        console.error('[Groq] Fallback model also failed:', fallbackErr);
        throw fallbackErr;
      }
    }

    if (!rawReply) {
      console.warn('[Groq] Empty reply after stripping think blocks.');
      return { reply: '', success: false, error: 'Empty reply' };
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
 * Fallback response when Groq fails
 */
export function getFallbackReply(): string {
  return `I'm having a bit of trouble connecting right now. Could you try again in a moment? I'm here to help you move better and feel stronger.`;
}