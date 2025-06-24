
import os
from dotenv import load_dotenv
import requests
from langchain_community.vectorstores import FAISS
from langchain_huggingface.embeddings import HuggingFaceEmbeddings
from langchain_core.documents import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter

load_dotenv()

def fetch_medical_documents():
    url = "https://health.gov/myhealthfinder/api/v3/topicsearch.json"
    response = requests.get(url)
    resources = response.json()["Result"]["Resources"]["Resource"]

    docs = []
    for item in resources:
        title = item.get("Title", "")
        sections = item.get("Sections", {}).get("section", [])
        description = "\n".join([s.get("Content", "") for s in sections if isinstance(s, dict)])
        content = f"{title}: {description}"
        docs.append(Document(page_content=content))

    return docs

def load_vector_store():
    documents = fetch_medical_documents()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=400,
        chunk_overlap=50,
        separators=["\n", " "]
    )
    chunks = splitter.split_documents(documents)

    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vectorstore = FAISS.from_documents(chunks, embeddings)
    return vectorstore
