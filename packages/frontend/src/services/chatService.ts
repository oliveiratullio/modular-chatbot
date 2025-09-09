import { http } from "./http";
import type {
  AgentStep,
  ChatRequestDTO,
  ChatResponseDTO,
  Conversation,
  Message,
  HistoryQuestion,
  HistoryResponse,
} from "../types/api";

const LS_KEY = "chat_conversations_v1";
const LS_CONVERSATIONS_KEY = "chat_conversations_list_v1";

// ---------- helpers de (de)serialização -----------
function reviveDate(value: unknown): Date {
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    // fallback: se inválida, usa agora
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
}

function isRecord(u: unknown): u is Record<string, unknown> {
  return typeof u === "object" && u !== null;
}

function toMessage(u: unknown): Message | null {
  if (!isRecord(u)) return null;
  const id = typeof u.id === "string" ? u.id : crypto.randomUUID();
  const content = typeof u.content === "string" ? u.content : "";
  const isUser = typeof u.isUser === "boolean" ? u.isUser : false;
  const timestamp = reviveDate((u as { timestamp?: unknown }).timestamp);

  const agentWorkflow = Array.isArray((u as { agentWorkflow?: unknown }).agentWorkflow)
    ? ((u as { agentWorkflow: unknown[] }).agentWorkflow
        .map((s) =>
          isRecord(s) && typeof s.agent === "string"
            ? ({
                agent: s.agent,
                decision: (s as { decision?: unknown }).decision as string | undefined,
              } as AgentStep)
            : null,
        )
        .filter(Boolean) as AgentStep[])
    : undefined;

  const sourceAgentResponse =
    typeof (u as { sourceAgentResponse?: unknown }).sourceAgentResponse === "string"
      ? (u as { sourceAgentResponse: string }).sourceAgentResponse
      : undefined;

  return { id, content, isUser, timestamp, agentWorkflow, sourceAgentResponse };
}

function toConversation(u: unknown): Conversation | null {
  if (!isRecord(u)) return null;
  const id = typeof u.id === "string" ? u.id : crypto.randomUUID();
  const title = typeof u.title === "string" ? u.title : `Conversa ${id}`;
  const lastMessageAt = reviveDate((u as { lastMessageAt?: unknown }).lastMessageAt);
  const user_id =
    typeof (u as { user_id?: unknown }).user_id === "string"
      ? (u as { user_id: string }).user_id
      : "";
  const messagesRaw = (u as { messages?: unknown }).messages;

  const messages: Message[] = Array.isArray(messagesRaw)
    ? (messagesRaw.map(toMessage).filter(Boolean) as Message[])
    : [];

  return { id, title, lastMessageAt, user_id, messages };
}
// ---------------------------------------------------

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.map(toConversation).filter(Boolean) as Conversation[];
  } catch {
    return [];
  }
}

function saveConversations(convs: Conversation[]) {
  localStorage.setItem(
    LS_KEY,
    JSON.stringify(
      convs.map((c) => ({
        ...c,
        lastMessageAt: c.lastMessageAt.toISOString(),
        messages: c.messages.map((m) => ({
          ...m,
          timestamp: m.timestamp.toISOString(),
        })),
      })),
    ),
  );
}

function ensureConversation(conversationId: string): Conversation {
  const convs = loadConversations();
  let conv = convs.find((c) => c.id === conversationId);
  if (!conv) {
    conv = {
      id: conversationId,
      title: `Conversa ${conversationId}`,
      lastMessageAt: new Date(),
      messages: [],
    };
    convs.unshift(conv);
    saveConversations(convs);
  }
  return conv;
}

function upsertConversation(conv: Conversation) {
  const convs = loadConversations();
  const idx = convs.findIndex((c) => c.id === conv.id);
  if (idx >= 0) convs[idx] = conv;
  else convs.unshift(conv);
  saveConversations(convs);
}

// ---------- Gerenciamento de conversas completas ----------
function loadConversationsList(): Conversation[] {
  try {
    const raw = localStorage.getItem(LS_CONVERSATIONS_KEY);
    if (!raw) {
      return [];
    }
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) {
      return [];
    }
    const conversations = arr.map(toConversation).filter(Boolean) as Conversation[];
    return conversations;
  } catch {
    return [];
  }
}

function saveConversationsList(convs: Conversation[]) {
  localStorage.setItem(
    LS_CONVERSATIONS_KEY,
    JSON.stringify(
      convs.map((c) => ({
        ...c,
        lastMessageAt: c.lastMessageAt.toISOString(),
        messages: c.messages.map((m) => ({
          ...m,
          timestamp: m.timestamp.toISOString(),
        })),
      })),
    ),
  );
}

function ensureConversationInList(conversationId: string, userId: string): Conversation {
  const convs = loadConversationsList();
  let conv = convs.find((c) => c.id === conversationId);
  if (!conv) {
    conv = {
      id: conversationId,
      title: `Conversa ${conversationId.slice(0, 8)}`,
      lastMessageAt: new Date(),
      user_id: userId,
      messages: [],
    };
    convs.unshift(conv);
    saveConversationsList(convs);
  }
  return conv;
}

function upsertConversationInList(conv: Conversation) {
  const convs = loadConversationsList();
  const idx = convs.findIndex((c) => c.id === conv.id);
  if (idx >= 0) convs[idx] = conv;
  else convs.unshift(conv);

  // Ordena por última mensagem (mais recente primeiro)
  convs.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

  // Mantém apenas as últimas 50 conversas
  const limitedConvs = convs.slice(0, 50);

  saveConversationsList(limitedConvs);
}

export const chatService = {
  async listConversations(): Promise<Conversation[]> {
    return loadConversations();
  },

  async getConversation(conversationId: string): Promise<Conversation> {
    return ensureConversation(conversationId);
  },

  async sendMessage(
    conversationId: string,
    userId: string,
    content: string,
  ): Promise<{ userMessage: Message; assistantMessage: Message }> {
    // 1) grava msg do usuário local (sistema antigo)
    const conv = ensureConversation(conversationId);
    const userMessage: Message = {
      id: crypto.randomUUID(),
      content,
      isUser: true,
      timestamp: new Date(),
    };
    conv.messages.push(userMessage);
    conv.lastMessageAt = new Date();
    upsertConversation(conv);

    // 1.1) grava msg do usuário no sistema de conversas completas
    const convComplete = ensureConversationInList(conversationId, userId);
    convComplete.messages.push(userMessage);
    convComplete.lastMessageAt = new Date();
    convComplete.user_id = userId;

    // Se é a primeira mensagem e o título é "Nova Conversa", atualiza o título
    const isFirstMessage = convComplete.messages.length === 1;
    const shouldUpdateTitle = isFirstMessage && convComplete.title === "Nova Conversa";
    if (shouldUpdateTitle) {
      convComplete.title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
    }

    upsertConversationInList(convComplete);

    // 2) chama backend /chat
    const payload: ChatRequestDTO = {
      message: content,
      user_id: userId,
      conversation_id: conversationId,
    };

    const resp = await http<ChatResponseDTO>("/chat", {
      method: "POST",
      body: payload,
    });

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      content: resp.response,
      isUser: false,
      timestamp: new Date(),
      agentWorkflow: (resp.agent_workflow ?? []) as AgentStep[],
      sourceAgentResponse: resp.source_agent_response ?? "",
    };

    // 3) grava msg do assistente local (sistema antigo)
    const conv2 = ensureConversation(conversationId);
    conv2.messages.push(assistantMessage);
    conv2.lastMessageAt = new Date();
    upsertConversation(conv2);

    // 3.1) grava msg do assistente no sistema de conversas completas
    const convComplete2 = ensureConversationInList(conversationId, userId);
    convComplete2.messages.push(assistantMessage);
    convComplete2.lastMessageAt = new Date();
    convComplete2.user_id = userId;
    upsertConversationInList(convComplete2);

    return { userMessage, assistantMessage };
  },

  // observabilidade básica da UI
  async health() {
    return http<{ status: "ok"; version: string }>("/health");
  },

  async ready() {
    return http<{ ready: boolean; redis: "ok" | "disabled" | "down" }>("/ready");
  },

  async tailLogs(conversationId: string, n = 100) {
    // se o endpoint opcional existir, retornamos os logs como objetos desconhecidos
    try {
      return await http<unknown[]>(`/logs/${encodeURIComponent(conversationId)}?n=${n}`);
    } catch {
      return [];
    }
  },

  // ---------- Histórico de perguntas ----------
  async getHistory(userId: string, limit = 20): Promise<HistoryQuestion[]> {
    try {
      const response = await http<HistoryResponse>(
        `/history/${encodeURIComponent(userId)}?limit=${limit}`,
      );
      return response.questions;
    } catch (error) {
      console.warn("Erro ao carregar histórico:", error);
      return [];
    }
  },

  async removeQuestion(userId: string, questionId: string): Promise<boolean> {
    try {
      const response = await http<{ success: boolean }>(
        `/history/${encodeURIComponent(userId)}/question/${encodeURIComponent(questionId)}`,
        {
          method: "DELETE",
        },
      );
      return response.success;
    } catch (error) {
      console.warn("Erro ao remover pergunta:", error);
      return false;
    }
  },

  async clearHistory(userId: string): Promise<boolean> {
    try {
      const response = await http<{ success: boolean }>(`/history/${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });
      return response.success;
    } catch (error) {
      console.warn("Erro ao limpar histórico:", error);
      return false;
    }
  },

  // ---------- Conversas completas do histórico ----------
  async getConversationHistory(userId: string, limit = 7): Promise<Conversation[]> {
    try {
      // Primeiro tenta o endpoint do backend
      const response = await http<{ conversations: Conversation[] }>(
        `/conversations/${encodeURIComponent(userId)}?limit=${limit}`,
      );
      return response.conversations || [];
    } catch (error) {
      // Se for erro 404, usa o localStorage
      if (error instanceof Error && error.message.includes("404")) {
        const conversations = loadConversationsList();

        // Filtra por userId, ordena por última mensagem e limita o resultado
        const userConversations = conversations
          .filter((conv) => conv.user_id === userId)
          .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())
          .slice(0, limit);
        return userConversations;
      }
      console.warn("Erro ao carregar conversas do histórico:", error);
      return [];
    }
  },

  // ---------- Métodos para gerenciar conversas completas ----------
  async getConversationsList(userId: string, limit = 7): Promise<Conversation[]> {
    const conversations = loadConversationsList();
    const userConversations = conversations
      .filter((conv) => conv.user_id === userId)
      .slice(0, limit);
    return userConversations;
  },

  async saveConversation(conversation: Conversation): Promise<void> {
    upsertConversationInList(conversation);
  },
};
