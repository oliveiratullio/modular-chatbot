export type AgentName = 'RouterAgent' | 'KnowledgeAgent' | 'MathAgent';

export type AgentStep = {
  agent: AgentName;
  decision?: AgentName;
};

export type ChatRequestDTO = {
  message: string;
  user_id: string;
  conversation_id: string;
};

export type AgentContext = {
  conversation_id: string;
  user_id: string;
};

export type AgentResponse = {
  response: string;
  source_agent_response: string;
  agent_workflow: AgentStep[];
};

export interface IAgent {
  name: AgentName;
  canHandle(message: string, ctx: AgentContext): Promise<boolean>;
  handle(
    message: string,
    ctx: AgentContext,
    trail: AgentStep[],
  ): Promise<AgentResponse>;
}

export type IRouterDecision = {
  agent: AgentName;
};

export interface IRouterAgent {
  route(message: string, ctx: AgentContext): Promise<IRouterDecision>;
}
export type ChatResponseDTO = AgentResponse;
