# embed.py
import requests
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter  # ✅ Correct


def fetch_medical_docs():
    url = "https://health.gov/myhealthfinder/api/v3/topicsearch.json"
    res = requests.get(url).json()["Result"]["Resources"]["Resource"]
    return [Document(page_content=f"{r['Title']}\n{''.join(s.get('Content', '') for s in r.get('Sections', {}).get('section', []))}") for r in res]

def get_vectorstore():
    docs = fetch_medical_docs()
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_documents(docs)
    embed_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    return FAISS.from_documents(chunks, embed_model)
