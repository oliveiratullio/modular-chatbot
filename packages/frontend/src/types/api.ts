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
  isFromHistory?: boolean;
  originalConversationId?: string;
  originalConversationTitle?: string;
};

export type Conversation = {
  id: string;
  title: string;
  lastMessageAt: Date;
  messages: Message[];
  user_id?: string;
};

export type HistoryQuestion = {
  id: string;
  question: string;
  timestamp: string;
  conversation_id: string;
  user_id: string;
};

export type HistoryResponse = {
  questions: HistoryQuestion[];
};
