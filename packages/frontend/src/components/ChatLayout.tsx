import { useState, useEffect } from "react";
import type { Conversation, Message } from "../types/api";

import { ConversationList } from "./ConversationList";
import { ChatArea } from "./ChatArea";
import { MobileHeader } from "./MobileHeader";
import { useIsMobile } from "./ui/use-mobile";
import { useUserId } from "../hooks/useUserId";
import { useConversationHistory } from "../hooks/useConversationHistory";
import { useHistory } from "../hooks/useHistory";
import { chatService } from "../services/chatService";

// Mock inicial alinhado ao tipo AgentStep (sem execution_time/source)
const initialConversations: Conversation[] = [
  {
    id: "conv-1",
    title: "Suporte InfinitePay",
    lastMessageAt: new Date(2024, 7, 26, 14, 30),
    user_id: "user-123",
    messages: [
      {
        id: "msg-welcome",
        content:
          "Olá! Sou seu assistente da InfinitePay. Posso ajudar com dúvidas sobre taxas, maquininhas e também fazer cálculos matemáticos para você!",
        timestamp: new Date(2024, 7, 26, 14, 30),
        isUser: false,
        agentWorkflow: [
          { agent: "RouterAgent", decision: "KnowledgeAgent" },
          { agent: "KnowledgeAgent" }, // ✅ sem execution_time
        ],
      },
    ],
  },
];

export function ChatLayout() {
  const userId = useUserId();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [mobileView, setMobileView] = useState<"conversations" | "chat">("conversations");
  const isMobile = useIsMobile();

  // Hooks para carregar conversas do histórico
  const { conversations: historyConversations } = useConversationHistory(userId);
  const { questions: historyQuestions } = useHistory(userId);

  const activeConversation = conversations.find((conv) => conv.id === activeConversationId);

  // Inicializa as conversas quando o userId estiver disponível
  useEffect(() => {
    if (userId && (conversations.length === 0 || conversations.length === 1)) {
      // Primeiro tenta carregar conversas do localStorage (sistema novo)
      if (historyConversations.length > 0) {
        setConversations(historyConversations);
        setActiveConversationId(historyConversations[0]?.id || "");
      }
      // Se não há conversas salvas mas há perguntas do histórico, cria conversas a partir delas
      else if (historyQuestions.length > 0) {
        // Agrupa perguntas por conversation_id
        const conversationsMap = new Map<string, Conversation>();

        historyQuestions.forEach((question) => {
          const convId = question.conversation_id;
          if (!conversationsMap.has(convId)) {
            conversationsMap.set(convId, {
              id: convId,
              title: `Conversa ${convId.slice(0, 8)}`,
              lastMessageAt: new Date(question.timestamp),
              user_id: userId,
              messages: [],
            });
          }

          const conv = conversationsMap.get(convId)!;
          conv.messages.push({
            id: `history-${question.id}`,
            content: question.question,
            isUser: true,
            timestamp: new Date(question.timestamp),
            isFromHistory: true,
            originalConversationId: convId,
          });
        });

        // Converte para array e ordena por última mensagem
        const createdConversations = Array.from(conversationsMap.values())
          .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())
          .slice(0, 7); // Limita a 7 conversas

        setConversations(createdConversations);
        setActiveConversationId(createdConversations[0]?.id || "");
      }
      // Senão usa as conversas iniciais
      else {
        const initialConvs = initialConversations.map((conv) => ({
          ...conv,
          user_id: userId,
        }));
        setConversations(initialConvs);
        setActiveConversationId(initialConvs[0]?.id || "");
      }
    }
  }, [userId, conversations.length, historyConversations, historyQuestions]);

  const handleSendMessage = async (messageContent: string) => {
    if (!activeConversationId || isLoading) return;

    // Usa o userId consistente do hook

    const optimisticUserMessage: Message = {
      id: `msg-${Date.now()}`,
      content: messageContent,
      timestamp: new Date(),
      isUser: true,
    };

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === activeConversationId) {
          // Se é a primeira mensagem e o título é "Nova Conversa", atualiza o título
          const isFirstMessage = conv.messages.length === 0;
          const shouldUpdateTitle = isFirstMessage && conv.title === "Nova Conversa";

          return {
            ...conv,
            messages: [...conv.messages, optimisticUserMessage],
            lastMessageAt: new Date(),
            title: shouldUpdateTitle
              ? messageContent.slice(0, 50) + (messageContent.length > 50 ? "..." : "")
              : conv.title,
          };
        }
        return conv;
      }),
    );

    setIsLoading(true);
    try {
      const { assistantMessage } = await chatService.sendMessage(
        activeConversationId,
        userId,
        messageContent,
      );

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? {
                ...conv,
                messages: [...conv.messages, assistantMessage],
                lastMessageAt: new Date(),
              }
            : conv,
        ),
      );
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);

      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        content: "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.",
        timestamp: new Date(),
        isUser: false,
      };

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? {
                ...conv,
                messages: [...conv.messages, errorMessage],
                lastMessageAt: new Date(),
              }
            : conv,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    const newConversation: Conversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: "Nova Conversa",
      lastMessageAt: new Date(),
      user_id: userId,
      messages: [],
    };

    // Salva a nova conversa no localStorage
    chatService.saveConversation(newConversation);

    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);

    if (isMobile) setMobileView("chat");
  };

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    if (isMobile) setMobileView("chat");
  };

  const handleBackToConversations = () => setMobileView("conversations");

  if (!isMobile) {
    return (
      <div className="h-screen flex bg-background overflow-hidden">
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
        />
        <div className="flex-1 overflow-hidden">
          <ChatArea
            conversation={activeConversation || null}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {mobileView === "conversations" ? (
        <>
          <MobileHeader title="InfinitePay Chat" subtitle={`${conversations.length} conversas`} />
          <div className="flex-1 overflow-hidden">
            <ConversationList
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
              isMobile
            />
          </div>
        </>
      ) : (
        <>
          <MobileHeader
            title={activeConversation?.title || "Chat"}
            subtitle={`${activeConversation?.messages.length || 0} mensagens`}
            showBackButton
            onBackClick={handleBackToConversations}
          />
          <div className="flex-1 overflow-hidden">
            <ChatArea
              conversation={activeConversation || null}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              isMobile
            />
          </div>
        </>
      )}
    </div>
  );
}
