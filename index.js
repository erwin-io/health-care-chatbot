// index.js
import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { getMedicalDocs } from './knowledgeBase.js';
import { filterRelevantDocs } from './retrieverAgent.js';
import { buildPrompt, truncateDocs } from './promptTemplate.js';
import { detectLanguage } from './languageDetector.js';

dotenv.config();

const app = express();
app.use(express.json());

async function callLLMWithRetry(prompt, question, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(process.env.GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: question },
        ],
        temperature: 0.2,
        max_tokens: 600,
      }),
    });

    if (res.status === 429) {
      console.warn(`⏳ Rate limited. Retrying in 2000ms...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      continue;
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`LLM Error: ${text}`);
    }

    const data = await res.json();
    return data.choices[0].message.content;
  }

  throw new Error("Exceeded retry attempts due to rate limits.");
}

app.post('/ask', async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'Missing question' });

  try {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const language = await detectLanguage(question); // 'english', 'tagalog', 'mixed'
    console.log("🌐 Detected language:", language);

    const allDocs = await getMedicalDocs();
    const filteredDocs = await filterRelevantDocs(question, allDocs);
    const truncatedDocs = truncateDocs(filteredDocs, 8000); // 8000 chars max

    const prompt = buildPrompt(question, truncatedDocs, language);

    const answer = await callLLMWithRetry(prompt, question);
    res.json({ answer, language });
  } catch (err) {
    console.error("❌", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log('🩺 Healthcare AI running at http://localhost:3000/ask');
});
