/**
 * Anthropic (Claude) provider. Set ANTHROPIC_API_KEY in env.
 */
async function complete({ systemPrompt, userPrompt }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');

  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const block = message.content?.find((b) => b.type === 'text');
  const content = block?.text;
  if (content == null) throw new Error('Anthropic returned no text');
  return content;
}

module.exports = { complete };
