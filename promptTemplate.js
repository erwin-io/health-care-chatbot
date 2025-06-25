export function buildPrompt(question, retrievedDocs, languageMode = 'english', memoryContext = '') {
  const disclaimer = "⚠️ This information is not a substitute for professional medical advice. Please consult a healthcare provider if symptoms persist or worsen.";

  const languageInstruction = {
    english: "Respond in English only.",
    tagalog: "Tumugon gamit ang wikang Tagalog lamang.",
    mixed: `
Gamitin ang parehong Tagalog at English (Taglish) sa sagot. Huwag ulit-ulitin ang parehong simula tulad ng \"Aw, sorry to hear that\" o \"kapatid\". Gamitin ang natural, varied na human tone — parang tunay na kausap sa chat o text.

Pwede magsimula sa:
- Observational (\"Hmm, kung masakit pa rin ulo mo...\")
- Concerned but casual (\"Nako, mukhang kailangan mo talagang magpahinga.\")
- Direct to advice (\"Try mo muna mag-hydrate...\")
- Try other than \"Aw, sorry to hear that\", \"kapatid\"

Iwasan ang robotic or scripted tone. Maging parang totoong kausap.`
  };

  const medicalContext = retrievedDocs
    .map((doc, i) => `Reference ${i + 1}:
${doc.pageContent}`)
    .join("\n\n");

  return `
You are a friendly and empathetic virtual medical assistant designed to help users with common health questions.

${languageInstruction[languageMode] || languageInstruction.english}

Respond in a human, helpful, and clear tone.

Instructions:
1. If there's past context, use it naturally to show continuity (e.g. \"Earlier you mentioned...\").
2. Summarize medical documents in simple language.
3. Offer helpful next steps or home advice.
4. If the symptoms sound serious, include a gentle urgent care warning.
5. Always end with the disclaimer.

---

${memoryContext ? `Here’s the conversation so far:
${memoryContext}` : ''}

You can refer to these medical documents:

${medicalContext}

User's current question:
"""
${question}
"""

${disclaimer}
`.trim();
}

export function truncateDocs(docs, maxTotalChars = 8000) {
  let total = 0;
  const selected = [];

  for (const doc of docs) {
    const len = doc.pageContent.length;
    if (total + len > maxTotalChars) break;

    selected.push(doc);
    total += len;
  }

  return selected;
}
