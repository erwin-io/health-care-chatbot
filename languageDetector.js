import fetch from 'node-fetch';

export async function detectLanguage(text) {
  const prompt = `
You are a smart language detection assistant.

Analyze the user's message and classify it into one of the following:
- "english" (fully English)
- "tagalog" (mostly Filipino/Tagalog)
- "mixed" (combination of English and Tagalog)

User message:
"""
${text}
"""

Reply with only one word: english, tagalog, or mixed.
`.trim();

  const res = await fetch(process.env.GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: text },
      ],
      temperature: 0.1,
      max_tokens: 10,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Language Detection Error: ${errText}`);
  }

  const json = await res.json();
  const raw = json.choices[0].message.content.trim().toLowerCase();

  if (['english', 'tagalog', 'mixed'].includes(raw)) {
    return raw;
  }

  return 'unknown'; // fallback
}
