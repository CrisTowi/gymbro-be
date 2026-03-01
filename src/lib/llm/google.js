/**
 * Google (Gemini) provider. Set GOOGLE_GENERATIVE_AI_API_KEY in env.
 */
async function complete({ systemPrompt, userPrompt }) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set');

  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  // Default: gemini-3-flash-preview. Override with GOOGLE_MODEL.
  const model = genAI.getGenerativeModel({
    model: process.env.GOOGLE_MODEL || 'gemini-3-flash-preview',
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent(userPrompt);
  const response = result.response;
  const content = response?.text?.();
  if (content == null) throw new Error('Google Gemini returned no text');
  return content;
}

module.exports = { complete };
