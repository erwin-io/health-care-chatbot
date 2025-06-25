// retrieverAgent.js
import fetch from 'node-fetch';

export async function filterRelevantDocs(userQuestion, documents) {
  const MAX_DOCS_TO_SHOW = 10;
  const DOC_PREVIEW_LENGTH = 200;

  const limitedDocs = documents.slice(0, MAX_DOCS_TO_SHOW);

  const filterPrompt = `
You are a medical assistant AI. Select the most relevant documents (1 to 3) that help answer the user question below.

Respond ONLY with a JSON array of selected indexes like: [1, 3]

User question:
"${userQuestion}"

Documents:
${limitedDocs.map((doc, i) =>
  `Document ${i + 1}:\n${doc.pageContent.slice(0, DOC_PREVIEW_LENGTH)}...`
).join('\n\n')}
`.trim();

  const response = await fetch(process.env.GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "llama3-8b-8192", // smaller, fast model
      messages: [
        { role: "system", content: filterPrompt },
        { role: "user", content: userQuestion },
      ],
      temperature: 0.1,
      max_tokens: 100,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Retriever LLM Error: ${errText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  try {
    const indexes = JSON.parse(content);
    return indexes.map((i) => limitedDocs[i - 1]).filter(Boolean);
  } catch (err) {
    console.warn("⚠️ Could not parse index response, fallback to top 3.");
    return limitedDocs.slice(0, 3);
  }
}
