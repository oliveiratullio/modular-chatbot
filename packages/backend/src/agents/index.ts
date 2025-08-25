import { MathAgent } from './math.agent.js';
import { KnowledgeAgent } from './knowledge.agent.js';
import { RouterAgent } from './router.agent.js';

export const AGENT_TOKENS = {
  RouterAgent: Symbol('RouterAgent'),
  MathAgent: Symbol('MathAgent'),
  KnowledgeAgent: Symbol('KnowledgeAgent'),
};

export const agentProviders = [
  { provide: AGENT_TOKENS.RouterAgent, useClass: RouterAgent },
  { provide: AGENT_TOKENS.MathAgent, useClass: MathAgent },
  { provide: AGENT_TOKENS.KnowledgeAgent, useClass: KnowledgeAgent },
];

export { MathAgent, KnowledgeAgent, RouterAgent };
