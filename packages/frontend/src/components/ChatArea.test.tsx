import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatArea } from "./ChatArea";
import type { ReactNode } from "react";
import type { Conversation } from "../types/api";

// Mock dos componentes do Radix UI
vi.mock("./ui/scroll-area", () => ({
  ScrollArea: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock("./ui/badge", () => ({
  Badge: ({ children, className }: { children: ReactNode; className?: string }) => (
    <span className={className}>{children}</span>
  ),
}));

// Mock dos ícones do Lucide
vi.mock("lucide-react", () => ({
  MessageCircle: () => <div data-testid="message-circle-icon" />,
  Brain: () => <div data-testid="brain-icon" />,
  Calculator: () => <div data-testid="calculator-icon" />,
  Route: () => <div data-testid="route-icon" />,
}));

// Mock do Message component
vi.mock("./Message", () => ({
  Message: ({ message }: { message: { id: string; content: string; isUser: boolean } }) => (
    <div data-testid={`message-${message.id}`}>
      <div>{message.content}</div>
      <div>{message.isUser ? "user" : "assistant"}</div>
    </div>
  ),
}));

// Mock do MessageInput component
vi.mock("./MessageInput", () => ({
  MessageInput: ({
    onSendMessage,
    disabled,
  }: {
    onSendMessage: (msg: string) => void;
    disabled?: boolean;
  }) => (
    <div data-testid="message-input">
      <input
        data-testid="message-input-field"
        disabled={disabled}
        placeholder="Digite sua mensagem..."
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            const target = e.target as HTMLInputElement;
            if (target.value.trim()) {
              onSendMessage(target.value.trim());
              target.value = "";
            }
          }
        }}
      />
    </div>
  ),
}));

describe("ChatArea", () => {
  const mockOnSendMessage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Estado sem conversa selecionada", () => {
    it("deve renderizar mensagem de seleção quando não há conversa", () => {
      render(<ChatArea conversation={null} onSendMessage={mockOnSendMessage} isLoading={false} />);

      expect(screen.getByText("Selecione uma conversa")).toBeInTheDocument();
      expect(screen.getByText(/Escolha uma conversa da lista/)).toBeInTheDocument();
      expect(screen.getByText("Agentes disponíveis:")).toBeInTheDocument();
      expect(screen.getByTestId("message-circle-icon")).toBeInTheDocument();
    });

    it("deve mostrar badges dos agentes disponíveis", () => {
      render(<ChatArea conversation={null} onSendMessage={mockOnSendMessage} isLoading={false} />);

      expect(screen.getByText("RouterAgent")).toBeInTheDocument();
      expect(screen.getByText("KnowledgeAgent")).toBeInTheDocument();
      expect(screen.getByText("MathAgent")).toBeInTheDocument();
      expect(screen.getByTestId("route-icon")).toBeInTheDocument();
      expect(screen.getByTestId("brain-icon")).toBeInTheDocument();
      expect(screen.getByTestId("calculator-icon")).toBeInTheDocument();
    });

    it("deve adaptar layout para mobile", () => {
      render(
        <ChatArea
          conversation={null}
          onSendMessage={mockOnSendMessage}
          isLoading={false}
          isMobile={true}
        />,
      );

      expect(screen.getByText("Selecione uma conversa")).toBeInTheDocument();
      expect(screen.getByText(/Volte à lista e escolha uma conversa/)).toBeInTheDocument();
    });
  });

  describe("Estado com conversa ativa", () => {
    const mockConversation: Conversation = {
      id: "conv-1",
      title: "Test Conversation",
      lastMessageAt: new Date("2024-01-01T10:00:00Z"),
      messages: [
        {
          id: "msg-1",
          content: "Hello, how are you?",
          timestamp: new Date("2024-01-01T10:00:00Z"),
          isUser: true,
        },
        {
          id: "msg-2",
          content: "I am doing well, thank you! How can I help you today?",
          timestamp: new Date("2024-01-01T10:01:00Z"),
          isUser: false,
          agentWorkflow: [
            { agent: "RouterAgent", decision: "KnowledgeAgent" },
            { agent: "KnowledgeAgent" },
          ],
        },
      ],
    };

    it("deve renderizar header da conversa (desktop)", () => {
      render(
        <ChatArea
          conversation={mockConversation}
          onSendMessage={mockOnSendMessage}
          isLoading={false}
          isMobile={false}
        />,
      );

      expect(screen.getByText("Test Conversation")).toBeInTheDocument();
      expect(screen.getByText(/2 mensagens • ID: conv-1/)).toBeInTheDocument();
      expect(screen.getByText("Router")).toBeInTheDocument();
      expect(screen.getByText("Knowledge")).toBeInTheDocument();
      expect(screen.getByText("Math")).toBeInTheDocument();
    });

    it("não deve renderizar header no mobile", () => {
      render(
        <ChatArea
          conversation={mockConversation}
          onSendMessage={mockOnSendMessage}
          isLoading={false}
          isMobile={true}
        />,
      );

      expect(screen.queryByText("Test Conversation")).not.toBeInTheDocument();
      expect(screen.queryByText(/2 mensagens • ID: conv-1/)).not.toBeInTheDocument();
    });

    it("deve renderizar todas as mensagens", () => {
      render(
        <ChatArea
          conversation={mockConversation}
          onSendMessage={mockOnSendMessage}
          isLoading={false}
        />,
      );

      expect(screen.getByTestId("message-msg-1")).toBeInTheDocument();
      expect(screen.getByTestId("message-msg-2")).toBeInTheDocument();
      expect(screen.getByText("Hello, how are you?")).toBeInTheDocument();
      expect(
        screen.getByText("I am doing well, thank you! How can I help you today?"),
      ).toBeInTheDocument();
    });

    it("deve renderizar campo de entrada de mensagem", () => {
      render(
        <ChatArea
          conversation={mockConversation}
          onSendMessage={mockOnSendMessage}
          isLoading={false}
        />,
      );

      expect(screen.getByTestId("message-input")).toBeInTheDocument();
      expect(screen.getByTestId("message-input-field")).toBeInTheDocument();
    });

    it("deve chamar onSendMessage quando usuário envia mensagem", async () => {
      const user = userEvent.setup();

      render(
        <ChatArea
          conversation={mockConversation}
          onSendMessage={mockOnSendMessage}
          isLoading={false}
        />,
      );

      const input = screen.getByTestId("message-input-field");
      await user.type(input, "Test message");
      await user.keyboard("{Enter}");

      expect(mockOnSendMessage).toHaveBeenCalledWith("Test message");
    });

    it("deve desabilitar entrada quando está carregando", () => {
      render(
        <ChatArea
          conversation={mockConversation}
          onSendMessage={mockOnSendMessage}
          isLoading={true}
        />,
      );

      const input = screen.getByTestId("message-input-field");
      expect(input).toBeDisabled();
    });
  });

  describe("Estado de carregamento", () => {
    const emptyConversation: Conversation = {
      id: "conv-1",
      title: "Empty Conversation",
      lastMessageAt: new Date(),
      messages: [],
    };

    it("deve mostrar animação de loading", () => {
      render(
        <ChatArea
          conversation={emptyConversation}
          onSendMessage={mockOnSendMessage}
          isLoading={true}
        />,
      );

      const loadingDots = screen.getAllByText("", { selector: ".animate-bounce" });
      expect(loadingDots).toHaveLength(3);
    });

    it("deve adaptar tamanho do loading para mobile", () => {
      const { container } = render(
        <ChatArea
          conversation={emptyConversation}
          onSendMessage={mockOnSendMessage}
          isLoading={true}
          isMobile={true}
        />,
      );

      const loadingContainer = container.querySelector(".w-10.h-10");
      expect(loadingContainer).toBeInTheDocument();
    });
  });

  describe("Conversa vazia", () => {
    const emptyConversation: Conversation = {
      id: "conv-1",
      title: "Empty Conversation",
      lastMessageAt: new Date(),
      messages: [],
    };

    it("deve mostrar mensagem de boas-vindas", () => {
      render(
        <ChatArea
          conversation={emptyConversation}
          onSendMessage={mockOnSendMessage}
          isLoading={false}
        />,
      );

      expect(screen.getByText("Inicie uma conversa! Você pode:")).toBeInTheDocument();
      expect(screen.getByText(/Qual a taxa da maquininha/)).toBeInTheDocument();
      expect(screen.getByText(/Quanto é 65 x 3.11/)).toBeInTheDocument();
      expect(screen.getByText(/Posso usar meu telefone como maquininha/)).toBeInTheDocument();
    });
  });

  describe("Scroll automático", () => {
    const conversationWithManyMessages: Conversation = {
      id: "conv-1",
      title: "Long Conversation",
      lastMessageAt: new Date(),
      messages: Array.from({ length: 10 }, (_, i) => ({
        id: `msg-${i}`,
        content: `Message ${i}`,
        timestamp: new Date(),
        isUser: i % 2 === 0,
      })),
    };

    it("deve ter referência para scroll automático", () => {
      render(
        <ChatArea
          conversation={conversationWithManyMessages}
          onSendMessage={mockOnSendMessage}
          isLoading={false}
        />,
      );

      // Verifica se o componente foi renderizado (o scroll é tratado via useEffect)
      expect(screen.getByTestId("message-msg-0")).toBeInTheDocument();
      expect(screen.getByTestId("message-msg-9")).toBeInTheDocument();
    });

    it("deve acionar scroll quando mensagens mudam", async () => {
      const { rerender } = render(
        <ChatArea
          conversation={conversationWithManyMessages}
          onSendMessage={mockOnSendMessage}
          isLoading={false}
        />,
      );

      const updatedConversation = {
        ...conversationWithManyMessages,
        messages: [
          ...conversationWithManyMessages.messages,
          {
            id: "msg-new",
            content: "New message",
            timestamp: new Date(),
            isUser: true,
          },
        ],
      };

      rerender(
        <ChatArea
          conversation={updatedConversation}
          onSendMessage={mockOnSendMessage}
          isLoading={false}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId("message-msg-new")).toBeInTheDocument();
      });
    });

    it("deve acionar scroll quando loading muda", async () => {
      const { rerender } = render(
        <ChatArea
          conversation={conversationWithManyMessages}
          onSendMessage={mockOnSendMessage}
          isLoading={true}
        />,
      );

      rerender(
        <ChatArea
          conversation={conversationWithManyMessages}
          onSendMessage={mockOnSendMessage}
          isLoading={false}
        />,
      );

      // O scroll é acionado via useEffect, apenas verificamos que o componente reage
      expect(screen.queryByText("Processando...")).not.toBeInTheDocument();
    });
  });

  describe("Responsividade", () => {
    const mockConversation: Conversation = {
      id: "conv-1",
      title: "Test Conversation",
      lastMessageAt: new Date(),
      messages: [
        {
          id: "msg-1",
          content: "Test message",
          timestamp: new Date(),
          isUser: true,
        },
      ],
    };

    it("deve aplicar classes mobile apropriadas", () => {
      const { container } = render(
        <ChatArea
          conversation={mockConversation}
          onSendMessage={mockOnSendMessage}
          isLoading={false}
          isMobile={true}
        />,
      );

      // Verifica se classes mobile são aplicadas
      const mobileElements = container.querySelectorAll(".p-3");
      expect(mobileElements.length).toBeGreaterThan(0);
    });

    it("deve aplicar classes desktop apropriadas", () => {
      const { container } = render(
        <ChatArea
          conversation={mockConversation}
          onSendMessage={mockOnSendMessage}
          isLoading={false}
          isMobile={false}
        />,
      );

      // Verifica se classes desktop são aplicadas
      const desktopElements = container.querySelectorAll(".p-4");
      expect(desktopElements.length).toBeGreaterThan(0);
    });
  });

  describe("Acessibilidade", () => {
    const mockConversation: Conversation = {
      id: "conv-1",
      title: "Test Conversation",
      lastMessageAt: new Date(),
      messages: [],
    };

    it("deve ser acessível via teclado", async () => {
      const user = userEvent.setup();

      render(
        <ChatArea
          conversation={mockConversation}
          onSendMessage={mockOnSendMessage}
          isLoading={false}
        />,
      );

      const input = screen.getByTestId("message-input-field");
      await user.click(input);
      expect(input).toHaveFocus();
    });

    it("deve ter estrutura semântica adequada", () => {
      render(
        <ChatArea
          conversation={mockConversation}
          onSendMessage={mockOnSendMessage}
          isLoading={false}
        />,
      );

      // Verifica se elementos importantes estão presentes
      expect(screen.getByTestId("message-input")).toBeInTheDocument();
    });
  });
});
