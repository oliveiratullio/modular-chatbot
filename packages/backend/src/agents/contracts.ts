export type AgentName = 'RouterAgent' | 'KnowledgeAgent' | 'MathAgent';

export type AgentDecision = {
  agent: Exclude<AgentName, 'RouterAgent'>;
  reason?: string;
};

export type AgentStep = { agent: AgentName; decision?: AgentDecision['agent'] };

export type ChatRequestDTO = {
  message: string;
  user_id: string;
  conversation_id: string;
};

export type ChatResponseDTO = {
  response: string;
  source_agent_response: string;
  agent_workflow: AgentStep[];
};

// Contexto para logs/correlação (entra em todos os handlers)
export type AgentContext = {
  conversation_id: string;
  user_id: string;
  // espaço para traceId, spanId, etc, se quiser
  trace_id?: string;
};

export type AgentOutput = {
  response: string;
  source_agent_response?: string;
  // metadados livres para observabilidade (não expor ao cliente)
  meta?: Record<string, unknown>;
};

// Interface que todo Agent deve implementar
export interface IAgent {
  readonly name: Exclude<AgentName, 'RouterAgent'>;
  canHandle(message: string, ctx: AgentContext): Promise<boolean> | boolean; // opcional se usar apenas Router
  handle(
    message: string,
    ctx: AgentContext,
    trail: AgentStep[],
  ): Promise<ChatResponseDTO>;
}

// Interface do roteador
export interface IRouterAgent {
  readonly name: 'RouterAgent';
  route(message: string, ctx: AgentContext): Promise<AgentDecision>;
}
