export type AgentName = 'RouterAgent' | 'KnowledgeAgent' | 'MathAgent';

export type AgentStep = {
  agent: AgentName;
  decision?: Exclude<AgentName, 'RouterAgent'>;
};

export type AgentContext = { conversation_id: string; user_id: string };

export type AgentResponse = {
  response: string;
  source_agent_response: string;
  agent_workflow: AgentStep[];
};

export interface IAgent {
  name: AgentName;
  canHandle(message: string): boolean;
  handle(
    message: string,
    ctx: AgentContext,
    trail: AgentStep[],
  ): Promise<AgentResponse>;
}

export type RouterDecision = {
  agent: Exclude<AgentName, 'RouterAgent'>;
  reason?: string;
};

export interface IRouterAgent {
  route(message: string, ctx: AgentContext): Promise<RouterDecision>;
}
