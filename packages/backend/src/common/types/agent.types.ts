export type AgentName = 'RouterAgent' | 'KnowledgeAgent' | 'MathAgent';

export interface AgentDecision {
  agent: AgentName;
  decision?: 'KnowledgeAgent' | 'MathAgent';
  reason?: string;
}

export interface AgentResponse {
  response: string;
  source_agent_response?: string;
  agent_workflow: AgentDecision[];
  meta?: Record<string, unknown>;
}
