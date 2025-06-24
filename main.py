# main.py
from fastapi import FastAPI
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from langchain.chains import RetrievalQA
from langchain_community.llms import HuggingFacePipeline, HuggingFaceHub
from transformers import pipeline, AutoModelForCausalLM, AutoTokenizer
from embed import get_vectorstore

load_dotenv()
app = FastAPI()
IS_PRODUCTION = os.getenv("RUN_MODE", "local") == "production"
vectorstore = get_vectorstore()
llm = None

if IS_PRODUCTION:
    llm = HuggingFaceHub(
        repo_id="google/flan-t5-small",
        model_kwargs={"temperature": 0.3, "max_new_tokens": 256},
        huggingfacehub_api_token=os.getenv("HUGGINGFACEHUB_API_TOKEN")
    )
else:
    model_id = "sshleifer/tiny-gpt2"
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    model = AutoModelForCausalLM.from_pretrained(model_id)
    pipe = pipeline("text-generation", model=model, tokenizer=tokenizer, max_new_tokens=128)
    llm = HuggingFacePipeline(pipeline=pipe)

qa_chain = RetrievalQA.from_chain_type(llm=llm, retriever=vectorstore.as_retriever())

class Query(BaseModel):
    question: str

def safety(answer: str) -> str:
    return answer.strip() + "\n\n⚠️ Disclaimer: Not medical advice."

@app.post("/ask")
async def ask(query: Query):
    resp = qa_chain.invoke(query.question)["result"]
    return {
        "answer": safety(resp),
        "source": "FAISS + " + ("FLAN API" if IS_PRODUCTION else "Tiny GPT-2 Local"),
    }
