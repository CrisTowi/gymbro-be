/**
 * OpenAI (GPT) provider. Set OPENAI_API_KEY in env.
 */
async function complete({ systemPrompt, userPrompt }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

  const OpenAI = require('openai');
  const client = new OpenAI({ apiKey });

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
  });

  const content = response.choices?.[0]?.message?.content;
  if (content == null) throw new Error('OpenAI returned no content');
  return content;
}

module.exports = { complete };
