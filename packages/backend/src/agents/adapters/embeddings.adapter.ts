import { OpenAIEmbeddings } from '@langchain/openai';
import type { EmbeddingsInterface } from '@langchain/core/embeddings';

export type IEmbeddingsAdapter = EmbeddingsInterface;

export class OpenAIEmbeddingsAdapter implements IEmbeddingsAdapter {
  private readonly emb = new OpenAIEmbeddings({
    // Permite trocar provedor/modelo via env (ex.: DeepSeek)
    model: process.env.EMBEDDINGS_MODEL ?? 'text-embedding-3-small',
    apiKey: process.env.OPENAI_API_KEY ?? process.env.DEEPSEEK_API_KEY,
    configuration: {
      baseURL: process.env.OPENAI_BASE_URL ?? process.env.DEEPSEEK_API_BASE_URL,
    },
  });

  embedDocuments(texts: string[]) {
    return this.emb.embedDocuments(texts);
  }
  embedQuery(text: string) {
    return this.emb.embedQuery(text);
  }
}
