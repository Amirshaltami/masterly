const SKILL_GROUPS: Record<string, string[]> = {
  music: ["music", "piano", "guitar", "violin", "singing", "voice", "drums", "music theory"],
  math: ["math", "mathematics", "algebra", "calculus", "geometry", "statistics"],
  language: ["language", "english", "arabic", "french", "spanish", "speaking", "writing"],
  coding: ["coding", "programming", "software", "javascript", "typescript", "python", "java"],
  fitness: ["fitness", "workout", "yoga", "pilates", "strength", "cardio"],
  art: ["art", "drawing", "painting", "design", "illustration"],
};

function normalize(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ");
}

function tokens(input: string): string[] {
  return normalize(input).split(" ").filter(Boolean);
}

function expandedTerms(input: string): Set<string> {
  const value = normalize(input);
  const out = new Set<string>([value, ...tokens(value)]);

  for (const group of Object.values(SKILL_GROUPS)) {
    const hasGroupHit = group.some((term) => value.includes(term) || term.includes(value));
    if (hasGroupHit) {
      for (const term of group) {
        out.add(term);
        for (const t of tokens(term)) out.add(t);
      }
    }
  }

  return out;
}

function jaccardScore(a: Set<string>, b: Set<string>): number {
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  if (union === 0) return 0;
  return intersection / union;
}

export function scoreSkillSimilarity(query: string, candidate: string): number {
  const q = normalize(query);
  const c = normalize(candidate);
  if (!q || !c) return 0;
  if (q === c) return 1;
  if (q.includes(c) || c.includes(q)) return 0.8;

  const qTerms = expandedTerms(q);
  const cTerms = expandedTerms(c);
  const tokenScore = jaccardScore(qTerms, cTerms);

  if (tokenScore > 0) return tokenScore;
  return 0;
}

export function bestSkillMatchScore(query: string, skills: string[]): { score: number; bestSkill: string | null } {
  let bestSkill: string | null = null;
  let score = 0;

  for (const skill of skills) {
    const current = scoreSkillSimilarity(query, skill);
    if (current > score) {
      score = current;
      bestSkill = skill;
    }
  }

  return { score, bestSkill };
}
