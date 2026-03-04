/**
 * LLM adapter: switchable providers (OpenAI, Anthropic, Google).
 * Set LLM_PROVIDER=openai|anthropic|google and the corresponding API key:
 *   OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_GENERATIVE_AI_API_KEY.
 * Optional: OPENAI_MODEL, ANTHROPIC_MODEL, GOOGLE_MODEL.
 */

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function getProvider(name) {
  const provider = (name || process.env.LLM_PROVIDER || 'google').toLowerCase();
  if (provider === 'openai') return require('./llm/openai');
  if (provider === 'anthropic') return require('./llm/anthropic');
  if (provider === 'google') return require('./llm/google');
  return require('./llm/openai');
}

/**
 * Ask the LLM to generate a weekly plan from a natural language description.
 * @param {object} opts
 * @param {string} opts.description - User's text description of their desired weekly routine
 * @param {{ name: string, description?: string }[]} opts.routines - User's available routines
 * @param {string} [opts.provider] - 'openai' | 'anthropic' | 'google'
 * @returns {Promise<{ [day: string]: string | null }>} - Day -> routine name or "rest"
 */
async function generateWeeklyPlanFromDescription({ description, routines, provider }) {
  const impl = getProvider(provider);

  const routineList =
    routines && routines.length
      ? routines
          .map((r, i) => `${i + 1}. "${r.name}"${r.description ? ` — ${r.description}` : ''}`)
          .join('\n')
      : '1. "Push" — Chest, shoulders, and triceps\n2. "Pull" — Back and biceps\n3. "Legs" — Quadriceps, hamstrings, glutes\n4. "Full Body" — All major muscle groups';

  const systemPrompt = `You are a fitness coach assistant. Assign one of the user's workout routines to each day of the week based on their description.

Available routines:
${routineList}

Rules:
- You MUST use the exact routine name string as shown above (copy it letter-for-letter, including capitalisation).
- For rest days use exactly: "rest"
- Respond with ONLY a valid JSON object, no markdown, no explanation.

Output format: {"monday": "Exact Routine Name or rest", "tuesday": "...", "wednesday": "...", "thursday": "...", "friday": "...", "saturday": "...", "sunday": "..."}`;

  const userPrompt = `User's description of their desired weekly routine:\n\n${description}\n\nRespond with only the JSON object.`;

  const raw = await impl.complete({
    systemPrompt,
    userPrompt,
  });

  const parsed = parseJsonFromResponse(raw);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('LLM did not return valid JSON');
  }

  const plan = {};
  for (const day of DAYS) {
    const v = parsed[day];
    if (
      v === null ||
      v === undefined ||
      (typeof v === 'string' && v.trim().toLowerCase() === 'rest')
    ) {
      plan[day] = null;
    } else if (typeof v === 'string') {
      plan[day] = v.trim();
    } else {
      plan[day] = null;
    }
  }
  return plan;
}

function parseJsonFromResponse(text) {
  const trimmed = (text || '').trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
}

module.exports = {
  getProvider,
  generateWeeklyPlanFromDescription,
};
