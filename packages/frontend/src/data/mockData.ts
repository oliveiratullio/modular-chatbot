export interface Message {
  id: string;
  content: string;
  timestamp: Date;
  isUser: boolean;
  agentName?: string;
  agentId?: string;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  lastMessageTime: Date;
  messages: Message[];
}

export const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    title: "Suporte Técnico",
    lastMessage: "Como posso ajudar com sua configuração?",
    lastMessageTime: new Date(2024, 7, 26, 14, 30),
    messages: [
      {
        id: "msg-1",
        content: "Olá! Estou com problemas para configurar meu sistema.",
        timestamp: new Date(2024, 7, 26, 14, 15),
        isUser: true,
      },
      {
        id: "msg-2",
        content:
          "Olá! Sou o João do suporte técnico. Vou te ajudar com essa configuração. Pode me descrever qual erro está acontecendo?",
        timestamp: new Date(2024, 7, 26, 14, 16),
        isUser: false,
        agentName: "João Silva",
        agentId: "agent-001",
      },
      {
        id: "msg-3",
        content: "O sistema não está conectando com o banco de dados.",
        timestamp: new Date(2024, 7, 26, 14, 17),
        isUser: true,
      },
      {
        id: "msg-4",
        content:
          "Entendi. Vamos verificar suas configurações de conexão. Você pode acessar o arquivo de configuração e me enviar os parâmetros de conexão (sem as senhas)?",
        timestamp: new Date(2024, 7, 26, 14, 18),
        isUser: false,
        agentName: "João Silva",
        agentId: "agent-001",
      },
      {
        id: "msg-5",
        content: "Claro! Host: localhost, Port: 5432, Database: myapp_db",
        timestamp: new Date(2024, 7, 26, 14, 20),
        isUser: true,
      },
      {
        id: "msg-6",
        content: "Como posso ajudar com sua configuração?",
        timestamp: new Date(2024, 7, 26, 14, 30),
        isUser: false,
        agentName: "Maria Santos",
        agentId: "agent-002",
      },
    ],
  },
  {
    id: "conv-2",
    title: "Dúvidas sobre Produto",
    lastMessage: "O plano premium inclui todas essas funcionalidades.",
    lastMessageTime: new Date(2024, 7, 26, 13, 45),
    messages: [
      {
        id: "msg-7",
        content: "Gostaria de saber mais sobre os planos disponíveis.",
        timestamp: new Date(2024, 7, 26, 13, 30),
        isUser: true,
      },
      {
        id: "msg-8",
        content:
          "Olá! Sou a Ana do time comercial. Temos três planos: Básico, Pro e Premium. Cada um com funcionalidades específicas. Qual seria seu interesse principal?",
        timestamp: new Date(2024, 7, 26, 13, 32),
        isUser: false,
        agentName: "Ana Costa",
        agentId: "agent-003",
      },
      {
        id: "msg-9",
        content: "Preciso de integração com APIs externas e relatórios avançados.",
        timestamp: new Date(2024, 7, 26, 13, 35),
        isUser: true,
      },
      {
        id: "msg-10",
        content: "O plano premium inclui todas essas funcionalidades.",
        timestamp: new Date(2024, 7, 26, 13, 45),
        isUser: false,
        agentName: "Ana Costa",
        agentId: "agent-003",
      },
    ],
  },
  {
    id: "conv-3",
    title: "Problema de Faturamento",
    lastMessage: "Vou processar o reembolso agora mesmo.",
    lastMessageTime: new Date(2024, 7, 26, 12, 20),
    messages: [
      {
        id: "msg-11",
        content: "Fui cobrado em duplicidade este mês.",
        timestamp: new Date(2024, 7, 26, 12, 10),
        isUser: true,
      },
      {
        id: "msg-12",
        content:
          "Olá! Sou o Carlos do financeiro. Vou verificar sua conta imediatamente. Pode me informar o e-mail cadastrado?",
        timestamp: new Date(2024, 7, 26, 12, 12),
        isUser: false,
        agentName: "Carlos Oliveira",
        agentId: "agent-004",
      },
      {
        id: "msg-13",
        content: "usuario@email.com",
        timestamp: new Date(2024, 7, 26, 12, 13),
        isUser: true,
      },
      {
        id: "msg-14",
        content:
          "Encontrei o problema! Houve uma falha no sistema que gerou cobrança duplicada. Vou processar o reembolso agora mesmo.",
        timestamp: new Date(2024, 7, 26, 12, 20),
        isUser: false,
        agentName: "Carlos Oliveira",
        agentId: "agent-004",
      },
    ],
  },
];
