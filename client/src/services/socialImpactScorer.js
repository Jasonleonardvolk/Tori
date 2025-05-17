// Keyword/weight-based social impact scorer
// No ML, no DB, fully explainable

const SOCIAL_KEYWORDS = {
  pro: {
    accessibility: 2,
    privacy: 2,
    wellbeing: 1.5,
    inclusion: 1.5,
    consent: 2,
    optin: 1,
    "opt-in": 1
  },
  anti: {
    tracking: 2,
    surveillance: 2,
    exploit: 1.5,
    harass: 2,
    darkpattern: 1.5,
    "dark pattern": 1.5,
    "without consent": 3
  }
};

const PRO_THRESHOLD = 2;
const ANTI_THRESHOLD = -2;

// personaBias: { pro: number, anti: number } or a single number
export function scoreSocialImpact({ title = '', body = '' }, personaBias = 1) {
  const text = `${title} ${body}`.toLowerCase();
  let score = 0;
  let rationale = [];

  const proBias = typeof personaBias === 'object' && personaBias.pro ? personaBias.pro : personaBias;
  const antiBias = typeof personaBias === 'object' && personaBias.anti ? personaBias.anti : personaBias;

  // Pro keywords
  for (const [kw, weight] of Object.entries(SOCIAL_KEYWORDS.pro)) {
    if (text.includes(kw)) {
      score += weight * proBias;
      rationale.push({ keyword: kw, weight: weight * proBias, type: 'pro' });
    }
  }

  // Anti keywords
  for (const [kw, weight] of Object.entries(SOCIAL_KEYWORDS.anti)) {
    if (text.includes(kw)) {
      score -= weight * antiBias;
      rationale.push({ keyword: kw, weight: -weight * antiBias, type: 'anti' });
    }
  }

  let classification = 'neutral';
  if (score >= PRO_THRESHOLD) classification = 'pro';
  else if (score <= ANTI_THRESHOLD) classification = 'anti';

  return { classification, score, rationale };
}
