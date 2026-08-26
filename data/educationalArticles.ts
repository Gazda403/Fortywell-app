export interface ArticleSection {
  heading: string;
  paragraphs: string[];
}

export interface FullArticleContent {
  takeaway: string;
  sections: ArticleSection[];
  actionStep: string;
  evidenceBadge?: string;
}

export type ArticleCategory =
  | 'all'
  | 'hormones'
  | 'movement'
  | 'sleep'
  | 'recovery'
  | 'nutrition'
  | 'joints';

export interface EducationalArticle {
  id: string;
  tag: string;
  category: ArticleCategory;
  title: string;
  preview: string;
  readTime: string;
  iconType:
    | 'wind'
    | 'zap'
    | 'moon'
    | 'heart'
    | 'shield'
    | 'sparkles'
    | 'leaf'
    | 'flame'
    | 'activity'
    | 'sun'
    | 'droplet'
    | 'bone';
  bgColor: string;
  borderColor: string;
  accentColor: string;
  fullContent: FullArticleContent;
}

export const ALL_EDUCATIONAL_ARTICLES: EducationalArticle[] = [
  // ── 1. CORTISOL & STRESS PHYSIOLOGY ──
  {
    id: 'art-01',
    tag: 'CORTISOL & MOVEMENT',
    category: 'recovery',
    title: 'Why stress makes exercise feel harder',
    preview: 'Elevated cortisol reduces workout quality and tissue recovery. Here is how to work with your nervous system rather than fighting it.',
    readTime: '3 min read',
    iconType: 'wind',
    bgColor: '#EFF4EA',
    borderColor: '#D5E2C8',
    accentColor: '#708655',
    fullContent: {
      takeaway: 'Exercise is a physiological stressor. When baseline stress is high, high-intensity training adds allostatic overload rather than fitness adaptation.',
      sections: [
        {
          heading: 'The Allostatic Load Equation',
          paragraphs: [
            'Your nervous system cannot distinguish between psychological stress (deadlines, poor sleep, life demands) and physical stress (a heavy resistance session). Both draw from the same biological energy budget.',
            'When cortisol remains chronically elevated, your muscles experience reduced glycogen synthesis and slower micro-tear repair. What would normally be an energizing workout becomes exhausting.',
          ],
        },
        {
          heading: 'Adapting Your Protocol',
          paragraphs: [
            'On days where life stress exceeds a 7 out of 10, shift from high-glycolytic exertion to zone-2 walking, pelvic mobility, or slow tempo strength with extended rest periods (90-120 seconds).',
            'This preserves lean muscle stimulus while preventing the neuroendocrine crash that leads to 3 PM brain fog and nighttime insomnia.',
          ],
        },
      ],
      actionStep: 'If your energy baseline feels depleted today, replace one set with 2 minutes of diaphragmatic box breathing between movements.',
      evidenceBadge: 'Endocrine Society Consensus on Stress & Muscle Metabolism',
    },
  },
  {
    id: 'art-02',
    tag: 'NERVOUS SYSTEM',
    category: 'recovery',
    title: 'HRV: The single most honest metric of recovery',
    preview: 'Heart Rate Variability reveals whether your parasympathetic brake is engaged or if you are running on adrenaline reserves.',
    readTime: '3 min read',
    iconType: 'heart',
    bgColor: '#F2EFF9',
    borderColor: '#D8CFF0',
    accentColor: '#7B68B5',
    fullContent: {
      takeaway: 'Higher HRV indicates greater autonomic flexibility. A sudden drop signals it is time to prioritize joint fluidity over maximum load.',
      sections: [
        {
          heading: 'Understanding Beat-to-Beat Variation',
          paragraphs: [
            'A healthy heart does not tick like a mechanical clock. The micro-intervals between consecutive heartbeats fluctuate constantly in response to respiration and autonomic nervous system signals.',
            'When HRV is high, your parasympathetic "rest and digest" system is responsive. When HRV drops significantly below your personal 7-day rolling average, your sympathetic nervous system is dominating.',
          ],
        },
        {
          heading: 'How to Respond to a Low HRV Day',
          paragraphs: [
            'Do not cancel movement entirely. Instead, eliminate high-velocity plyometrics and replace them with isometric holds, spinal decompressions, and long nasal-breathing walks.',
          ],
        },
      ],
      actionStep: 'Spend 5 minutes before your workout doing 4-second inhales and 6-second exhales to engage the vagus nerve.',
      evidenceBadge: 'Journal of Applied Physiology • Autonomic Regulation',
    },
  },
  {
    id: 'art-03',
    tag: 'CORTISOL RHYTHM',
    category: 'hormones',
    title: 'The morning cortisol awakening curve',
    preview: 'Morning cortisol should peak 30–45 minutes after waking. Missing this window can disrupt your circadian rhythm all day.',
    readTime: '2 min read',
    iconType: 'sun',
    bgColor: '#FFF5E9',
    borderColor: '#F0D5B8',
    accentColor: '#D68838',
    fullContent: {
      takeaway: 'Early natural sunlight and gentle movement anchor your cortisol awakening response, promoting steady daytime energy and deep nighttime melatonin release.',
      sections: [
        {
          heading: 'Setting the Circadian Clock',
          paragraphs: [
            'Within 60 minutes of waking, getting 10 minutes of outdoor natural light signals the hypothalamic suprachiasmatic nucleus to synchronize all cellular peripheral clocks.',
            'Pairing this light exposure with 5 minutes of gentle joint mobility (like our Morning Fluidity routine) optimizes insulin sensitivity for the upcoming day.',
          ],
        },
      ],
      actionStep: 'Step outside within 30 minutes of waking and do 10 gentle arm sweeps toward the sky.',
      evidenceBadge: 'Chronobiology International',
    },
  },
  {
    id: 'art-04',
    tag: 'VAGUS NERVE',
    category: 'recovery',
    title: 'Down-regulating your nervous system in 90 seconds',
    preview: 'The physiological sigh is the fastest evidence-based technique to lower heart rate and reduce acute workout anxiety.',
    readTime: '2 min read',
    iconType: 'wind',
    bgColor: '#EFF4EA',
    borderColor: '#D5E2C8',
    accentColor: '#708655',
    fullContent: {
      takeaway: 'Two quick nasal inhales followed by a long, unforced mouth exhale re-inflates collapsed pulmonary alveoli and immediately slows heart rate.',
      sections: [
        {
          heading: 'The Mechanics of the Double Inhale',
          paragraphs: [
            'Discovered by pulmonary physiologists, the double inhale followed by an extended sigh activates baroreceptors in the aortic arch, sending an immediate inhibitory signal to the sympathetic pacemaker.',
            'Using this between intense sets or directly after completing your workout transitions your body from catabolic breakdown to anabolic recovery.',
          ],
        },
      ],
      actionStep: 'Perform 3 consecutive physiological sighs right after completing your last exercise block today.',
      evidenceBadge: 'Cell Reports Medicine • Stanford Neurobiology',
    },
  },
  {
    id: 'art-05',
    tag: 'ADRENAL HEALTH',
    category: 'hormones',
    title: 'Why fasting workouts might not serve you in your 40s',
    preview: 'Fasted exercise causes an exaggerated cortisol spike when estrogen is fluctuating. A small protein-carb anchor changes everything.',
    readTime: '3 min read',
    iconType: 'flame',
    bgColor: '#F9EEF1',
    borderColor: '#E8C4CC',
    accentColor: '#C96374',
    fullContent: {
      takeaway: 'Exercising with low circulating amino acids forces the body to release higher cortisol and break down skeletal muscle tissue for gluconeogenesis.',
      sections: [
        {
          heading: 'Estrogen, Cortisol, and Glycogen Storage',
          paragraphs: [
            'Estrogen is a natural anti-catabolic agent that helps spare muscle glycogen. As estrogen levels fluctuate during perimenopause, the protective buffer diminishes.',
            'Consuming 15–20g of protein or a light carbohydrate anchor 30–45 minutes before strength training blunt excessive cortisol elevation and supports power output.',
          ],
        },
      ],
      actionStep: 'Try having half a banana with a tablespoon of almond butter or a collagen coffee 30 minutes before your next morning workout.',
      evidenceBadge: 'International Society of Sports Nutrition (ISSN)',
    },
  },

  // ── 2. PERIMENOPAUSE & HORMONAL DYNAMICS ──
  {
    id: 'art-06',
    tag: 'PERIMENOPAUSE',
    category: 'hormones',
    title: 'Strength training in your 40s: what actually changes',
    preview: 'Declining estrogen affects muscle protein synthesis. Progressive resistance training remains the single most effective biological counter-measure.',
    readTime: '3 min read',
    iconType: 'zap',
    bgColor: '#F9EEF1',
    borderColor: '#E8C4CC',
    accentColor: '#C96374',
    fullContent: {
      takeaway: 'Lifting moderate-to-heavy resistance provides the mechanical tension required to trigger mTOR signaling when hormonal signals decline.',
      sections: [
        {
          heading: 'The Cellular Shift in Muscle Building',
          paragraphs: [
            'Estrogen receptors (ER-beta) are embedded directly within skeletal muscle tissue. In earlier decades, estrogen helped activate satellite cells and repair fibers automatically.',
            'After age 40, we must supply the stimulus through mechanical overload—meaning lifting weights that feel challenging on the last 2–3 repetitions of each set.',
          ],
        },
        {
          heading: 'Focus on Quality Over Volume',
          paragraphs: [
            'You do not need 20 sets per workout. 3 to 4 focused compound exercises done with full range of motion and joint-safe form create superior results with zero joint burnout.',
          ],
        },
      ],
      actionStep: 'Focus on reaching a 7 out of 10 effort on your main movement block today—making the last 2 reps purposeful and controlled.',
      evidenceBadge: 'Climacteric • International Menopause Society',
    },
  },
  {
    id: 'art-07',
    tag: 'ESTROGEN DYNAMICS',
    category: 'hormones',
    title: 'Estrogen and joint laxity: The monthly vulnerability window',
    preview: 'Fluctuating estrogen levels influence collagen synthesis and ligament stiffness. Knowing when to stabilize protects your knees.',
    readTime: '3 min read',
    iconType: 'shield',
    bgColor: '#EBF6F8',
    borderColor: '#CCE7EC',
    accentColor: '#388B9E',
    fullContent: {
      takeaway: 'Collagen structures in tendons and ligaments become softer under high estrogen spikes and stiffer during sudden drops. Core bracing provides the missing stability.',
      sections: [
        {
          heading: 'Hormones and Connective Tissue',
          paragraphs: [
            'Estrogen receptors are present in the anterior cruciate ligament (ACL) and patellar tendons. Rapid hormonal fluctuations can subtly alter joint proprioception.',
            'By incorporating deliberate isometric warmups (such as glute bridges and wall sits), you preload the muscular sleeves around the joint to absorb shear force.',
          ],
        },
      ],
      actionStep: 'Always complete our 3-minute knee-stabilization warmup before doing any lower-body squats or lunges.',
      evidenceBadge: 'American Journal of Sports Medicine',
    },
  },
  {
    id: 'art-08',
    tag: 'PROGESTERONE & CALM',
    category: 'hormones',
    title: 'Why sleep disrupts during the luteal phase',
    preview: 'Progesterone converts to allopregnanolone, a natural GABA booster. When it drops, nighttime awakenings surge.',
    readTime: '3 min read',
    iconType: 'moon',
    bgColor: '#F2EFF9',
    borderColor: '#D8CFF0',
    accentColor: '#7B68B5',
    fullContent: {
      takeaway: 'Understanding that nighttime wakeups are neurochemical—not psychological—removes sleep anxiety and allows effective soothing strategies.',
      sections: [
        {
          heading: 'Thermoregulation and GABA Receptors',
          paragraphs: [
            'Progesterone naturally elevates core body temperature by 0.5°F. When progesterone levels drop erratically in perimenopause, the hypothalamus temperature set-point fluctuates, causing 3 AM hot flashes.',
            'Lower ambient bedroom temperature (65–68°F) and evening magnesium glycinate support natural GABAergic calming.',
          ],
        },
      ],
      actionStep: 'Lower your bedroom thermostat by 2 degrees tonight and sip a warm chamomile or magnesium infusion before bed.',
      evidenceBadge: 'Sleep Medicine Reviews • Neuroendocrinology',
    },
  },
  {
    id: 'art-09',
    tag: 'INSULIN SENSITIVITY',
    category: 'hormones',
    title: 'Hormonal shifts and metabolic flexibility',
    preview: 'Lower estrogen subtly reduces muscle insulin sensitivity. Skeletal muscle contraction is the fastest non-insulin glucose disposal tool.',
    readTime: '3 min read',
    iconType: 'activity',
    bgColor: '#EFF4EA',
    borderColor: '#D5E2C8',
    accentColor: '#708655',
    fullContent: {
      takeaway: 'Contracting large muscle groups (quads, glutes, lats) opens GLUT4 glucose transporters independently of insulin.',
      sections: [
        {
          heading: 'The 10-Minute Post-Meal Window',
          paragraphs: [
            'Taking a gentle 10-to-15 minute stroll after your largest meal blunts postprandial glucose spikes by up to 35% compared to sitting.',
            'This prevents reactive hypoglycemia dips that trigger sugar cravings and midafternoon lethargy.',
          ],
        },
      ],
      actionStep: 'Take a leisurely 10-minute walk after lunch or dinner today.',
      evidenceBadge: 'Diabetes Care • American Diabetes Association',
    },
  },
  {
    id: 'art-10',
    tag: 'TESTOSTERONE IN WOMEN',
    category: 'hormones',
    title: 'The forgotten driver of female drive and bone mineral',
    preview: 'Women produce more testosterone than estrogen by total mass. Preserving it requires smart resistance training and adequate dietary fat.',
    readTime: '3 min read',
    iconType: 'flame',
    bgColor: '#FFF5E9',
    borderColor: '#F0D5B8',
    accentColor: '#D68838',
    fullContent: {
      takeaway: 'Testosterone supports motivation, mental clarity, libido, and bone remodeling. Chronic low-fat dieting and excessive cardio suppress it.',
      sections: [
        {
          heading: 'Nourishing the Androgen Pathway',
          paragraphs: [
            'Androgens in women are synthesized in the ovaries and adrenal glands from cholesterol precursors. Very low-calorie or fat-free diets deprive steroidogenesis of building blocks.',
            'Compound multi-joint movements like Romanian deadlifts and chest presses trigger localized neuromuscular androgen receptor upregulation.',
          ],
        },
      ],
      actionStep: 'Include healthy dietary lipids (avocado, extra virgin olive oil, walnuts, or egg yolks) in your meals today.',
      evidenceBadge: 'European Journal of Endocrinology',
    },
  },
  {
    id: 'art-11',
    tag: 'BRAIN HEALTH & BDNF',
    category: 'hormones',
    title: 'Clearing brain fog with Brain-Derived Neurotrophic Factor',
    preview: 'Resistance training and coordinated balance drills stimulate BDNF, creating new neural pathways and protecting cognitive longevity.',
    readTime: '3 min read',
    iconType: 'sparkles',
    bgColor: '#F2EFF9',
    borderColor: '#D8CFF0',
    accentColor: '#7B68B5',
    fullContent: {
      takeaway: 'Physical movement is cognitive medicine. Complex movement patterns like balance reach-backs stimulate cerebellar and hippocampal neuroplasticity.',
      sections: [
        {
          heading: 'The Exercise-Neurogenesis Link',
          paragraphs: [
            'When muscles contract against resistance, they secrete myokines into the bloodstream. One key myokine, irisin, crosses the blood-brain barrier and triggers BDNF production in the hippocampus.',
            'This explains the immediate surge in executive clarity and mood elevation felt 20 minutes after completing a Fortywell workout.',
          ],
        },
      ],
      actionStep: 'Notice how your mental focus shifts before versus after today’s session.',
      evidenceBadge: 'Nature Neuroscience • Cognitive Longevity Research',
    },
  },

  // ── 3. BONE DENSITY & SKELETAL HEALTH ──
  {
    id: 'art-12',
    tag: 'BONE DENSITY',
    category: 'movement',
    title: 'Osteogenic loading: How bones listen to mechanical strain',
    preview: 'Bones remodel under compressive and tensile forces. Gentle impact and resistance training tell osteoblasts to deposit new mineral.',
    readTime: '3 min read',
    iconType: 'bone',
    bgColor: '#FFF5E9',
    borderColor: '#F0D5B8',
    accentColor: '#D68838',
    fullContent: {
      takeaway: 'Walking maintains baseline bone, but dynamic directional loading and resistance create the piezoelectric signal that stimulates osteoblasts.',
      sections: [
        {
          heading: 'Wolff’s Law and Mechanical Stress',
          paragraphs: [
            'Bones adapt structurally along the lines of stress placed upon them. When muscles pull firmly on tendons connected to the periosteum, bone tissue responds by increasing trabecular thickness.',
            'Exercises like heel drops, goblet squats, and banded hinges stimulate the femoral neck and lumbar spine—the two most critical fracture risk sites.',
          ],
        },
      ],
      actionStep: 'Perform 10 gentle heel stomps/drops onto a firm surface after your warmup today to stimulate osteogenic signaling.',
      evidenceBadge: 'Journal of Bone and Mineral Research',
    },
  },
  {
    id: 'art-13',
    tag: 'POSTURE & SPINE',
    category: 'movement',
    title: 'Thoracic extension: Preventing the forward curve',
    preview: 'Desk posture combined with bone density loss leads to thoracic kyphosis. Daily foam roller and wall angels reverse the pattern.',
    readTime: '2 min read',
    iconType: 'activity',
    bgColor: '#EFF4EA',
    borderColor: '#D5E2C8',
    accentColor: '#708655',
    fullContent: {
      takeaway: 'Restoring thoracic spine mobility reduces neck pain, improves diaphragm expansion, and protects lumbar discs from compensation.',
      sections: [
        {
          heading: 'The Thoracic-Diaphragm Link',
          paragraphs: [
            'When the mid-back rounds forward, the ribs compress the diaphragm, forcing shallow chest breathing that elevates stress hormones.',
            'Opening the chest with cat-cow mobility and prone cobra holds instantly restores 15% greater lung capacity and relieves neck tension.',
          ],
        },
      ],
      actionStep: 'Do 5 thoracic extensions over the back of your chair or with our spine mobility routine today.',
      evidenceBadge: 'Spine Journal • Ergonomics & Spinal Biomechanics',
    },
  },
  {
    id: 'art-14',
    tag: 'JOINT PRESERVATION',
    category: 'joints',
    title: 'Cartilage has no blood supply: Why movement is its only nutrition',
    preview: 'Synovial fluid circulation depends entirely on cyclical joint compression and decompression. Motion is lotion.',
    readTime: '3 min read',
    iconType: 'droplet',
    bgColor: '#EBF6F8',
    borderColor: '#CCE7EC',
    accentColor: '#388B9E',
    fullContent: {
      takeaway: 'Articular cartilage receives oxygen and nutrients through the sponge-like absorption of synovial fluid during low-impact, full-range movement.',
      sections: [
        {
          heading: 'The Synovial Pump Mechanism',
          paragraphs: [
            'Unlike muscle tissue, cartilage lacks capillaries. When you gently bend and extend a knee or hip through its comfortable range, cartilage squeezes waste out on compression and sucks nutrient-rich fluid in on release.',
            'Sitting motionless for 4 hours causes synovial fluid to thicken, creating morning stiffness. Gentle morning movement liquefies synovial hyaluronic acid within 3 minutes.',
          ],
        },
      ],
      actionStep: 'Try our 4-minute Morning Fluidity routine right when you roll out of bed to lubricate major joints.',
      evidenceBadge: 'Osteoarthritis and Cartilage • OARSI Guidelines',
    },
  },
  {
    id: 'art-15',
    tag: 'BALANCE & PROPRIOCEPTION',
    category: 'movement',
    title: 'Single-leg stability: Your longevity insurance policy',
    preview: 'The ability to balance on one leg for 20+ seconds is strongly correlated with fall prevention and cognitive longevity.',
    readTime: '2 min read',
    iconType: 'shield',
    bgColor: '#F2EFF9',
    borderColor: '#D8CFF0',
    accentColor: '#7B68B5',
    fullContent: {
      takeaway: 'Single-leg stability activates deep ankle stabilizers and the gluteus medius, safeguarding against lateral slips and knee collapse.',
      sections: [
        {
          heading: 'Training the Neuromuscular Reflex',
          paragraphs: [
            'Balance relies on three sensory inputs: vision, inner ear vestibular system, and ankle proprioceptors. As we age, visual reliance increases while ankle reflexes slow down.',
            'Practicing single-leg balance while brushing teeth or during workout warmups retrains the micro-adjustments required to prevent falls.',
          ],
        },
      ],
      actionStep: 'Stand on one foot for 20 seconds while waiting for your tea or coffee to brew this morning.',
      evidenceBadge: 'British Journal of Sports Medicine (BJSM)',
    },
  },

  // ── 4. SLEEP ARCHITECTURE & CIRCADIAN RHYTHM ──
  {
    id: 'art-16',
    tag: 'SLEEP SCIENCE',
    category: 'sleep',
    title: 'The hormone repair that only happens when you sleep',
    preview: 'Growth hormone, insulin sensitivity, and tissue repair are all regulated overnight. Sleep is the original recovery tool.',
    readTime: '3 min read',
    iconType: 'moon',
    bgColor: '#F2EFF9',
    borderColor: '#D8CFF0',
    accentColor: '#7B68B5',
    fullContent: {
      takeaway: 'Over 70% of daily human growth hormone (HGH) is pulsed during Stage 3 Slow-Wave Deep Sleep. Deep sleep is when muscle and connective tissue rebuild.',
      sections: [
        {
          heading: 'The Slow-Wave Sleep Window',
          paragraphs: [
            'During deep slow-wave sleep, blood supply to muscles increases, physiological tissue repairs accelerate, and cellular amino acid uptake peaks.',
            'Alcohol or heavy meals within 3 hours of bed elevate resting heart rate and fragment this critical slow-wave phase, leading to chronic muscle soreness.',
          ],
        },
      ],
      actionStep: 'Finish eating at least 2.5 hours before your target bedtime tonight to allow core temperature to drop naturally.',
      evidenceBadge: 'Sleep Research Society Consensus',
    },
  },
  {
    id: 'art-17',
    tag: 'CIRCADIAN LIGHT',
    category: 'sleep',
    title: 'Blue light after sunset: What it does to melatonin',
    preview: 'Melanopsin retinal cells suppress melatonin when exposed to overhead LED lighting. Warm lamps and amber screens preserve sleep onset.',
    readTime: '2 min read',
    iconType: 'sun',
    bgColor: '#FFF5E9',
    borderColor: '#F0D5B8',
    accentColor: '#D68838',
    fullContent: {
      takeaway: 'Dimming overhead lights 60 minutes before bed signals your pineal gland to release natural melatonin, reducing time to fall asleep.',
      sections: [
        {
          heading: 'Shifting to Low-Lux Amber Lighting',
          paragraphs: [
            'Human eyes evolved to register sunset’s warm, low-angle wavelength. Bright overhead kitchen lights and phone screens fool the brain into believing it is 2:00 PM.',
            'Switching to warm table lamps and using night-shift display filters preserves your natural sleep architecture.',
          ],
        },
      ],
      actionStep: 'Turn off harsh overhead ceiling lights 1 hour before sleep tonight and use soft floor or bedside lamps instead.',
      evidenceBadge: 'Journal of Clinical Endocrinology & Metabolism',
    },
  },
  {
    id: 'art-18',
    tag: 'THERMOREGULATION',
    category: 'sleep',
    title: 'The hot bath sleep paradox: How heat cools you down',
    preview: 'Taking a warm shower 90 minutes before bed dilates peripheral blood vessels, causing your core body temperature to plunge for sleep.',
    readTime: '2 min read',
    iconType: 'droplet',
    bgColor: '#EBF6F8',
    borderColor: '#CCE7EC',
    accentColor: '#388B9E',
    fullContent: {
      takeaway: 'Falling asleep requires a 1°F drop in core body temperature. Warm water draws heat to the skin surface (vasodilation), rapidly dumping internal core heat.',
      sections: [
        {
          heading: 'The Vascular Heat Dump',
          paragraphs: [
            'By warming the hands and feet in a 10-minute warm bath or shower, blood flow rushes outward, radiating internal heat away. Once you step out into a cooler room, your core temperature drops rapidly.',
            'This drop triggers the brain’s preoptic anterior hypothalamus to initiate drowsiness.',
          ],
        },
      ],
      actionStep: 'Take a warm 10-minute shower or bath 60–90 minutes before bed tonight.',
      evidenceBadge: 'Sleep Medicine Reviews',
    },
  },
  {
    id: 'art-19',
    tag: 'CAFFEINE METABOLISM',
    category: 'sleep',
    title: 'Caffeine half-life: Why your 2 PM coffee is still in your brain at 10 PM',
    preview: 'Caffeine has a 5–7 hour half-life, meaning 25% of that afternoon latte is still blocking adenosine receptors when your head hits the pillow.',
    readTime: '3 min read',
    iconType: 'zap',
    bgColor: '#FFF5E9',
    borderColor: '#F0D5B8',
    accentColor: '#D68838',
    fullContent: {
      takeaway: 'Even if you can fall asleep with caffeine in your system, it significantly reduces restorative deep slow-wave sleep and REM phases.',
      sections: [
        {
          heading: 'Adenosine and Sleep Pressure',
          paragraphs: [
            'Every waking hour, adenosine molecules accumulate in your brain, creating natural "sleep pressure." Caffeine temporarily blocks adenosine receptors without clearing the molecule.',
            'As estrogen fluctuates, CYP1A2 liver enzymes that clear caffeine can slow down by up to 30%, making caffeine stay active longer in your body.',
          ],
        },
      ],
      actionStep: 'Set a cutoff time of 12:00 PM for caffeinated beverages to protect your nighttime deep sleep stages.',
      evidenceBadge: 'Journal of Clinical Sleep Medicine',
    },
  },

  // ── 5. PROTEIN, NUTRITION & MUSCLE METABOLISM ──
  {
    id: 'art-20',
    tag: 'PROTEIN THRESHOLD',
    category: 'nutrition',
    title: 'The leucine trigger: Why 30g of protein matters per meal',
    preview: 'Aging muscles develop anabolic resistance, requiring 2.5–3g of leucine (~30g quality protein) to initiate muscle protein synthesis.',
    readTime: '3 min read',
    iconType: 'leaf',
    bgColor: '#EFF4EA',
    borderColor: '#D5E2C8',
    accentColor: '#708655',
    fullContent: {
      takeaway: 'Spreading protein into 25–35g servings across 3 main meals stimulates muscle maintenance far more effectively than eating one large dinner.',
      sections: [
        {
          heading: 'Overcoming Anabolic Resistance',
          paragraphs: [
            'In our 20s, a 15g protein snack easily switched on muscle protein synthesis (MPS). After 40, muscle cells require a higher concentration of the essential amino acid leucine to flip the mTOR switch.',
            'Consuming 30g of complete protein (eggs, poultry, fish, tofu, Greek yogurt, or quality protein powder) meets this threshold reliably.',
          ],
        },
      ],
      actionStep: 'Aim for a solid palm-sized portion of protein (25–30g) with your breakfast or first meal today.',
      evidenceBadge: 'American Journal of Clinical Nutrition (AJCN)',
    },
  },
  {
    id: 'art-21',
    tag: 'HYDRATION & FASCIA',
    category: 'nutrition',
    title: 'Cellular hydration: Why water needs mineral cofactors',
    preview: 'Drinking plain water without electrolytes can flush cellular minerals. Sodium, potassium, and magnesium hold water inside fascia.',
    readTime: '2 min read',
    iconType: 'droplet',
    bgColor: '#EBF6F8',
    borderColor: '#CCE7EC',
    accentColor: '#388B9E',
    fullContent: {
      takeaway: 'Fascia is 70% water bound in proteoglycan gels. Adequate mineral balance keeps connective tissues springy and joint capsules lubricated.',
      sections: [
        {
          heading: 'Electrolyte Transport Mechanisms',
          paragraphs: [
            'Cellular membranes utilize sodium-potassium ATPase pumps to pull water molecules into intracellular spaces. When you drink large volumes of demineralized water, kidneys excrete it rapidly without hydrating deep tissues.',
            'Adding a pinch of unrefined sea salt or an electrolyte packet to your morning water improves fascia glide and reduces muscle cramping.',
          ],
        },
      ],
      actionStep: 'Add a pinch of sea salt and a squeeze of fresh lemon to your morning glass of water.',
      evidenceBadge: 'Journal of the International Society of Sports Nutrition',
    },
  },
  {
    id: 'art-22',
    tag: 'CREATINE FOR WOMEN',
    category: 'nutrition',
    title: 'Creatine monohydrate: The evidence-backed powerhouse for women 40+',
    preview: 'Far from a bodybuilding gimmick, creatine supports cellular ATP in brain tissue, combats fatigue, and protects lean muscle.',
    readTime: '3 min read',
    iconType: 'sparkles',
    bgColor: '#F9EEF1',
    borderColor: '#E8C4CC',
    accentColor: '#C96374',
    fullContent: {
      takeaway: 'Creatine recycles phosphocreatine in both muscle and brain neurons, improving working memory and power output during hormonal dips.',
      sections: [
        {
          heading: 'Brain Energetics and Muscle Strength',
          paragraphs: [
            'Female brains have lower endogenous creatine stores than male brains, particularly during periods of lower estrogen. Supplementing with 3–5g of daily creatine monohydrate saturates brain phosphocreatine stores.',
            'Clinical trials show notable improvements in cognitive processing under sleep deprivation and enhanced strength recovery in perimenopausal women.',
          ],
        },
      ],
      actionStep: 'Ask your health provider if 3g of daily creatine monohydrate is a good fit for your routine.',
      evidenceBadge: 'Nutrients • Female Health & Ergogenic Aids',
    },
  },
  {
    id: 'art-23',
    tag: 'ANTI-INFLAMMATORY FOODS',
    category: 'nutrition',
    title: 'Omega-3s and joint inflammation: The resolvins pathway',
    preview: 'EPA and DHA fatty acids produce specialized pro-resolving mediators (SPMs) that actively switch off joint swelling after exercise.',
    readTime: '3 min read',
    iconType: 'heart',
    bgColor: '#EFF4EA',
    borderColor: '#D5E2C8',
    accentColor: '#708655',
    fullContent: {
      takeaway: 'Omega-3 fatty acids do not just block inflammation—they provide the raw materials to actively resolve it and rebuild cell membranes.',
      sections: [
        {
          heading: 'From Chronic Swelling to Active Resolution',
          paragraphs: [
            'When tissues experience mechanical load, the body produces acute inflammation to signal repair. Resolvins and protectins derived from omega-3s signal macrophages to clean up cellular debris.',
            'Consuming wild-caught fatty fish (salmon, sardines, mackerel) twice weekly or a purified EPA/DHA supplement reduces knee stiffness by up to 28%.',
          ],
        },
      ],
      actionStep: 'Include wild salmon, sardines, chia seeds, or walnuts in one of your meals this week.',
      evidenceBadge: 'Prostaglandins, Leukotrienes and Essential Fatty Acids',
    },
  },

  // ── 6. PELVIC FLOOR & CORE INTEGRATION ──
  {
    id: 'art-24',
    tag: 'PELVIC FLOOR',
    category: 'movement',
    title: 'Why Kegels alone are not enough: The 3D pelvic bowl',
    preview: 'A healthy pelvic floor needs to lengthen under load just as much as it contracts. Diaphragmatic breathing is the true foundation.',
    readTime: '3 min read',
    iconType: 'shield',
    bgColor: '#F9EEF1',
    borderColor: '#E8C4CC',
    accentColor: '#C96374',
    fullContent: {
      takeaway: 'A hypertonic (chronically tight) pelvic floor is weak. Synchronizing pelvic descent on inhalation and gentle recoil on exhalation restores function.',
      sections: [
        {
          heading: 'The Piston Mechanism: Diaphragm and Pelvic Floor',
          paragraphs: [
            'Your thoracic diaphragm and pelvic floor move in tandem like twin pistons. When you inhale, your diaphragm descends and your pelvic floor naturally expands and widens.',
            'When you exhale during exertion (like rising from a squat), your pelvic floor naturally recoils upward, providing intra-abdominal stability without bearing down.',
          ],
        },
      ],
      actionStep: 'Practice 5 deep diaphragmatic breaths in child’s pose, feeling your pelvic bowl gently expand on each inhale.',
      evidenceBadge: 'International Urogynecology Journal',
    },
  },
  {
    id: 'art-25',
    tag: 'CORE DYNAMICS',
    category: 'movement',
    title: 'Crunches vs. Bracing: Saving your lumbar spine',
    preview: 'Repeated spinal flexion under load wears out intervertebral discs. Anti-extension and anti-rotation movements build bulletproof stability.',
    readTime: '3 min read',
    iconType: 'activity',
    bgColor: '#EFF4EA',
    borderColor: '#D5E2C8',
    accentColor: '#708655',
    fullContent: {
      takeaway: 'The core’s primary evolutionary role is preventing unwanted spinal movement, not creating it. Deadbugs, bird-dogs, and planks build true resilience.',
      sections: [
        {
          heading: 'The McGill Big 3 Philosophy',
          paragraphs: [
            'Renowned spine biomechanist Dr. Stuart McGill demonstrated that traditional sit-ups place over 3,300 Newtons of compressive shear force on the L4-L5 lumbar discs.',
            'In contrast, isometric core bracing exercises (like the Dead Bug and Bird-Dog in Fortywell) activate the transverse abdominis with zero spinal shear.',
          ],
        },
      ],
      actionStep: 'Focus on keeping your lower back flush with the floor during all Dead Bug reps in today’s session.',
      evidenceBadge: 'Journal of Orthopaedic & Sports Physical Therapy',
    },
  },

  // ── 7. JOINT LONGEVITY & TENDON HEALTH ──
  {
    id: 'art-26',
    tag: 'KNEE LONGEVITY',
    category: 'joints',
    title: 'The VMO muscle: Your kneecap’s personal bodyguard',
    preview: 'The vastus medialis oblique (inner quad) centers your patella in its femoral groove. Isometric wall sits train it safely without joint pain.',
    readTime: '3 min read',
    iconType: 'shield',
    bgColor: '#EBF6F8',
    borderColor: '#CCE7EC',
    accentColor: '#388B9E',
    fullContent: {
      takeaway: 'Patellofemoral tracking issues arise when outer quad fibers overpower the inner VMO. Isometric holds rebuild inner quad activation without friction.',
      sections: [
        {
          heading: 'Zero-Impact Quad Strengthening',
          paragraphs: [
            'Deep knee bends can pinch an inflamed patellar tendon. However, a 45-degree wall sit with a soft ball between the knees isolates the VMO and produces an immediate analgesic pain-relief effect in the tendon.',
          ],
        },
      ],
      actionStep: 'Add a 30-second isometric wall sit with gentle inner-thigh squeeze before your main workout block.',
      evidenceBadge: 'British Journal of Sports Medicine • Tendinopathy Care',
    },
  },
  {
    id: 'art-27',
    tag: 'SHOULDER HEALTH',
    category: 'joints',
    title: 'Rotator cuff health: The power of external rotation',
    preview: 'Modern forward-slumped posture puts subacromial tendons under constant impingement. Banded face-pulls restore balance.',
    readTime: '2 min read',
    iconType: 'activity',
    bgColor: '#EFF4EA',
    borderColor: '#D5E2C8',
    accentColor: '#708655',
    fullContent: {
      takeaway: 'Strengthening the infraspinatus and teres minor centers the humeral head in the glenoid socket, eliminating overhead pinching.',
      sections: [
        {
          heading: 'Opening the Subacromial Space',
          paragraphs: [
            'When shoulders roll forward, the space underneath the acromion bone narrows to millimeters, fraying the supraspinatus tendon over time.',
            'Gentle external rotations and band pull-aparts pull the shoulder blade backward and downward, creating 40% more room for joint clearance.',
          ],
        },
      ],
      actionStep: 'Perform 15 gentle standing shoulder blade squeezes right now at your desk.',
      evidenceBadge: 'Journal of Shoulder and Elbow Surgery',
    },
  },
  {
    id: 'art-28',
    tag: 'HIP MOBILITY',
    category: 'joints',
    title: 'The 90/90 stretch: Unlocking internal hip rotation',
    preview: 'Lost internal hip rotation forces the lower back and knees to twist destructively. The 90/90 position restores natural joint freedom.',
    readTime: '3 min read',
    iconType: 'leaf',
    bgColor: '#F2EFF9',
    borderColor: '#D8CFF0',
    accentColor: '#7B68B5',
    fullContent: {
      takeaway: 'Healthy hips require both internal and external rotation. Freeing the hip capsule relieves lower back tightness instantly.',
      sections: [
        {
          heading: 'Why Hip Stiffness Becomes Back Pain',
          paragraphs: [
            'The hip is a ball-and-socket joint designed for multi-planar mobility. The lumbar spine is designed primarily for stability. When hips freeze up from prolonged sitting, walking forces the lower back to twist.',
            'Sitting in a 90/90 position on the floor for 60 seconds per side gently stretches the deep piriformis and hip capsule without compressing spinal discs.',
          ],
        },
      ],
      actionStep: 'Spend 1 minute in a gentle 90/90 hip stretch on your carpet tonight before bed.',
      evidenceBadge: 'Physical Therapy in Sport',
    },
  },
  {
    id: 'art-29',
    tag: 'FOOT & ANKLE',
    category: 'joints',
    title: 'Barefoot foot activation: The root of your posture chain',
    preview: 'Your feet contain over 200,000 nerve endings. Stiff shoes blind these sensors; rolling your arches wakes up your entire posterior chain.',
    readTime: '2 min read',
    iconType: 'sparkles',
    bgColor: '#FFF5E9',
    borderColor: '#F0D5B8',
    accentColor: '#D68838',
    fullContent: {
      takeaway: 'Plantar proprioception dictates pelvic alignment. Rolling the sole of your foot on a tennis ball releases tension up into the hamstrings and lower back.',
      sections: [
        {
          heading: 'The Superficial Back Line',
          paragraphs: [
            'Anatomists have shown that the plantar fascia on the bottom of your foot connects via continuous fascial sheets to the Achilles tendon, hamstrings, sacrum, and cranial fascia.',
            'Releasing foot arch tension directly improves hamstring flexibility by up to 2 inches within 60 seconds.',
          ],
        },
      ],
      actionStep: 'Roll the arches of both feet over a tennis ball or water bottle for 60 seconds each today.',
      evidenceBadge: 'Journal of Bodywork and Movement Therapies',
    },
  },

  // ── 8. RECOVERY PROTOCOLS & ENERGY RHYTHM ──
  {
    id: 'art-30',
    tag: 'DELOAD WEEKS',
    category: 'recovery',
    title: 'The strategic deload: Why less is more every 4–6 weeks',
    preview: 'Tendon collagen turnover takes 3x longer than muscle fiber repair. A scheduled light week prevents overuse injuries and restores vitality.',
    readTime: '3 min read',
    iconType: 'moon',
    bgColor: '#EFF4EA',
    borderColor: '#D5E2C8',
    accentColor: '#708655',
    fullContent: {
      takeaway: 'Fitness adaptations occur during recovery, not during the workout itself. Backing off 30% volume once a month accelerates long-term progress.',
      sections: [
        {
          heading: 'The Supercompensation Curve',
          paragraphs: [
            'When training stimulus accumulates week after week, systemic fatigue masks your true fitness gains. A deload week allows connective tissue remodeling, replenishes glycogen stores, and resets adrenal receptors.',
          ],
        },
      ],
      actionStep: 'If you have worked out consistently for 4 weeks, consider taking 2 consecutive restorative/mobility days this week.',
      evidenceBadge: 'Sports Medicine • Periodization and Connective Tissue Adaptation',
    },
  },
  {
    id: 'art-31',
    tag: 'CONTRAST HYDROTHERAPY',
    category: 'recovery',
    title: 'Hot & cold therapy: Enhancing lymphatic clearance',
    preview: 'Alternating warm shower temperatures creates vascular pumping that clears metabolic waste and reduces perceived muscle soreness.',
    readTime: '2 min read',
    iconType: 'droplet',
    bgColor: '#EBF6F8',
    borderColor: '#CCE7EC',
    accentColor: '#388B9E',
    fullContent: {
      takeaway: 'Vasodilation from warmth followed by vasoconstriction from cool water creates a rhythmic circulatory pump without strenuous effort.',
      sections: [
        {
          heading: 'Lymphatic Drainage Mechanics',
          paragraphs: [
            'Unlike the cardiovascular system, the lymphatic system has no central heart pump. It relies on muscle contractions and vascular pressure gradients.',
            'Ending your shower with 30 seconds of cool water stimulates peripheral circulation and leaves you feeling invigorated without cortisol strain.',
          ],
        },
      ],
      actionStep: 'End your shower with 20 seconds of comfortably cool water today.',
      evidenceBadge: 'European Journal of Applied Physiology',
    },
  },
  {
    id: 'art-32',
    tag: 'ZONE 2 WALKING',
    category: 'movement',
    title: 'The magic of Zone 2: Building mitochondrial density',
    preview: 'Gentle, conversational-paced walking burns cellular fatty acids and multiplies mitochondria without spiking stress hormones.',
    readTime: '3 min read',
    iconType: 'heart',
    bgColor: '#EFF4EA',
    borderColor: '#D5E2C8',
    accentColor: '#708655',
    fullContent: {
      takeaway: 'Zone 2 training (where you can easily breathe through your nose) stimulates mitochondrial biogenesis with zero recovery penalty.',
      sections: [
        {
          heading: 'Fat Oxidation vs. Lactate Accumulation',
          paragraphs: [
            'In Zone 2, your slow-twitch muscle fibers utilize beta-oxidation to generate ATP. This trains your cells to utilize fat efficiently while clearing lactate effortlessly.',
            'Aiming for 30 minutes of brisk, nasal-breathing walking 3–4 days per week builds the cardiovascular bedrock for all other training.',
          ],
        },
      ],
      actionStep: 'Take a 20-minute brisk walk today, keeping all breathing purely through your nose.',
      evidenceBadge: 'Cell Metabolism • Mitochondrial Dynamics',
    },
  },
  {
    id: 'art-33',
    tag: 'MASSAGE & MYOFASCIAL',
    category: 'recovery',
    title: 'Foam rolling: Is it breaking fascia or soothing nerves?',
    preview: 'Foam rolling does not mechanically break adhesions; it stimulates Ruffini and Pacini mechanoreceptors to tell the brain to relax muscle tone.',
    readTime: '2 min read',
    iconType: 'wind',
    bgColor: '#F2EFF9',
    borderColor: '#D8CFF0',
    accentColor: '#7B68B5',
    fullContent: {
      takeaway: 'Slow, gentle rolling down-regulates local neuromuscular tone by communicating with central nervous system reflex loops.',
      sections: [
        {
          heading: 'The Neurological Mechanism of Self-Myofascial Release',
          paragraphs: [
            'Sustained gentle pressure over tender muscle bellies signals Golgi tendon organs to reduce muscle spindle firing rate. Aggressive, painful rolling backfires by triggering muscle spasm.',
          ],
        },
      ],
      actionStep: 'Spend 2 minutes gently rolling your upper back or calves with slow, rhythmic breathing.',
      evidenceBadge: 'International Journal of Sports Physical Therapy',
    },
  },

  // ── 9. MINDSET, CONSISTENCY & RE-CALIBRATION ──
  {
    id: 'art-34',
    tag: 'MICRO-HABITS',
    category: 'movement',
    title: 'The 10-minute rule: Overcoming workout initiation friction',
    preview: 'Your brain resists workouts when it perceives a high energy threshold. Committing to just 10 minutes bypasses limbic hesitation every time.',
    readTime: '2 min read',
    iconType: 'zap',
    bgColor: '#FFF5E9',
    borderColor: '#F0D5B8',
    accentColor: '#D68838',
    fullContent: {
      takeaway: 'Action precedes motivation. Lowering the barrier to entry by doing just the warmup gets you moving without psychological resistance.',
      sections: [
        {
          heading: 'The Neurological Activation Threshold',
          paragraphs: [
            'When tired, the brain’s amygdala flags a 45-minute workout as a threat to energy reserves. Telling yourself "I will just do 10 minutes of movement" eliminates that threat signal.',
            'Over 85% of the time, once blood is flowing and endorphins are circulating, you naturally finish the whole session feeling refreshed.',
          ],
        },
      ],
      actionStep: 'On low-motivation days, open Fortywell and commit to just the 3-minute warmup.',
      evidenceBadge: 'Behavioral Medicine Review',
    },
  },
  {
    id: 'art-35',
    tag: 'ALL-OR-NOTHING TRAP',
    category: 'recovery',
    title: 'Why consistency beats perfection over a 52-week horizon',
    preview: 'Missing a day does not reset your physiology. Bouncing back smoothly is the actual skill that builds lifelong resilience.',
    readTime: '2 min read',
    iconType: 'sparkles',
    bgColor: '#F9EEF1',
    borderColor: '#E8C4CC',
    accentColor: '#C96374',
    fullContent: {
      takeaway: 'Three 20-minute sessions done 48 weeks a year outperform six intense sessions done for 3 weeks followed by burnout.',
      sections: [
        {
          heading: 'The Compound Effect of Gentle Consistency',
          paragraphs: [
            'Diet culture taught us that missing a workout ruins progress. Cellular biology proves otherwise: muscle memory, bone mineral, and capillary networks persist across rest days.',
            'Celebrate every single touchpoint with movement, whether it is a 12-minute decompression or a 25-minute strength flow.',
          ],
        },
      ],
      actionStep: 'Remind yourself today: Any movement counts, and rest is part of the program.',
      evidenceBadge: 'Health Psychology & Habit Formation Research',
    },
  },
  {
    id: 'art-36',
    tag: 'TEMPO & CONTROL',
    category: 'movement',
    title: 'Eccentric tempo: The secret to double the strength with half the weight',
    preview: 'Lowering weights with a slow 3-second tempo creates superior muscle remodeling while sparing your joints from heavy spinal compression.',
    readTime: '3 min read',
    iconType: 'activity',
    bgColor: '#EFF4EA',
    borderColor: '#D5E2C8',
    accentColor: '#708655',
    fullContent: {
      takeaway: 'The eccentric (lowering) phase of a lift recruits high-threshold motor units and strengthens tendon attachment points safely.',
      sections: [
        {
          heading: 'Mechanical Tension vs. Momentum',
          paragraphs: [
            'Dropping down quickly into a squat or chest press relies on joint compression and momentum. Taking 3 controlled seconds to lower the weight increases time under tension without needing heavy dumbbells.',
          ],
        },
      ],
      actionStep: 'Count 3 seconds down on every squat or glute bridge rep during your session today.',
      evidenceBadge: 'Journal of Strength and Conditioning Research',
    },
  },
  {
    id: 'art-37',
    tag: 'BREATHING MECHANICS',
    category: 'recovery',
    title: 'Nasal breathing vs. mouth breathing during daily life',
    preview: 'Nasal breathing filters air, releases nitric oxide, and keeps carbon dioxide levels balanced for optimal cellular oxygen delivery.',
    readTime: '2 min read',
    iconType: 'wind',
    bgColor: '#EBF6F8',
    borderColor: '#CCE7EC',
    accentColor: '#388B9E',
    fullContent: {
      takeaway: 'Breathing through your nose produces endogenous nitric oxide in the paranasal sinuses, dilating blood vessels and lowering resting blood pressure.',
      sections: [
        {
          heading: 'The Bohr Effect and Oxygen Delivery',
          paragraphs: [
            'Mouth breathing expels carbon dioxide too rapidly, making blood slightly alkaline and trapping oxygen tightly bound to hemoglobin. Nasal breathing preserves optimal CO2 tension, allowing oxygen to be delivered efficiently to working muscles.',
          ],
        },
      ],
      actionStep: 'Notice your breath right now: Gently seal your lips and let your tongue rest on the roof of your mouth.',
      evidenceBadge: 'Respiratory Physiology & Neurobiology',
    },
  },
  {
    id: 'art-38',
    tag: 'METABOLISM & LEAN MASS',
    category: 'nutrition',
    title: 'Resting metabolic rate: Why muscle is your most active organ',
    preview: 'Every pound of muscle burns 3x more calories at rest than fat tissue, acts as a glucose sink, and protects against age-related slowdowns.',
    readTime: '3 min read',
    iconType: 'flame',
    bgColor: '#F9EEF1',
    borderColor: '#E8C4CC',
    accentColor: '#C96374',
    fullContent: {
      takeaway: 'Strength training does not just burn calories during the workout—it increases your basal metabolic rate 24 hours a day.',
      sections: [
        {
          heading: 'The Myokine Endocrine Organ',
          paragraphs: [
            'Scientists now classify skeletal muscle as an endocrine organ. Active muscle tissue secretes anti-inflammatory signals that talk directly to liver, brain, and adipose tissue.',
          ],
        },
      ],
      actionStep: 'Honor your strength training today as an investment in your metabolic vitality for decades to come.',
      evidenceBadge: 'Physiological Reviews • Muscle Biology',
    },
  },
  {
    id: 'art-39',
    tag: 'DAILY STEP ANCHOR',
    category: 'movement',
    title: 'Non-Exercise Activity Thermogenesis (NEAT): The silent hero',
    preview: 'NEAT accounts for up to 15% of daily energy expenditure—far more than a 30-minute workout. Fidgeting, standing, and pacing add up.',
    readTime: '2 min read',
    iconType: 'activity',
    bgColor: '#EFF4EA',
    borderColor: '#D5E2C8',
    accentColor: '#708655',
    fullContent: {
      takeaway: 'Small movement snacks distributed throughout your day keep lipolytic enzymes active and eliminate static postural fatigue.',
      sections: [
        {
          heading: 'The Power of Movement Snacks',
          paragraphs: [
            'Standing up for 2 minutes every hour to stretch your hip flexors or walk around the room resets cellular lipoprotein lipase activity, keeping fat metabolism steady.',
          ],
        },
      ],
      actionStep: 'Stand up and do a quick 60-second stretch after reading this lesson.',
      evidenceBadge: 'Mayo Clinic Proceedings • Endocrinology',
    },
  },
  {
    id: 'art-40',
    tag: 'ANKLE DORSIFLEXION',
    category: 'joints',
    title: 'Ankle mobility: The secret to painless squats and stair climbs',
    preview: 'Restricted ankle dorsiflexion forces knees to collapse inward and feet to pronate. A 2-minute calf stretch unlocks deep squat depth.',
    readTime: '2 min read',
    iconType: 'shield',
    bgColor: '#EBF6F8',
    borderColor: '#CCE7EC',
    accentColor: '#388B9E',
    fullContent: {
      takeaway: 'When ankles cannot glide forward, your body compensates by twisting the knee or rounding the lower back.',
      sections: [
        {
          heading: 'Testing Your Wall Knee-Touch',
          paragraphs: [
            'Stand 4 inches from a wall with your toes facing forward. If you can bend your knee to touch the wall without your heel lifting off the ground, your ankle dorsiflexion is optimal.',
          ],
        },
      ],
      actionStep: 'Stretch both calves against a wall or stair step for 45 seconds each before your next lower body session.',
      evidenceBadge: 'Gait & Posture Journal',
    },
  },
  {
    id: 'art-41',
    tag: 'GLUTE AMNESIA',
    category: 'movement',
    title: 'Waking up dormant glutes after hours of sitting',
    preview: 'Sitting compresses gluteal nerves and leaves the largest muscle group in your body dormant. Bridging with heel drive wakes them up.',
    readTime: '2 min read',
    iconType: 'flame',
    bgColor: '#F9EEF1',
    borderColor: '#E8C4CC',
    accentColor: '#C96374',
    fullContent: {
      takeaway: 'Activating the gluteus maximus stabilizes the sacroiliac (SI) joint and takes immediate pressure off the lumbar spine.',
      sections: [
        {
          heading: 'Reciprocal Inhibition of the Hip Flexors',
          paragraphs: [
            'Tight hip flexors send an inhibitory neurological signal to the opposing glute muscles. Doing a gentle hip flexor stretch followed by an isometric glute bridge reactivates optimal firing patterns.',
          ],
        },
      ],
      actionStep: 'Do 10 glute squeezes while standing in line or waiting for your tea today.',
      evidenceBadge: 'Journal of Electromyography and Kinesiology',
    },
  },
  {
    id: 'art-42',
    tag: 'CIRCADIAN MEAL TIMING',
    category: 'nutrition',
    title: 'Early time-restricted feeding and hormonal harmony',
    preview: 'Eating in sync with daylight hours optimizes insulin sensitivity and avoids night-time melatonin receptor interference.',
    readTime: '3 min read',
    iconType: 'sun',
    bgColor: '#FFF5E9',
    borderColor: '#F0D5B8',
    accentColor: '#D68838',
    fullContent: {
      takeaway: 'Your pancreas and liver express clock genes that process nutrients with highest efficiency during daylight hours.',
      sections: [
        {
          heading: 'Aligning Nutrition with Sunlight',
          paragraphs: [
            'Consuming a substantial breakfast and lunch with a lighter early dinner aligns with natural insulin sensitivity peaks and promotes deep overnight restorative sleep.',
          ],
        },
      ],
      actionStep: 'Try eating dinner 30 minutes earlier this evening.',
      evidenceBadge: 'Cell Metabolism • Circadian Biology',
    },
  },
  {
    id: 'art-43',
    tag: 'COLLAGEN & VITAMIN C',
    category: 'joints',
    title: 'Collagen peptides: The 45-minute pre-workout window',
    preview: 'Consuming 10–15g of collagen with 50mg of Vitamin C 45 minutes before movement doubles collagen synthesis in working tendons.',
    readTime: '2 min read',
    iconType: 'droplet',
    bgColor: '#EBF6F8',
    borderColor: '#CCE7EC',
    accentColor: '#388B9E',
    fullContent: {
      takeaway: 'Tendons receive minimal direct blood flow. Loading them while amino acids peak in the bloodstream pulls collagen directly into the tendon matrix.',
      sections: [
        {
          heading: 'The Keith Baar Tendon Protocol',
          paragraphs: [
            'Landmark research demonstrated that collagen peptides paired with Vitamin C consumed prior to short mechanical loading bouts stimulates procollagen production in ligament tissues.',
          ],
        },
      ],
      actionStep: 'Consider adding a scoop of collagen powder with a citrus slice before your workouts.',
      evidenceBadge: 'American Journal of Clinical Nutrition • Tendon Biology',
    },
  },
  {
    id: 'art-44',
    tag: 'ISOMETRIC TRAINING',
    category: 'joints',
    title: 'Isometrics: The immediate joint pain reliever',
    preview: 'Holding a static muscle contraction for 45 seconds reduces tendon pain via cortical inhibition for up to 45 minutes afterward.',
    readTime: '2 min read',
    iconType: 'shield',
    bgColor: '#EFF4EA',
    borderColor: '#D5E2C8',
    accentColor: '#708655',
    fullContent: {
      takeaway: 'Isometric holds allow high muscular tension without repetitive friction over sensitive joint surfaces.',
      sections: [
        {
          heading: 'Tendon Analgesia Mechanics',
          paragraphs: [
            'Heavy isometric holds trigger an inhibitory reflex in the spinal cord, temporarily desensitizing pain pathways while reinforcing tendon tensile stiffness.',
          ],
        },
      ],
      actionStep: 'Hold the top of your next glute bridge for 10 full seconds to experience isometric stabilization.',
      evidenceBadge: 'British Journal of Sports Medicine',
    },
  },
  {
    id: 'art-45',
    tag: 'MAGNESIUM GLYCINATE',
    category: 'sleep',
    title: 'Why magnesium is the ultimate evening ally',
    preview: 'Over 60% of adults do not meet optimal magnesium intake. Magnesium glycinate crosses the blood-brain barrier to calm NMDA receptors.',
    readTime: '2 min read',
    iconType: 'moon',
    bgColor: '#F2EFF9',
    borderColor: '#D8CFF0',
    accentColor: '#7B68B5',
    fullContent: {
      takeaway: 'Magnesium regulates over 300 enzymatic reactions, including ATP production and the relaxation of smooth muscle fibers.',
      sections: [
        {
          heading: 'GABA Stimulation and Muscle Relaxation',
          paragraphs: [
            'Magnesium binds to GABA receptors in the central nervous system, quieting racing thoughts and preventing nocturnal leg restlessness.',
          ],
        },
      ],
      actionStep: 'Discuss adding 200–300mg of magnesium glycinate with dinner to your nighttime supplement routine.',
      evidenceBadge: 'Nutrients • Micronutrient Deficiencies & Sleep',
    },
  },
  {
    id: 'art-46',
    tag: 'COLD EXPOSURE & BROWN FAT',
    category: 'recovery',
    title: 'Cold finish in the shower: Activating brown adipose tissue',
    preview: 'A 30-second cold splash stimulates norepinephrine release by 250%, clears brain fog, and boosts mitochondrial uncoupling.',
    readTime: '2 min read',
    iconType: 'droplet',
    bgColor: '#EBF6F8',
    borderColor: '#CCE7EC',
    accentColor: '#388B9E',
    fullContent: {
      takeaway: 'Cold water on the neck and chest activates brown fat cells that burn energy to generate internal thermal warmth.',
      sections: [
        {
          heading: 'Norepinephrine and Mood Resilience',
          paragraphs: [
            'The sudden thermal contrast triggers a clean surge of dopamine and norepinephrine, leaving you feeling mentally alert and resilient for hours.',
          ],
        },
      ],
      actionStep: 'Turn the shower dial cool for the last 15 seconds today—breathe through your nose calmly.',
      evidenceBadge: 'European Journal of Applied Physiology',
    },
  },
  {
    id: 'art-47',
    tag: 'PELVIC CORE BREATHING',
    category: 'movement',
    title: 'The 360-degree ribcage expansion breath',
    preview: 'Belly breathing alone leaves your posterior lung bases collapsed. Breathing into your back ribs opens the mid-spine and supports core pressure.',
    readTime: '2 min read',
    iconType: 'wind',
    bgColor: '#EFF4EA',
    borderColor: '#D5E2C8',
    accentColor: '#708655',
    fullContent: {
      takeaway: 'A complete breath expands the front, sides, and back of your ribcage equally, creating natural intra-abdominal core support.',
      sections: [
        {
          heading: 'Hands on Ribs Cue',
          paragraphs: [
            'Place your hands around your lower ribcage like a corset. As you inhale through your nose, try to push your hands apart laterally and backward into your thumbs.',
          ],
        },
      ],
      actionStep: 'Take 5 full 360-degree rib breaths before you begin your workout session today.',
      evidenceBadge: 'Journal of Physical Therapy Science',
    },
  },
  {
    id: 'art-48',
    tag: 'STRENGTH PROGRESSION',
    category: 'movement',
    title: 'Progressive overload without lifting heavier: 4 hidden levers',
    preview: 'You do not always need heavier dumbbells. Slower tempos, shorter rests, fuller range, and pausing build incredible strength safely.',
    readTime: '3 min read',
    iconType: 'zap',
    bgColor: '#FFF5E9',
    borderColor: '#F0D5B8',
    accentColor: '#D68838',
    fullContent: {
      takeaway: 'Progressive overload is about challenging muscle fibers—not ego lifting. Controlling the bottom pause creates profound joint-safe tension.',
      sections: [
        {
          heading: 'The 4 Levers of Safe Progression',
          paragraphs: [
            '1. Add a 2-second pause at the bottom of the movement.\n2. Slow down the lowering phase to 3 seconds.\n3. Increase range of motion by 1 inch.\n4. Reduce rest between sets from 60s to 45s.',
          ],
        },
      ],
      actionStep: 'Add a 1-second pause at the bottom of your squats or bridges today.',
      evidenceBadge: 'Strength & Conditioning Journal',
    },
  },
  {
    id: 'art-49',
    tag: 'FIBER & GUT HORMONE',
    category: 'nutrition',
    title: 'Prebiotic fiber and the estrobolome: Your gut-hormone connection',
    preview: 'A specialized cluster of gut bacteria called the estrobolome regulates circulating active estrogen levels via beta-glucuronidase enzymes.',
    readTime: '3 min read',
    iconType: 'leaf',
    bgColor: '#EFF4EA',
    borderColor: '#D5E2C8',
    accentColor: '#708655',
    fullContent: {
      takeaway: 'Diverse prebiotic plant fibers (flaxseed, asparagus, artichoke, berries) feed the microbial strains that help maintain healthy estrogen clearance.',
      sections: [
        {
          heading: 'Gut Microbiome and Hormone Balance',
          paragraphs: [
            'When the gut microbiome is diverse and healthy, the estrobolome balances the elimination of used estrogen metabolites, preventing bloating and mood volatility.',
          ],
        },
      ],
      actionStep: 'Add 1 tablespoon of ground flaxseed to your smoothie, yogurt, or oatmeal today.',
      evidenceBadge: 'Maturitas • Gut Microbiota & Estrogen Dynamics',
    },
  },
  {
    id: 'art-50',
    tag: 'POST-WORKOUT WIND-DOWN',
    category: 'recovery',
    title: 'The 2-minute post-workout parasympathetic shift',
    preview: 'Lying on your back with legs elevated for 2 minutes after exercise immediately shifts your nervous system from catabolic stress into muscle-repair mode.',
    readTime: '2 min read',
    iconType: 'sparkles',
    bgColor: '#F2EFF9',
    borderColor: '#D8CFF0',
    accentColor: '#7B68B5',
    fullContent: {
      takeaway: 'Transitioning out of sympathetic arousal directly after training speeds lactate clearance and reduces post-workout cortisol spikes.',
      sections: [
        {
          heading: 'Legs-Up-The-Wall / Mat Recovery',
          paragraphs: [
            'Elevating your legs or relaxing flat on your back encourages venous blood return to the heart, stimulating baroreceptors to lower heart rate and initiate cellular repair.',
          ],
        },
      ],
      actionStep: 'Lie flat on your mat for 2 minutes with slow nasal breathing at the end of today’s workout.',
      evidenceBadge: 'International Journal of Sports Medicine',
    },
  },
  {
    id: 'art-51',
    tag: 'GRIP STRENGTH & LONGEVITY',
    category: 'movement',
    title: 'Grip strength: The whole-body biomarker of vitality',
    preview: 'Grip strength reflects overall neuromuscular density and rotator cuff recruitment. Carrying groceries or holding dumbbells builds lifelong power.',
    readTime: '2 min read',
    iconType: 'activity',
    bgColor: '#FFF5E9',
    borderColor: '#F0D5B8',
    accentColor: '#D68838',
    fullContent: {
      takeaway: 'A firm grip irradiates neurological tension through the forearms into the shoulders and deep core stabilizers.',
      sections: [
        {
          heading: 'The Irradiation Principle',
          paragraphs: [
            'When you grip a dumbbell or resistance handle firmly, a neurological phenomenon called the irradiation principle automatically fires stabilizing muscles in the upper back and rotator cuff.',
          ],
        },
      ],
      actionStep: 'Focus on squeezing your dumbbells or resistance handles firmly on every single rep today.',
      evidenceBadge: 'The Lancet • Global Health Biomarkers Study',
    },
  },
  {
    id: 'art-52',
    tag: 'SLEEP SANCTUARY',
    category: 'sleep',
    title: 'The 10-3-2-1-0 sleep formula for restorative nights',
    preview: '10 hours no caffeine, 3 hours no food, 2 hours no work, 1 hour no screens, 0 snoozing in the morning. The evidence-backed framework.',
    readTime: '3 min read',
    iconType: 'moon',
    bgColor: '#F2EFF9',
    borderColor: '#D8CFF0',
    accentColor: '#7B68B5',
    fullContent: {
      takeaway: 'Having a consistent, predictable wind-down protocol primes your autonomic nervous system for deep restorative sleep.',
      sections: [
        {
          heading: 'The 5 Milestones of Evening Rhythm',
          paragraphs: [
            '10 hours before bed: Stop caffeine.\n3 hours before bed: Finish large meals.\n2 hours before bed: Close work emails.\n1 hour before bed: Dim screens and overhead lights.\n0 times hitting snooze: Wake up and catch the morning light.',
          ],
        },
      ],
      actionStep: 'Pick one step from the 10-3-2-1-0 formula to try this evening.',
      evidenceBadge: 'National Sleep Foundation Guidelines',
    },
  },
];

// ── DAILY ROTATION ALGORITHM ──────────────────────────────────────────────────

/**
 * Generates a deterministically shuffled / rotated array of all 52 articles
 * based on the calendar date (day of year + year).
 * Every day at midnight, the cards switch places in a fresh, engaging order!
 */
export function getDailyRotatedArticles(targetDate: Date = new Date()): EducationalArticle[] {
  const year = targetDate.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const dayOfYear = Math.floor((targetDate.getTime() - startOfYear.getTime()) / 86400000);
  const seed = year * 365 + dayOfYear;

  // Clone array
  const list = [...ALL_EDUCATIONAL_ARTICLES];
  const n = list.length;

  // Deterministic seeded pseudorandom permutation (LCG)
  let state = (seed * 1103515245 + 12345) & 0x7fffffff;
  const nextRand = () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };

  // Fisher-Yates shuffle with seeded RNG
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(nextRand() * (i + 1));
    const temp = list[i];
    list[i] = list[j];
    list[j] = temp;
  }

  return list;
}
