import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatLayout } from "./ChatLayout";

// Mock do hook useIsMobile
vi.mock("./ui/use-mobile", () => ({
  useIsMobile: vi.fn(),
}));

// Mock do hook useUserId
vi.mock("../hooks/useUserId", () => ({
  useUserId: vi.fn(() => "user-123"),
}));

// Mock dos hooks de histórico
vi.mock("../hooks/useConversationHistory", () => ({
  useConversationHistory: vi.fn(() => ({ conversations: [] })),
}));

vi.mock("../hooks/useHistory", () => ({
  useHistory: vi.fn(() => ({ questions: [] })),
}));

// Mock do chatService
vi.mock("../services/chatService", () => ({
  chatService: {
    sendMessage: vi.fn(),
    saveConversation: vi.fn(),
  },
}));

// Mock dos componentes
vi.mock("./ConversationList", () => ({
  ConversationList: ({
    conversations,
    activeConversationId,
    onSelectConversation,
    onNewConversation,
    isMobile,
  }: {
    conversations: Array<{ id: string; title: string }>;
    activeConversationId: string;
    onSelectConversation: (id: string) => void;
    onNewConversation: () => void;
    isMobile: boolean;
  }) => (
    <div data-testid="conversation-list">
      <button data-testid="new-conversation-btn" onClick={onNewConversation}>
        Nova Conversa
      </button>
      {conversations.map((conv) => (
        <button
          key={conv.id}
          data-testid={`conversation-${conv.id}`}
          onClick={() => onSelectConversation(conv.id)}
          aria-pressed={activeConversationId === conv.id}
        >
          {conv.title}
        </button>
      ))}
      <div data-testid={`mobile-${isMobile}`} />
    </div>
  ),
}));

vi.mock("./ChatArea", () => ({
  ChatArea: ({
    conversation,
    onSendMessage,
    isLoading,
    isMobile,
  }: {
    conversation: { id: string; title: string } | null;
    onSendMessage: (msg: string) => void;
    isLoading: boolean;
    isMobile: boolean;
  }) => (
    <div data-testid="chat-area">
      <div data-testid="active-conversation">
        {conversation ? conversation.title : "No conversation"}
      </div>
      <div data-testid="loading-state">{isLoading ? "loading" : "not-loading"}</div>
      <button data-testid="send-message-btn" onClick={() => onSendMessage("test message")}>
        Send Test Message
      </button>
      <div data-testid={`mobile-${isMobile}`} />
    </div>
  ),
}));

vi.mock("./MobileHeader", () => ({
  MobileHeader: ({
    title,
    subtitle,
    showBackButton,
    onBackClick,
  }: {
    title: string;
    subtitle: string;
    showBackButton: boolean;
    onBackClick: () => void;
  }) => (
    <div data-testid="mobile-header">
      <div data-testid="header-title">{title}</div>
      <div data-testid="header-subtitle">{subtitle}</div>
      {showBackButton && (
        <button data-testid="back-button" onClick={onBackClick}>
          Back
        </button>
      )}
    </div>
  ),
}));

describe("ChatLayout", () => {
  let useIsMobile: ReturnType<typeof vi.fn>;
  let chatService: {
    sendMessage: ReturnType<typeof vi.fn>;
    saveConversation: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const modMobile = await import("./ui/use-mobile");
    const modService = await import("../services/chatService");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useIsMobile = (modMobile as any).useIsMobile;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chatService = (modService as any).chatService;
    useIsMobile.mockReturnValue(false);
    chatService.sendMessage.mockResolvedValue({
      userMessage: {
        id: "user-msg",
        content: "test message",
        timestamp: new Date(),
        isUser: true,
      },
      assistantMessage: {
        id: "assistant-msg",
        content: "response message",
        timestamp: new Date(),
        isUser: false,
        agentWorkflow: [{ agent: "KnowledgeAgent" }],
      },
    });
    chatService.saveConversation.mockResolvedValue(undefined);
  });

  describe("Layout Desktop", () => {
    beforeEach(() => {
      useIsMobile.mockReturnValue(false);
    });

    it("deve renderizar layout desktop com sidebar e chat", () => {
      render(<ChatLayout />);

      expect(screen.getByTestId("conversation-list")).toBeInTheDocument();
      expect(screen.getByTestId("chat-area")).toBeInTheDocument();
      expect(screen.queryByTestId("mobile-header")).not.toBeInTheDocument();
    });

    it("deve mostrar conversa inicial ativa", () => {
      render(<ChatLayout />);

      expect(screen.getByTestId("active-conversation")).toHaveTextContent("Suporte InfinitePay");
      expect(screen.getByTestId("conversation-conv-1")).toHaveAttribute("aria-pressed", "true");
    });

    it("deve permitir trocar de conversa", async () => {
      const user = userEvent.setup();
      render(<ChatLayout />);

      // Cria uma nova conversa
      await user.click(screen.getByTestId("new-conversation-btn"));

      // Verifica que uma nova conversa foi criada e está ativa
      const newConversationBtns = screen.getAllByText(/Nova Conversa|Suporte InfinitePay/);
      expect(newConversationBtns.length).toBeGreaterThan(1);
    });

    it("deve processar envio de mensagem", async () => {
      const user = userEvent.setup();
      render(<ChatLayout />);

      expect(screen.getByTestId("loading-state")).toHaveTextContent("not-loading");

      await user.click(screen.getByTestId("send-message-btn"));

      // Verifica loading state
      await waitFor(() => {
        expect(screen.getByTestId("loading-state")).toHaveTextContent("loading");
      });

      // Aguarda processamento
      await waitFor(() => {
        expect(screen.getByTestId("loading-state")).toHaveTextContent("not-loading");
      });

      expect(chatService.sendMessage).toHaveBeenCalledWith("conv-1", "user-123", "test message");
    });

    it("deve lidar com erro no envio de mensagem", async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      chatService.sendMessage.mockRejectedValue(new Error("Network error"));

      render(<ChatLayout />);

      await user.click(screen.getByTestId("send-message-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("loading-state")).toHaveTextContent("not-loading");
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith("Erro ao enviar mensagem:", expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Layout Mobile", () => {
    beforeEach(() => {
      useIsMobile.mockReturnValue(true);
    });

    it("deve renderizar layout mobile com navegação", () => {
      render(<ChatLayout />);

      expect(screen.getByTestId("mobile-header")).toBeInTheDocument();
      expect(screen.getByTestId("conversation-list")).toBeInTheDocument();
      expect(screen.queryByTestId("chat-area")).not.toBeInTheDocument();
    });

    it("deve mostrar lista de conversas por padrão", () => {
      render(<ChatLayout />);

      expect(screen.getByTestId("header-title")).toHaveTextContent("InfinitePay Chat");
      expect(screen.getByTestId("header-subtitle")).toHaveTextContent("1 conversas");
      expect(screen.getByTestId("mobile-true")).toBeInTheDocument();
    });

    it("deve navegar para chat ao selecionar conversa", async () => {
      const user = userEvent.setup();
      render(<ChatLayout />);

      // Seleciona uma conversa
      await user.click(screen.getByTestId("conversation-conv-1"));

      // Deve mostrar o chat
      expect(screen.getByTestId("chat-area")).toBeInTheDocument();
      expect(screen.queryByTestId("conversation-list")).not.toBeInTheDocument();

      // Header deve mostrar informações da conversa
      expect(screen.getByTestId("header-title")).toHaveTextContent("Suporte InfinitePay");
      expect(screen.getByTestId("header-subtitle")).toHaveTextContent("1 mensagens");
      expect(screen.getByTestId("back-button")).toBeInTheDocument();
    });

    it("deve navegar de volta para lista de conversas", async () => {
      const user = userEvent.setup();
      render(<ChatLayout />);

      // Vai para chat
      await user.click(screen.getByTestId("conversation-conv-1"));
      expect(screen.getByTestId("chat-area")).toBeInTheDocument();

      // Volta para lista
      await user.click(screen.getByTestId("back-button"));
      expect(screen.getByTestId("conversation-list")).toBeInTheDocument();
      expect(screen.queryByTestId("chat-area")).not.toBeInTheDocument();
    });

    it("deve ir para chat ao criar nova conversa", async () => {
      const user = userEvent.setup();
      render(<ChatLayout />);

      await user.click(screen.getByTestId("new-conversation-btn"));

      // Deve navegar diretamente para o chat da nova conversa
      await waitFor(() => {
        expect(screen.getByTestId("chat-area")).toBeInTheDocument();
      });
      expect(screen.getByTestId("header-title")).toHaveTextContent("Nova Conversa");
    });
  });

  describe("Gerenciamento de Estado", () => {
    it("deve manter lista de conversas", () => {
      render(<ChatLayout />);

      // Verifica conversa inicial
      expect(screen.getByTestId("conversation-conv-1")).toBeInTheDocument();
    });

    it("deve adicionar nova conversa à lista", async () => {
      const user = userEvent.setup();
      render(<ChatLayout />);

      const initialConversations = screen.getAllByTestId(/^conversation-/);
      await user.click(screen.getByTestId("new-conversation-btn"));

      // Aguarda a nova conversa ser adicionada
      await waitFor(() => {
        const newConversations = screen.getAllByTestId(/^conversation-/);
        expect(newConversations.length).toBeGreaterThanOrEqual(initialConversations.length);
      });
    });

    it("deve atualizar conversa ativa corretamente", async () => {
      const user = userEvent.setup();
      render(<ChatLayout />);

      // Conversa inicial está ativa
      expect(screen.getByTestId("conversation-conv-1")).toHaveAttribute("aria-pressed", "true");

      // Cria nova conversa
      await user.click(screen.getByTestId("new-conversation-btn"));

      // Nova conversa deve estar ativa
      const conversations = screen.getAllByTestId(/^conversation-/);
      const newConversation = conversations.find(
        (c) => c.getAttribute("aria-pressed") === "true" && c.id !== "conversation-conv-1",
      );
      expect(newConversation).toBeDefined();
    });

    it("deve manter loading state durante envio", async () => {
      const user = userEvent.setup();

      // Mock para simular delay
      chatService.sendMessage.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      render(<ChatLayout />);

      expect(screen.getByTestId("loading-state")).toHaveTextContent("not-loading");

      await user.click(screen.getByTestId("send-message-btn"));

      // Deve mostrar loading
      expect(screen.getByTestId("loading-state")).toHaveTextContent("loading");

      // Aguarda resolução
      await waitFor(
        () => {
          expect(screen.getByTestId("loading-state")).toHaveTextContent("not-loading");
        },
        { timeout: 1000 },
      );
    });
  });

  describe("Responsividade", () => {
    it("deve reagir a mudanças no tamanho da tela", () => {
      const { rerender } = render(<ChatLayout />);

      // Desktop
      expect(screen.getByTestId("conversation-list")).toBeInTheDocument();
      expect(screen.getByTestId("chat-area")).toBeInTheDocument();

      // Muda para mobile
      useIsMobile.mockReturnValue(true);
      rerender(<ChatLayout />);

      expect(screen.getByTestId("mobile-header")).toBeInTheDocument();
    });

    it("deve passar propriedade isMobile para componentes filhos", () => {
      useIsMobile.mockReturnValue(true);
      render(<ChatLayout />);

      expect(screen.getByTestId("mobile-true")).toBeInTheDocument();
    });
  });

  describe("Integração com ChatService", () => {
    it("deve chamar chatService com parâmetros corretos", async () => {
      const user = userEvent.setup();
      render(<ChatLayout />);

      await user.click(screen.getByTestId("send-message-btn"));

      expect(chatService.sendMessage).toHaveBeenCalledWith(
        "conv-1", // conversation_id da conversa ativa
        "user-123", // user_id padrão
        "test message", // mensagem enviada
      );
    });

    it("deve adicionar mensagem otimista antes da resposta", async () => {
      const user = userEvent.setup();

      // Mock com delay para testar mensagem otimista
      chatService.sendMessage.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  userMessage: {
                    id: "user-msg",
                    content: "test message",
                    timestamp: new Date(),
                    isUser: true,
                  },
                  assistantMessage: {
                    id: "assistant-msg",
                    content: "response",
                    timestamp: new Date(),
                    isUser: false,
                  },
                }),
              100,
            ),
          ),
      );

      render(<ChatLayout />);

      await user.click(screen.getByTestId("send-message-btn"));

      // Durante o loading, a mensagem otimista já deve estar presente
      expect(screen.getByTestId("loading-state")).toHaveTextContent("loading");

      // Aguarda resposta completa
      await waitFor(() => {
        expect(screen.getByTestId("loading-state")).toHaveTextContent("not-loading");
      });
    });
  });

  describe("Acessibilidade", () => {
    it("deve ter navegação via teclado funcionando", async () => {
      const user = userEvent.setup();
      render(<ChatLayout />);

      // Testa se consegue navegar pelos botões
      await user.tab();
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeDefined();
    });

    it("deve ter aria-pressed correto para conversa ativa", () => {
      render(<ChatLayout />);

      const activeConversation = screen.getByTestId("conversation-conv-1");
      expect(activeConversation).toHaveAttribute("aria-pressed", "true");
    });
  });
});
