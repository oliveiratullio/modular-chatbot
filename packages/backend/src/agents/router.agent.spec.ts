import { RouterAgent } from './router.agent.js';
import type { AgentContext } from './contracts.js';

describe('RouterAgent', () => {
  let routerAgent: RouterAgent;
  let mockContext: AgentContext;

  beforeEach(() => {
    routerAgent = new RouterAgent();
    mockContext = {
      user_id: 'test-user',
      conversation_id: 'test-conv',
    };
  });

  describe('MathAgent routing (casos claros)', () => {
    it('deve rotear expressões matemáticas simples para MathAgent', async () => {
      const testCases = [
        '2 + 3',
        '10 - 5',
        '4 * 7',
        '20 / 4',
        '2^3',
        '5 x 6',
        'quanto é 2 + 2?',
        'calcule 15 * 3',
        'Quanto é 100 - 25?',
      ];

      for (const message of testCases) {
        const result = await routerAgent.route(message, mockContext);
        expect(result).toEqual({ agent: 'MathAgent' });
      }
    });

    it('deve rotear expressões com múltiplos operadores para MathAgent', async () => {
      const testCases = [
        '2 + 3 * 4',
        '(10 + 5) / 3',
        '2^3 + 4',
        '100 - 20 + 5',
        'calculate 2 + 3 - 1',
      ];

      for (const message of testCases) {
        const result = await routerAgent.route(message, mockContext);
        expect(result).toEqual({ agent: 'MathAgent' });
      }
    });

    it('deve rotear expressões com decimais para MathAgent', async () => {
      const testCases = [
        '2.5 + 1.7',
        '10.99 * 2',
        '3,14 + 1',
        'quanto é 65.5 x 3.11?',
      ];

      for (const message of testCases) {
        const result = await routerAgent.route(message, mockContext);
        expect(result).toEqual({ agent: 'MathAgent' });
      }
    });
  });

  describe('KnowledgeAgent routing (casos claros)', () => {
    it('deve rotear perguntas sobre produtos/serviços para KnowledgeAgent', async () => {
      const testCases = [
        'Qual a taxa da maquininha?',
        'Como funciona o Pix?',
        'Posso usar meu telefone como maquininha?',
        'Quais são os horários de atendimento?',
        'Como faço para solicitar uma maquininha?',
        'Onde posso encontrar ajuda?',
      ];

      for (const message of testCases) {
        const result = await routerAgent.route(message, mockContext);
        expect(result).toEqual({ agent: 'KnowledgeAgent' });
      }
    });

    it('deve rotear textos sem números nem operadores para KnowledgeAgent', async () => {
      const testCases = [
        'Olá, como posso ajudar?',
        'Preciso de suporte',
        'Tenho uma dúvida',
        'Obrigado pela ajuda',
        'Como está o clima?',
      ];

      for (const message of testCases) {
        const result = await routerAgent.route(message, mockContext);
        expect(result).toEqual({ agent: 'KnowledgeAgent' });
      }
    });
  });

  describe('Casos ambíguos e edge cases', () => {
    it('deve rotear mensagens com operadores mas sem números para KnowledgeAgent', async () => {
      const testCases = [
        'Qual o diferencial da empresa?',
        'Como é o processo de contratação?',
        'Vantagens e desvantagens',
        'Prós e contras',
        'Mais ou menos assim',
        'Taxa + IOF',
        'Débito / Crédito',
      ];

      for (const message of testCases) {
        const result = await routerAgent.route(message, mockContext);
        expect(result).toEqual({ agent: 'KnowledgeAgent' });
      }
    });

    it('deve lidar com strings vazias e whitespace', async () => {
      const testCases = ['', '   ', '\n\t', '   \n   '];

      for (const message of testCases) {
        const result = await routerAgent.route(message, mockContext);
        expect(result).toEqual({ agent: 'KnowledgeAgent' });
      }
    });

    it('deve lidar com caracteres especiais e emojis', async () => {
      const testCases = [
        '🤔 Como funciona?',
        '💰 Quanto custa?',
        'Olá! 👋',
        '⭐⭐⭐⭐⭐',
        '2 + 3 = 5 ✅',
        '❓❓❓',
      ];

      // Apenas o caso com operação matemática deve ir para MathAgent
      const mathCase = '2 + 3 = 5 ✅';
      const mathResult = await routerAgent.route(mathCase, mockContext);
      expect(mathResult).toEqual({ agent: 'MathAgent' });

      // Outros casos vão para KnowledgeAgent
      const nonMathCases = testCases.filter((msg) => msg !== mathCase);
      for (const message of nonMathCases) {
        const result = await routerAgent.route(message, mockContext);
        expect(result).toEqual({ agent: 'KnowledgeAgent' });
      }
    });

    it('deve rotear mensagens com operadores matemáticos em contextos não-matemáticos', async () => {
      const testCases = [
        'O que é C++?',
        'Como usar CTRL+C?',
        'Diferença entre A+ e A-?',
        'O símbolo * significa o que?',
        'Como digitar / no teclado?',
      ];

      for (const message of testCases) {
        const result = await routerAgent.route(message, mockContext);
        expect(result).toEqual({ agent: 'KnowledgeAgent' });
      }
    });

    it('deve ser case-insensitive para operador x', async () => {
      const testCases = [
        '2 x 3',
        '2 X 3',
        '5 x 7',
        '5 X 7',
        'quanto é 4 x 8?',
        'QUANTO É 4 X 8?',
      ];

      for (const message of testCases) {
        const result = await routerAgent.route(message, mockContext);
        expect(result).toEqual({ agent: 'MathAgent' });
      }
    });
  });

  describe('Performance e robustez', () => {
    it('deve lidar com mensagens muito longas', async () => {
      const longMessage = 'A'.repeat(10000) + ' 2 + 3 ' + 'B'.repeat(10000);
      const result = await routerAgent.route(longMessage, mockContext);
      expect(result).toEqual({ agent: 'MathAgent' });
    });

    it('deve ser rápido para centenas de mensagens', async () => {
      const start = Date.now();
      const promises = [];

      for (let i = 0; i < 1000; i++) {
        const message = i % 2 === 0 ? `${i} + ${i + 1}` : `Pergunta ${i}`;
        promises.push(routerAgent.route(message, mockContext));
      }

      await Promise.all(promises);
      const elapsed = Date.now() - start;

      // Deve processar 1000 mensagens em menos de 100ms
      expect(elapsed).toBeLessThan(100);
    });

    it('deve manter contexto imutável', async () => {
      const originalContext = { ...mockContext };
      await routerAgent.route('2 + 3', mockContext);
      expect(mockContext).toEqual(originalContext);
    });
  });
});
