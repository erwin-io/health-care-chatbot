# 🩺 Healthcare AI Chatbot

A friendly, conversational AI medical assistant built using **Node.js**, **Firebase Realtime Database**, and **GROQ (LLaMA3)**. This system supports natural chat-style interaction, memory retention per user, and a multilingual experience in English and Tagalog.

---

## 📁 Project Structure

```
|-- .env                      # Environment variables
|-- index.js                 # Main Express app entry point
|-- knowledgeBase.js         # Fetches structured medical knowledge
|-- languageDetector.js      # Detects if the question is English or Tagalog
|-- promptTemplate.js        # Builds prompt to send to LLM
|-- retrieverAgent.js        # Filters relevant docs from the fetched knowledge base
|-- vercel.json              # Vercel deployment configuration (optional)
```

---

## 🚀 Installation Guide

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/healthcare-chatbot.git
cd healthcare-chatbot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup `.env`

Create a `.env` file in the root directory with the following keys:

```env
GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
GROQ_API_KEY=your_groq_key_here
FIREBASE_SERVICE_ACCOUNT_JSON={...} # Single line JSON string of service account
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
```

To get your `FIREBASE_SERVICE_ACCOUNT_JSON`, go to: Firebase Console → Project Settings → Service Accounts → Generate new private key → Copy contents as one-line JSON.

### 4. Run the Server

```bash
node index.js
```

Your API is now running at:

```
http://localhost:3000/ask
```

### 5. Test with curl

```bash
curl -X POST http://localhost:3000/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Masakit ang ulo ko since kahapon, what should I do?",
    "userId": "user-1234"
  }'
```

---

## 📚 File Documentation

### ✅ `.env`

Holds all sensitive credentials including:

- GROQ API key
- Firebase service account (as a single-line JSON)
- Firebase Realtime DB URL

### ✅ `index.js`

Main backend file that:

- Initializes Firebase
- Sets up `/ask` endpoint
- Stores messages to DB
- Retrieves memory
- Builds a prompt
- Sends it to GROQ LLaMA3

### ✅ `knowledgeBase.js`

Responsible for retrieving structured documents from health sources (e.g., `https://health.gov/myhealthfinder/api/v3/topicsearch.json`). Returns them as an array of objects with `pageContent` and optional metadata.

### ✅ `languageDetector.js`

Uses simple heuristics or string checks to detect whether the question is English or Tagalog. Returns: `'english'`, `'tagalog'`, or `'mixed'`.

### ✅ `promptTemplate.js`

- Builds a rich prompt including:
  - User question
  - Past memory
  - Relevant documents
  - Instructions in user language (Tagalog, English, Taglish)
- Ends every response with a medical disclaimer.
- Exposes `buildPrompt()` and `truncateDocs()`.

### ✅ `retrieverAgent.js`

Filters and scores medical documents to pick only the relevant ones for the user question. Returns a ranked subset of relevant documents.

### ✅ `vercel.json`

If you're deploying on Vercel, this config enables a custom server deployment:

```json
{
  "functions": {
    "api/index.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```

---

## 📖 Example Response

```json
{
  "answer": "Hmm, kung masakit pa rin ang ulo mo simula kahapon, baka kailangan mo munang magpahinga... \n\n⚠️ This information is not a substitute for professional medical advice.",
  "language": "tagalog"
}
```

---

## 📱 React Native Integration

Use `fetch` or `axios` to POST to `http://localhost:3000/ask`:

```js
const res = await fetch("http://localhost:3000/ask", {
  method: "POST",
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: "Masakit ang ulo ko",
    userId: user.email,
  })
});

const { answer } = await res.json();
```

---

## 🛡️ Disclaimer

This chatbot is **not a substitute for professional medical care**. Always consult a doctor for health concerns.

---

## 📃 License

MIT License. Use freely for research and learning. Commercial deployment requires credit to original author.

