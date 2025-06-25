// index.js
import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { getMedicalDocs } from './knowledgeBase.js';
import { filterRelevantDocs } from './retrieverAgent.js';
import { buildPrompt, truncateDocs } from './promptTemplate.js';
import { detectLanguage } from './languageDetector.js';
import { getDatabase } from 'firebase-admin/database';
import admin from 'firebase-admin';

dotenv.config();

// ✅ Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

const db = getDatabase();
const app = express();
app.use(express.json());

async function storeMessage(userId, role, content) {
  const ref = db.ref(`users/${userId}/messages`).push();
  await ref.set({ role, content, timestamp: Date.now() })
    .catch(err => console.error("Firebase write failed:", err));
}

async function getUserMemory(userId, limit = 5) {
  const snap = await db.ref(`users/${userId}/messages`).orderByChild('timestamp').limitToLast(limit).get();
  return Object.values(snap.val() || {});
}

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
      if (res.status === 429) {
        return { error: 'Rate limit hit. Please try again shortly.' };
      }
      throw new Error(`LLM Error: ${text}`);
    }

    const data = await res.json();
    return data.choices[0].message.content;
  }

  throw new Error("Exceeded retry attempts due to rate limits.");
}

app.post('/ask', async (req, res) => {
  const { question, userId } = req.body;
  if (!question || !userId) return res.status(400).json({ error: 'Missing question or userId' });

  try {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const language = await detectLanguage(question);
    const allDocs = await getMedicalDocs();
    const filteredDocs = await filterRelevantDocs(question, allDocs);
    const truncatedDocs = truncateDocs(filteredDocs, 8000);

    await storeMessage(userId, 'user', question);

    const pastMessages = await getUserMemory(userId);
    const memory = pastMessages
      .map(m => `${m.role === 'user' ? 'User said:' : 'Assistant said:'} ${m.content}`)
      .join('\n');

    const prompt = buildPrompt(question, truncatedDocs, language, memory);

    const answer = await callLLMWithRetry(prompt, question);

    if (typeof answer === 'object' && answer.error) {
      return res.status(429).json({ error: answer.error });
    }

    await storeMessage(userId, 'assistant', answer);

    res.json({ answer, language });
  } catch (err) {
    console.error("❌", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log('🩺 Healthcare AI running at http://localhost:3000/ask');
});
