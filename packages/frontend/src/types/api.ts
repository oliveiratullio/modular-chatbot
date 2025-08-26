// src/types/api.ts
export type AgentName = "RouterAgent" | "KnowledgeAgent" | "MathAgent";

export type AgentStep = { agent: AgentName; decision?: "KnowledgeAgent" | "MathAgent" };

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

// Tipo interno da UI
export type Message = {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  agentWorkflow?: AgentStep[];
  sourceAgentResponse?: string;
};

export type Conversation = {
  id: string;
  title: string;
  lastMessageAt: Date;
  messages: Message[];
};
