// knowledgeBase.js
import { Document } from 'langchain/document';
import fetch from 'node-fetch';

export async function getMedicalDocs() {
  const res = await fetch('https://health.gov/myhealthfinder/api/v3/topicsearch.json');
  const json = await res.json();

  return json.Result.Resources.Resource.map((r) => {
    const sections = r.Sections?.section || [];
    const content = sections.map((s) => s.Content || '').join(' ');
    return new Document({
      pageContent: `${r.Title}\n${content}`,
    });
  });
}
