import { useState } from "react";
import type { Conversation, Message } from "../types/api";

import { ConversationList } from "./ConversationList";
import { ChatArea } from "./ChatArea";
import { MobileHeader } from "./MobileHeader";
import { useIsMobile } from "./ui/use-mobile";
import { chatService } from "../services/chatService";

// Mock inicial alinhado ao tipo AgentStep (sem execution_time/source)
const initialConversations: Conversation[] = [
  {
    id: "conv-1",
    title: "Suporte InfinitePay",
    lastMessageAt: new Date(2024, 7, 26, 14, 30),
    // @ts-expect-error — remova se seu tipo Conversation não tiver user_id
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
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string>(
    initialConversations[0]?.id || "",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [mobileView, setMobileView] = useState<"conversations" | "chat">("conversations");
  const isMobile = useIsMobile();

  const activeConversation = conversations.find((conv) => conv.id === activeConversationId);

  const handleSendMessage = async (messageContent: string) => {
    if (!activeConversationId || isLoading) return;

    const userId =
      // @ts-expect-error — se seu Conversation não carrega user_id, defina um padrão
      activeConversation?.user_id || "user-123";

    const optimisticUserMessage: Message = {
      id: `msg-${Date.now()}`,
      content: messageContent,
      timestamp: new Date(),
      isUser: true,
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversationId
          ? {
              ...conv,
              messages: [...conv.messages, optimisticUserMessage],
              lastMessageAt: new Date(),
            }
          : conv,
      ),
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
      id: `conv-${Date.now()}`,
      title: "Nova Conversa",
      lastMessageAt: new Date(),
      // @ts-expect-error — ver comentário acima sobre user_id
      user_id: "user-123",
      messages: [],
    };

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
      <div className="h-screen flex bg-background">
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
        />
        <ChatArea
          conversation={activeConversation || null}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
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
