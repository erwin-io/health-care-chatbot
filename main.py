
from fastapi import FastAPI
from pydantic import BaseModel
from langchain.chains import RetrievalQA
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
from langchain_community.llms import HuggingFacePipeline, HuggingFaceHub
from dotenv import load_dotenv
import os

from embed import load_vector_store

load_dotenv()

app = FastAPI()

vectorstore = None

@app.on_event("startup")
async def startup_event():
    global vectorstore
    vectorstore = load_vector_store()

# Local/Cloud switch
IS_PRODUCTION = os.getenv("IS_PRODUCTION", "false").lower() == "true"

if IS_PRODUCTION:
    llm = HuggingFaceHub(
        repo_id="mistralai/Mistral-7B-Instruct-v0.1",
        model_kwargs={"temperature": 0.3, "max_new_tokens": 512},
        huggingfacehub_api_token=os.getenv("HUGGINGFACEHUB_API_TOKEN")
    )
else:
    model_id = "sshleifer/tiny-gpt2"
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    model = AutoModelForCausalLM.from_pretrained(model_id)
    pipe = pipeline("text-generation", model=model, tokenizer=tokenizer, max_new_tokens=128)
    llm = HuggingFacePipeline(pipeline=pipe)

qa_chain = None

@app.on_event("startup")
async def build_qa_chain():
    global qa_chain
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=vectorstore.as_retriever(),
        return_source_documents=False
    )

class Query(BaseModel):
    question: str

def apply_safety_wrap(answer: str) -> str:
    disclaimer = "\n\n⚠️ Disclaimer: This is not medical advice. Please consult a licensed healthcare professional."
    return answer.strip() + disclaimer

@app.post("/ask")
async def ask(query: Query):
    try:
        result = qa_chain.invoke({"query": query.question})
        answer = result["result"] if isinstance(result, dict) and "result" in result else str(result)
        return {
            "answer": apply_safety_wrap(answer),
            "source": "FAISS + " + ("Mistral API" if IS_PRODUCTION else "Tiny GPT-2 Local"),
            "intent": "health_general"
        }
    except Exception as e:
        return {
            "error": str(e),
            "message": "Something went wrong while processing your request."
        }
