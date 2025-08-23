export type AgentName = "RouterAgent" | "KnowledgeAgent" | "MathAgent";

export type ChatRequestDTO = {
  message: string;
  user_id: string;
  conversation_id: string;
};

export type AgentStep = { agent: AgentName; decision?: "KnowledgeAgent" | "MathAgent" };

export type ChatResponseDTO = {
  response: string;
  source_agent_response: string;
  agent_workflow: AgentStep[];
};
