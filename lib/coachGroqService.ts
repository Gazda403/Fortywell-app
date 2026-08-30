import { OnboardingAnswers } from '../types/onboarding';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const GROQ_MODEL = 'qwen/qwen3.8-27b';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface GroqResponse {
  reply: string;
  success: boolean;
  error?: string;
}

/**
 * Context to provide to the AI about the FortyWell app
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
- Sustainable, long-term habit building over quick fixes`;
}

/**
 * Determine if a message should be handled by Groq AI instead of a pre-built response.
 *
 * DESIGN PRINCIPLE: Groq AI is the primary responder for all real conversation.
 * Pre-built canned replies are only used for extremely short/simple messages
 * (≤3 words or bare greetings) where adding AI latency is unnecessary.
 */
export function shouldUseGroqAI(input: string, _intentType: string): boolean {
  if (!input || !input.trim()) return false;
  // Always use real AI for all conversations
  return true;
}

/**
 * Send a message to Groq and get an AI response
 */
export async function sendToGroq(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant' | 'coach'; content: string }>,
  answers?: OnboardingAnswers | null,
  recentData?: { lastWorkout?: string; currentFeeling?: string }
): Promise<GroqResponse> {
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

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq API error:', response.status, errorData);
      return {
        reply: '',
        success: false,
        error: `API error: ${response.status}`,
      };
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      return {
        reply: '',
        success: false,
        error: 'No response from AI',
      };
    }

    const rawReply = data.choices[0].message?.content || '';
    const reply = rawReply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    return {
      reply,
      success: true,
    };
  } catch (error) {
    console.error('Groq service error:', error);
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
  return `I'm having a bit of trouble processing that right now. Could you try rephrasing, or let me know how you're feeling specifically? I'm here to help you move better and feel stronger.`;
}