import { AsyncLocalStorage } from 'node:async_hooks';

export type Correlation = {
  reqId: string;
  conversation_id?: string;
  user_id?: string;
};

export const correlationStore = new AsyncLocalStorage<Correlation>();

export function getCorrelation(): Correlation | undefined {
  return correlationStore.getStore();
}
