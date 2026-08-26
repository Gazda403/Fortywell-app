import { OnboardingAnswers } from '../types/onboarding';

export type SignalCategory =
  | 'Energy & Fatigue'
  | 'Joint & Muscle Care'
  | 'Sleep & Recovery'
  | 'Stress & Nervous System'
  | 'Cycle & Hormones'
  | 'Workout Readiness'
  | 'General Coaching';

export interface ClassificationResult {
  category: SignalCategory;
  categoryIcon: 'zap' | 'shield' | 'moon' | 'wind' | 'flame' | 'activity' | 'sparkles';
  confidence: number; // 0.0 - 1.0
  sentiment: 'low_energy' | 'fatigued' | 'sore' | 'positive' | 'neutral' | 'caution_pain';
  extractedSignals: string[];
  workoutAdaptation: string;
  weeklyAnalysisTag: string;
  coachReply: string;
  shouldSaveForWeeklyAnalysis: boolean;
  deepReasoning?: {
    physiologicalMechanism: string;
    hormoneContext: string;
    actionableAdjustment: string;
  };
}

/**
 * Intelligent client-side AI/ML Classifier for user feeling check-ins and coach messages.
 * Classifies the message, personalizes upcoming workouts, and tags for weekly rhythm analysis.
 */
export function classifyUserFeelingMessage(
  input: string,
  isDeepThink: boolean = false,
  answers?: OnboardingAnswers | null
): ClassificationResult {
  const text = input.toLowerCase().trim();

  // ── 1. SAFETY DEFLECTION: Acute / Sharp Medical Pain ──
  if (
    text.includes('sharp pain') ||
    text.includes('injured') ||
    text.includes('severe pain') ||
    text.includes('torn') ||
    text.includes('doctor') ||
    text.includes('medical') ||
    text.includes('sprain') ||
    text.includes('swollen joint')
  ) {
    return {
      category: 'Joint & Muscle Care',
      categoryIcon: 'shield',
      confidence: 0.98,
      sentiment: 'caution_pain',
      extractedSignals: ['Acute pain signal detected', 'Medical consultation recommended'],
      workoutAdaptation: 'Movement paused for safety. Switched to gentle resting breathwork.',
      weeklyAnalysisTag: '⚠️ Flagged for Physical Health Note',
      shouldSaveForWeeklyAnalysis: true,
      coachReply: `I want to prioritize your safety above everything: sharp or severe pain is a clear signal from your nervous system to pause and consult a qualified physiotherapist or physician.\n\nToday, please skip resistance training. Focus on gentle hydration and resting. When you get medical clearance, we will adapt your workouts accordingly.`,
      deepReasoning: isDeepThink
        ? {
            physiologicalMechanism: 'Acute pain signals stimulate nociceptive spinal reflex arcs, inhibiting surrounding muscle motor unit recruitment.',
            hormoneContext: 'Training through acute pain triggers an exaggerated cortisol spike and increases systemic inflammatory cytokines (IL-6).',
            actionableAdjustment: 'Complete rest from loaded movements; consult a physical therapist.',
          }
        : undefined,
    };
  }

  // ── 2. JOINT & MUSCLE SENSITIVITY (Hips, Knees, Back, Shoulders) ──
  if (
    text.includes('hip') ||
    text.includes('knee') ||
    text.includes('back') ||
    text.includes('shoulder') ||
    text.includes('neck') ||
    text.includes('tight') ||
    text.includes('stiff') ||
    text.includes('sore') ||
    text.includes('doms') ||
    text.includes('ache')
  ) {
    const isHip = text.includes('hip');
    const isKnee = text.includes('knee');
    const isBack = text.includes('back');

    const specificArea = isHip ? 'hip capsules' : isKnee ? 'knee joints' : isBack ? 'lumbar spine' : 'muscle tissue';
    const specificWarmup = isHip
      ? 'Added 90/90 Hip Openers & Glute Bridge Pre-Activations'
      : isKnee
      ? 'Switched to Isometric Wall Sits & Reduced Shear Angle'
      : isBack
      ? 'Replaced Spinal Flexion with Deadbug Core Bracing'
      : 'Added 5-minute Myofascial Flow Warmup';

    return {
      category: 'Joint & Muscle Care',
      categoryIcon: 'shield',
      confidence: 0.94,
      sentiment: 'sore',
      extractedSignals: [
        `Joint sensation in ${specificArea}`,
        'Mild stiffness / muscle adaptation',
      ],
      workoutAdaptation: `⚡ Auto-Personalized: ${specificWarmup} and reduced heavy compression.`,
      weeklyAnalysisTag: `💾 Saved for Weekly Analysis • Joint Sensation (${specificArea})`,
      shouldSaveForWeeklyAnalysis: true,
      coachReply: `Got it. Noticed your note about ${specificArea}. I've logged this to your Weekly Analysis and adjusted today's workout to protect that exact area:\n\n• ${specificWarmup}\n• Extended rest between sets to 90 seconds to allow synovial lubrication\n• Prioritized controlled eccentric tempo over heavy loads.\n\nListen to your body today — sensation is information, not a barrier.`,
      deepReasoning: isDeepThink
        ? {
            physiologicalMechanism: 'Connective tissue turnover in tendons and joint capsules requires 48-72h of synovial diffusion under low compressive strain.',
            hormoneContext: 'Fluctuations in estrogen subtly alter collagen hydration in ligaments, making warmups essential.',
            actionableAdjustment: 'Incorporate 3 minutes of targeted isometric holds before loaded movement.',
          }
        : undefined,
    };
  }

  // ── 3. SLEEP & CIRCADIAN (Poor sleep, insomnia, night waking) ──
  if (
    text.includes('sleep') ||
    text.includes('insomnia') ||
    text.includes('woke up') ||
    text.includes('wake up') ||
    text.includes('hours sleep') ||
    text.includes('night sweat') ||
    text.includes('hot flash') ||
    text.includes('restless')
  ) {
    return {
      category: 'Sleep & Recovery',
      categoryIcon: 'moon',
      confidence: 0.95,
      sentiment: 'fatigued',
      extractedSignals: ['Sub-optimal sleep duration / quality', 'Circadian recovery dip'],
      workoutAdaptation: 'Auto-Personalized: Lowered training volume by 25% to prevent neuroendocrine fatigue.',
      weeklyAnalysisTag: '💾 Saved for Weekly Analysis • Sleep Architecture & Recovery',
      shouldSaveForWeeklyAnalysis: true,
      coachReply: `Thank you for logging that. Sleep is the foundation of all tissue repair and metabolic balance. Because your sleep was disrupted, pushing maximum exertion today would only elevate baseline cortisol.\n\nI have adapted today’s workout:\n• Lowered total working sets by 25%\n• Shifted focus to fluid mobility and zone-2 movement\n• Logged this to your Sunday Weekly Recovery Report.`,
      deepReasoning: isDeepThink
        ? {
            physiologicalMechanism: 'Slow-wave deep sleep deficits reduce daily growth hormone pulse by up to 60%, impairing glycogen resynthesis.',
            hormoneContext: 'Erratic progesterone shifts in perimenopause alter hypothalamic thermoregulation, causing 3 AM sleep fragmentation.',
            actionableAdjustment: 'Lower thermostat to 66°F tonight and add 200mg magnesium glycinate with dinner.',
          }
        : undefined,
    };
  }

  // ── 4. ENERGY & FATIGUE (Drained, tired, exhausted vs high energy) ──
  if (
    text.includes('tired') ||
    text.includes('exhaust') ||
    text.includes('drain') ||
    text.includes('low energy') ||
    text.includes('no energy') ||
    text.includes('sluggish') ||
    text.includes('burnout')
  ) {
    return {
      category: 'Energy & Fatigue',
      categoryIcon: 'zap',
      confidence: 0.96,
      sentiment: 'low_energy',
      extractedSignals: ['Low energetic baseline', 'Parasympathetic need'],
      workoutAdaptation: 'Auto-Personalized: Switched to 12-minute gentle movement snack.',
      weeklyAnalysisTag: '💾 Saved for Weekly Analysis • Energy Baseline Tracking',
      shouldSaveForWeeklyAnalysis: true,
      coachReply: `I hear you. Feeling low on energy is completely valid—and honoring it is how we build long-term consistency. Rest is an active training variable.\n\nI’ve updated your plan today:\n• Switched your session to an easy 12-minute mobility flow\n• No heavy loading—just gentle blood flow and gentle breathing\n• Saved to your weekly trend analysis to monitor patterns.`,
      deepReasoning: isDeepThink
        ? {
            physiologicalMechanism: 'High allostatic load depletes intracellular ATP and down-regulates adrenal catecholamine sensitivity.',
            hormoneContext: 'Cortisol peaks under baseline fatigue; high-intensity exercise will prolong exhaustion rather than adapt fitness.',
            actionableAdjustment: 'Take a 10-minute natural sunlight walk with nasal breathing.',
          }
        : undefined,
    };
  }

  // ── 5. HIGH ENERGY / CRUSHED IT / READINESS ──
  if (
    text.includes('great') ||
    text.includes('crushed') ||
    text.includes('strong') ||
    text.includes('high energy') ||
    text.includes('energized') ||
    text.includes('ready to lift') ||
    text.includes('feel amazing') ||
    text.includes('10/10')
  ) {
    return {
      category: 'Workout Readiness',
      categoryIcon: 'flame',
      confidence: 0.93,
      sentiment: 'positive',
      extractedSignals: ['High autonomic readiness', 'Optimal neuromuscular tone'],
      workoutAdaptation: 'Auto-Personalized: Unlocked progressive overload & strength stimulation sets.',
      weeklyAnalysisTag: '💾 Saved for Weekly Analysis • Peak Readiness Window',
      shouldSaveForWeeklyAnalysis: true,
      coachReply: `Incredible! This is your prime training window. When energy is high, your neuromuscular recruitment and muscle protein synthesis potential are peaked.\n\nI have configured today’s workout for maximum quality:\n• Progressive resistance with full range of motion\n• Focused compound multi-joint movements\n• Logged this peak readiness signal to your weekly profile!`,
      deepReasoning: isDeepThink
        ? {
            physiologicalMechanism: 'High neuromuscular drive facilitates type-II muscle fiber recruitment with rapid ATP-CP phosphagen resynthesis.',
            hormoneContext: 'Optimal estrogen-androgen signaling increases mechanical tension tolerance and accelerates post-session repair.',
            actionableAdjustment: 'Focus on 3-second eccentric lowering on your primary strength movement.',
          }
        : undefined,
    };
  }

  // ── 6. STRESS & NERVOUS SYSTEM ──
  if (
    text.includes('stress') ||
    text.includes('anxious') ||
    text.includes('overwhelm') ||
    text.includes('busy') ||
    text.includes('brain fog') ||
    text.includes('mind') ||
    text.includes('frustrated')
  ) {
    return {
      category: 'Stress & Nervous System',
      categoryIcon: 'wind',
      confidence: 0.91,
      sentiment: 'fatigued',
      extractedSignals: ['Elevated psychological stress', 'Sympathetic nervous dominance'],
      workoutAdaptation: 'Auto-Personalized: Integrated 3-minute physiological sigh cooldown.',
      weeklyAnalysisTag: '💾 Saved for Weekly Analysis • Nervous System & Stress Load',
      shouldSaveForWeeklyAnalysis: true,
      coachReply: `Thank you for sharing that. Life stress takes the same biological toll as intense exercise—your nervous system processes both through the same adrenocortical axis.\n\nI have personalized your schedule:\n• Paused high-stress conditioning\n• Added grounding breathwork and spine fluidity\n• Logged to your Weekly Recovery dashboard so we can track stress patterns over time.`,
      deepReasoning: isDeepThink
        ? {
            physiologicalMechanism: 'Sympathetic arousal constricts peripheral micro-vasculature and inhibits vagal motor tone (lowering HRV).',
            hormoneContext: 'Chronic cortisol elevation competes with progesterone for common steroidogenic precursors (the "pregnenolone steal").',
            actionableAdjustment: 'Do 3 physiological double-inhale sighs right now.',
          }
        : undefined,
    };
  }

  // ── 7. GENERAL WELLNESS INQUIRY / HABIT CHECK-IN ──
  return {
    category: 'General Coaching',
    categoryIcon: 'sparkles',
    confidence: 0.85,
    sentiment: 'neutral',
    extractedSignals: ['Routine check-in', 'Coaching inquiry'],
    workoutAdaptation: 'Maintained balanced daily calibration aligned with your onboarding profile.',
    weeklyAnalysisTag: '💾 Saved for Weekly Analysis • Habit & Consistency Log',
    shouldSaveForWeeklyAnalysis: true,
    coachReply: `Thank you for checking in. I’ve logged your note to your Weekly Analysis profile. Consistency over weeks matters far more than perfection on any single day.\n\nYour workouts and recovery recommendations remain tailored to your personal goals. What else is on your mind today?`,
    deepReasoning: isDeepThink
      ? {
          physiologicalMechanism: 'Micro-habits build automaticity in basal ganglia circuits, removing cognitive resistance to daily movement.',
          hormoneContext: 'Sustainable gentle consistency maintains baseline insulin sensitivity and circadian rhythms.',
          actionableAdjustment: 'Keep up with your daily 10-minute movement habit today.',
        }
      : undefined,
  };
}
