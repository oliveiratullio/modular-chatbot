import { MathAgent } from './math.agent.js';
import type { AgentContext, AgentStep } from './contracts.js';

describe('MathAgent', () => {
  let mathAgent: MathAgent;
  let mockContext: AgentContext;
  let mockTrail: AgentStep[];

  // Mock do logger para evitar logs nos testes
  beforeAll(() => {
    jest.mock('../common/logging/logger.service.js', () => ({
      logger: {
        info: jest.fn(),
        error: jest.fn(),
      },
    }));
  });

  beforeEach(() => {
    mathAgent = new MathAgent();
    mockContext = {
      user_id: 'test-user',
      conversation_id: 'test-conv',
    };
    mockTrail = [{ agent: 'RouterAgent' }];
  });

  describe('canHandle', () => {
    it('should reject messages without numbers or operators when non-math input is provided', async () => {
      const invalidExpressions = [
        'Como funciona a calculadora?',
        'Preciso de ajuda',
        'Qual a taxa da maquininha?',
        'abc + def', // sem números
        '123 456', // sem operadores
        'números: 1, 2, 3', // sem operadores matemáticos
        '',
        '   ',
      ];

      for (const message of invalidExpressions) {
        const result = await mathAgent.canHandle(message, mockContext);
        expect(result).toBe(false);
      }
    });
  });

  describe('handle - Valid expressions', () => {
    it('should calculate basic operations correctly when valid math expressions are provided', async () => {
      const testCases = [
        { input: '2 + 3', expected: 5 },
        { input: '10 - 4', expected: 6 },
        { input: '6 * 7', expected: 42 },
        { input: '20 / 4', expected: 5 },
        { input: '2 ^ 3', expected: 8 }, // convertido para **
        { input: '3 x 4', expected: 12 }, // convertido para *
        { input: '5 X 6', expected: 30 }, // case insensitive
      ];

      for (const { input, expected } of testCases) {
        const result = await mathAgent.handle(input, mockContext, mockTrail);
        expect(result.response).toBe(`Result: ${expected}`);
        expect(result.agent_workflow).toEqual([
          ...mockTrail,
          { agent: 'MathAgent' },
        ]);
      }
    });

    it('should calculate expressions with decimals correctly when decimal numbers are provided', async () => {
      const testCases = [
        { input: '2.5 + 1.5', expected: 4 },
        { input: '10.5 - 2.3', expected: 8.2 },
        { input: '3.14 * 2', expected: 6.28 },
        { input: '7.5 / 2.5', expected: 3 },
        { input: '1.1 + 2.2 + 3.3', expected: 6.6 },
      ];

      for (const { input, expected } of testCases) {
        const result = await mathAgent.handle(input, mockContext, mockTrail);
        expect(parseFloat(result.response.replace('Result: ', ''))).toBeCloseTo(
          expected,
          10,
        );
      }
    });

    it('deve respeitar precedência de operadores', async () => {
      const testCases = [
        { input: '2 + 3 * 4', expected: 14 }, // 2 + (3 * 4)
        { input: '10 - 6 / 2', expected: 7 }, // 10 - (6 / 2)
        { input: '(2 + 3) * 4', expected: 20 },
        { input: '10 / (2 + 3)', expected: 2 },
        { input: '2 * 3 + 4 * 5', expected: 26 },
      ];

      for (const { input, expected } of testCases) {
        const result = await mathAgent.handle(input, mockContext, mockTrail);
        expect(parseFloat(result.response.replace('Result: ', ''))).toBe(
          expected,
        );
      }
    });

    it('deve lidar com espaçamento irregular', async () => {
      const testCases = [
        { input: '2+3', expected: 5 },
        { input: '10  -  4', expected: 6 },
        { input: '  6 * 7  ', expected: 42 },
        { input: '\t20\n/\t4\n', expected: 5 },
        { input: '( 2 + 3 ) * 4', expected: 20 },
      ];

      for (const { input, expected } of testCases) {
        const result = await mathAgent.handle(input, mockContext, mockTrail);
        expect(parseFloat(result.response.replace('Result: ', ''))).toBe(
          expected,
        );
      }
    });
  });

  describe('handle - Expressões inválidas', () => {
    it('deve lançar erro para caracteres perigosos', async () => {
      const dangerousExpressions = [
        '2; alert(1)',
        '2 + require("fs")',
        '2 + process.exit()',
        '2 + console.log("hack")',
        '2 + Math.random()',
        '2 + new Date()',
      ];

      for (const expression of dangerousExpressions) {
        await expect(
          mathAgent.handle(expression, mockContext, mockTrail),
        ).rejects.toThrow();
      }
    });

    it('deve rejeitar expressões sem dígitos ou operadores', async () => {
      const invalidExpressions = ['+++', '(())', '   ', '', 'abc', '+ - * /'];

      for (const expression of invalidExpressions) {
        await expect(
          mathAgent.handle(expression, mockContext, mockTrail),
        ).rejects.toThrow('Invalid math expression');
      }
    });
  });

  describe('Precisão numérica', () => {
    it('deve manter precisão para decimais simples', async () => {
      const result = await mathAgent.handle(
        '0.1 + 0.2',
        mockContext,
        mockTrail,
      );
      // JavaScript: 0.1 + 0.2 = 0.30000000000000004
      const value = parseFloat(result.response.replace('Result: ', ''));
      expect(value).toBeCloseTo(0.3, 10);
    });

    it('deve lidar com números muito grandes', async () => {
      const result = await mathAgent.handle(
        '999999999 * 999999999',
        mockContext,
        mockTrail,
      );
      const value = parseFloat(result.response.replace('Result: ', ''));
      const expected = 999999999 * 999999999;
      expect(value).toBe(expected);
    });

    it('deve lidar com números muito pequenos', async () => {
      const result = await mathAgent.handle(
        '0.0001 * 0.0001',
        mockContext,
        mockTrail,
      );
      const value = parseFloat(result.response.replace('Result: ', ''));
      expect(value).toBeCloseTo(0.00000001, 10);
    });

    it('deve retornar Infinity para overflow', async () => {
      const result = await mathAgent.handle(
        '10^308 * 10',
        mockContext,
        mockTrail,
      );
      expect(result.response).toBe('Result: Infinity');
    });
  });

  describe('Funcionalidades de conversão', () => {
    it('deve converter x/X para *', async () => {
      const testCases = [
        { input: '2 x 3', expected: 6 },
        { input: '4 X 5', expected: 20 },
        { input: '2x3', expected: 6 },
        { input: '4X5', expected: 20 },
      ];

      for (const { input, expected } of testCases) {
        const result = await mathAgent.handle(input, mockContext, mockTrail);
        expect(parseFloat(result.response.replace('Result: ', ''))).toBe(
          expected,
        );
      }
    });

    it('deve converter ^ para **', async () => {
      const testCases = [
        { input: '2 ^ 3', expected: 8 },
        { input: '5 ^ 2', expected: 25 },
        { input: '3 ^ 4', expected: 81 },
        { input: '10 ^ 0', expected: 1 },
      ];

      for (const { input, expected } of testCases) {
        const result = await mathAgent.handle(input, mockContext, mockTrail);
        expect(parseFloat(result.response.replace('Result: ', ''))).toBe(
          expected,
        );
      }
    });
  });

  describe('Estrutura de resposta', () => {
    it('deve retornar estrutura correta com workflow', async () => {
      const customTrail: AgentStep[] = [
        { agent: 'RouterAgent' },
        { agent: 'MathAgent' },
      ];

      const result = await mathAgent.handle('2 + 3', mockContext, customTrail);

      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('source_agent_response');
      expect(result).toHaveProperty('agent_workflow');
      expect(result.agent_workflow).toEqual([
        ...customTrail,
        { agent: 'MathAgent' },
      ]);
      expect(result.source_agent_response).toMatch(/expression=/);
    });
  });

  describe('Performance', () => {
    it('deve ser rápido para cálculos simples', async () => {
      const start = Date.now();
      await mathAgent.handle('2 + 3', mockContext, mockTrail);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(10);
    });

    it('deve processar múltiplas operações rapidamente', async () => {
      const start = Date.now();
      const promises = [];

      for (let i = 0; i < 100; i++) {
        promises.push(
          mathAgent.handle(`${i} + ${i + 1}`, mockContext, mockTrail),
        );
      }

      await Promise.all(promises);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('Segurança', () => {
    it('deve rejeitar tentativas de code injection', async () => {
      const maliciousInputs = [
        '2 + (() => { console.log("hack"); return 0; })()',
        '2 + (function() { process.exit(); }())',
        '2; global.hacked = true',
        '2 + constructor.constructor("return process")()',
      ];

      for (const input of maliciousInputs) {
        await expect(
          mathAgent.handle(input, mockContext, mockTrail),
        ).rejects.toThrow();
      }
    });

    it('deve filtrar caracteres não-matemáticos', async () => {
      const result = await mathAgent.handle(
        'alert(2) + hack 3',
        mockContext,
        mockTrail,
      );
      // Deve filtrar e ficar apenas com "2 + 3"
      expect(result.response).toBe('Result: 5');
    });
  });
});
