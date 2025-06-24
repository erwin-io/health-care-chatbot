# health-care-chatbot

A FastAPI-based healthcare chatbot leveraging LangChain, HuggingFace models, and FAISS for semantic search over medical documents.

> **Disclaimer:** This chatbot does not provide medical advice. Always consult a licensed healthcare professional.

---

## Features

- Semantic search over trusted medical resources
- Conversational AI using HuggingFace models
- Local (lightweight) and production (cloud) model support
- All responses include a medical disclaimer

---

## Setup Instructions

### 1. Clone the Repository

```sh
git clone https://github.com/yourusername/health-care-chatbot.git
cd health-care-chatbot
```

### 2. Configure Environment

- Copy `.env.example` to `.env` if available, or create a `.env` file.
- Set environment variables as needed:

```
IS_PRODUCTION=false
HUGGINGFACEHUB_API_TOKEN=your_huggingface_token_here
```

### 3. Install Dependencies

```sh
pip install -r requirements.txt
```

---

## Running the Application

### Development Mode (Local Model)

```sh
uvicorn main:app --reload --port 8000

```
or
```sh
python -m uvicorn main:app --reload
```

- Access the API at: http://127.0.0.1:8000
- Interactive docs: http://127.0.0.1:8000/docs

### Production Mode (Cloud Model)

- Set `IS_PRODUCTION=true` in your `.env`
- Set `HUGGINGFACEHUB_API_TOKEN`
- Run as above

---

## Usage

### Ask a Health Question

Send a POST request to `/ask` with JSON:

```json
{
  "question": "What are the symptoms of diabetes?"
}
```

**Example using curl:**

```sh
curl -X POST "http://127.0.0.1:8000/ask" \
     -H "Content-Type: application/json" \
     -d '{"question": "What are the symptoms of diabetes?"}'
```

**Sample Response:**
```json
{
  "answer": "Diabetes: ...\n\n⚠️ Disclaimer: This is not medical advice. Please consult a licensed healthcare professional.",
  "source": "FAISS + Tiny GPT-2 Local",
  "intent": "health_general"
}
```

---

## Project Structure

- `main.py`: FastAPI app and API logic
- `embed.py`: Loads and embeds medical documents into FAISS
- `requirements.txt`: Python dependencies
- `.env`: Environment variables (not committed)
- `README.md`: Project documentation

---

## Notes

- First run may take longer to download models and fetch data.
- For production, use a robust model and secure your API endpoints.

---

## License

MIT License. See `LICENSE` for details.