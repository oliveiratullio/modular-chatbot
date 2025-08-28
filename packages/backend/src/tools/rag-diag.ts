import 'dotenv/config';
import { OpenAIEmbeddingsAdapter } from '../agents/adapters/embeddings.adapter.js';
import { RedisVectorStoreAdapter } from '../agents/adapters/vectorstore.adapter.js';

(async () => {
  const emb = new OpenAIEmbeddingsAdapter();
  const vs = new RedisVectorStoreAdapter(emb);
  const diag = await vs.diagnostics();
  console.log(JSON.stringify(diag, null, 2));
})();
