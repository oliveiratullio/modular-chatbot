import { http } from "./http";
import type {
  AgentStep,
  ChatRequestDTO,
  ChatResponseDTO,
  Conversation,
  Message,
} from "../types/api";

const LS_KEY = "chat_conversations_v1";

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
  const messagesRaw = (u as { messages?: unknown }).messages;

  const messages: Message[] = Array.isArray(messagesRaw)
    ? (messagesRaw.map(toMessage).filter(Boolean) as Message[])
    : [];

  return { id, title, lastMessageAt, messages };
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
    // 1) grava msg do usuário local
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

    // 3) grava msg do assistente local
    const conv2 = ensureConversation(conversationId);
    conv2.messages.push(assistantMessage);
    conv2.lastMessageAt = new Date();
    upsertConversation(conv2);

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
};
