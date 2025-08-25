import { OpenAIEmbeddings } from '@langchain/openai';
import type { EmbeddingsInterface } from '@langchain/core/embeddings';

export type IEmbeddingsAdapter = EmbeddingsInterface;

export class OpenAIEmbeddingsAdapter implements IEmbeddingsAdapter {
  private readonly emb = new OpenAIEmbeddings({
    model: 'text-embedding-3-small', // barato e suficiente
    apiKey: process.env.OPENAI_API_KEY,
  });

  embedDocuments(texts: string[]) {
    return this.emb.embedDocuments(texts);
  }
  embedQuery(text: string) {
    return this.emb.embedQuery(text);
  }
}
