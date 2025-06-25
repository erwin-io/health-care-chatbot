// index.js
import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { getMedicalDocs } from './knowledgeBase.js';
import { filterRelevantDocs } from './retrieverAgent.js';
import { buildPrompt } from './promptTemplate.js';

dotenv.config();

const app = express();
app.use(express.json());

app.post('/ask', async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'Missing question' });

  try {
    const allDocs = await getMedicalDocs();
    const selectedDocs = await filterRelevantDocs(question, allDocs);
    const prompt = buildPrompt(question, selectedDocs);

    const response = await fetch(process.env.GROQ_API_URL, {
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
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM Error: ${errorText}`);
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;
    res.json({ answer });
  } catch (err) {
    console.error("❌", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log('🩺 Healthcare AI running at http://localhost:3000/ask');
});