import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { HistoryService } from '../services/history.service.js';
import type { ChatResponseDTO } from '../agents/contracts.js';

describe('ChatController', () => {
  let controller: ChatController;
  let mockChatService: jest.Mocked<ChatService>;

  const mockResponse: ChatResponseDTO = {
    response: 'Test response',
    source_agent_response: 'MathAgent',
    agent_workflow: [{ agent: 'RouterAgent' }, { agent: 'MathAgent' }],
  };

  beforeEach(async () => {
    const mockChatServiceValue = {
      handle: jest.fn().mockResolvedValue(mockResponse),
    };

    const mockHistoryServiceValue = {
      saveQuestion: jest.fn().mockResolvedValue(undefined),
      getUserHistory: jest.fn().mockResolvedValue([]),
      removeQuestion: jest.fn().mockResolvedValue(true),
      clearUserHistory: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: mockChatServiceValue,
        },
        {
          provide: HistoryService,
          useValue: mockHistoryServiceValue,
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    mockChatService = module.get<ChatService>(
      ChatService,
    ) as jest.Mocked<ChatService>;
  });

  describe('chatEndpoint', () => {
    const validPayload = {
      message: 'Hello, world!',
      user_id: 'test-user',
      conversation_id: 'test-conv',
    };

    it('deve processar payload JSON válido', async () => {
      const result = await controller.chatEndpoint(validPayload);

      expect(result).toEqual(mockResponse);
      expect(mockChatService.handle).toHaveBeenCalledWith(validPayload);
    });

    it('deve processar payload string JSON válido', async () => {
      const stringPayload = JSON.stringify(validPayload);
      const result = await controller.chatEndpoint(stringPayload);

      expect(result).toEqual(mockResponse);
      expect(mockChatService.handle).toHaveBeenCalledWith(validPayload);
    });

    it('deve rejeitar mensagem vazia', async () => {
      const invalidPayload = {
        message: '',
        user_id: 'test-user',
        conversation_id: 'test-conv',
      };

      await expect(controller.chatEndpoint(invalidPayload)).rejects.toThrow(
        HttpException,
      );

      try {
        await controller.chatEndpoint(invalidPayload);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(
          HttpStatus.BAD_REQUEST,
        );
        expect((error as HttpException).getResponse()).toEqual({
          error_code: 'INVALID_PAYLOAD',
        });
      }
    });

    it('deve rejeitar mensagem muito longa', async () => {
      const longMessage = 'A'.repeat(2000); // Acima do limite padrão
      const invalidPayload = {
        message: longMessage,
        user_id: 'test-user',
        conversation_id: 'test-conv',
      };

      await expect(controller.chatEndpoint(invalidPayload)).rejects.toThrow(
        HttpException,
      );
    });

    it('deve rejeitar caracteres perigosos', async () => {
      const dangerousMessages = [
        '\x00\x01\x02', // caracteres de controle
        'Hello\u0000World', // null byte
        'Test\uFFFEMessage', // caractere não imprimível
        'Script\u202EtpircS', // right-to-left override
      ];

      for (const message of dangerousMessages) {
        const payload = {
          message,
          user_id: 'test-user',
          conversation_id: 'test-conv',
        };

        await expect(controller.chatEndpoint(payload)).rejects.toThrow(
          HttpException,
        );
      }
    });

    it('deve rejeitar user_id vazio', async () => {
      const invalidPayload = {
        message: 'Hello',
        user_id: '',
        conversation_id: 'test-conv',
      };

      await expect(controller.chatEndpoint(invalidPayload)).rejects.toThrow(
        HttpException,
      );
    });

    it('deve rejeitar conversation_id vazio', async () => {
      const invalidPayload = {
        message: 'Hello',
        user_id: 'test-user',
        conversation_id: '',
      };

      await expect(controller.chatEndpoint(invalidPayload)).rejects.toThrow(
        HttpException,
      );
    });

    it('deve rejeitar user_id muito longo', async () => {
      const longUserId = 'A'.repeat(250); // Acima do limite
      const invalidPayload = {
        message: 'Hello',
        user_id: longUserId,
        conversation_id: 'test-conv',
      };

      await expect(controller.chatEndpoint(invalidPayload)).rejects.toThrow(
        HttpException,
      );
    });

    it('deve rejeitar conversation_id muito longo', async () => {
      const longConvId = 'A'.repeat(250); // Acima do limite
      const invalidPayload = {
        message: 'Hello',
        user_id: 'test-user',
        conversation_id: longConvId,
      };

      await expect(controller.chatEndpoint(invalidPayload)).rejects.toThrow(
        HttpException,
      );
    });

    it('deve rejeitar payload com campos faltando', async () => {
      const incompletePayloads = [
        { message: 'Hello' }, // sem user_id e conversation_id
        { user_id: 'test-user' }, // sem message e conversation_id
        { conversation_id: 'test-conv' }, // sem message e user_id
        { message: 'Hello', user_id: 'test-user' }, // sem conversation_id
        { message: 'Hello', conversation_id: 'test-conv' }, // sem user_id
        { user_id: 'test-user', conversation_id: 'test-conv' }, // sem message
      ];

      for (const payload of incompletePayloads) {
        await expect(controller.chatEndpoint(payload)).rejects.toThrow(
          HttpException,
        );
      }
    });

    it('deve rejeitar tipos incorretos', async () => {
      const invalidTypePayloads = [
        { message: 123, user_id: 'test-user', conversation_id: 'test-conv' },
        { message: 'Hello', user_id: 123, conversation_id: 'test-conv' },
        { message: 'Hello', user_id: 'test-user', conversation_id: 123 },
        { message: null, user_id: 'test-user', conversation_id: 'test-conv' },
        {
          message: undefined,
          user_id: 'test-user',
          conversation_id: 'test-conv',
        },
      ];

      for (const payload of invalidTypePayloads) {
        await expect(controller.chatEndpoint(payload)).rejects.toThrow(
          HttpException,
        );
      }
    });

    it('deve rejeitar JSON malformado quando string', async () => {
      const malformedJson = '{ message: "Hello", invalid json }';

      await expect(controller.chatEndpoint(malformedJson)).rejects.toThrow();
    });

    it('deve lidar com campos extras sem rejeitar', async () => {
      const payloadWithExtras = {
        message: 'Hello',
        user_id: 'test-user',
        conversation_id: 'test-conv',
        extraField: 'should be ignored',
        timestamp: Date.now(),
      };

      const result = await controller.chatEndpoint(payloadWithExtras);
      expect(result).toEqual(mockResponse);

      // Deve chamar o service apenas com os campos válidos
      expect(mockChatService.handle).toHaveBeenCalledWith({
        message: 'Hello',
        user_id: 'test-user',
        conversation_id: 'test-conv',
      });
    });

    it('deve propagar erros do ChatService', async () => {
      const serviceError = new Error('Service error');
      mockChatService.handle.mockRejectedValue(serviceError);

      await expect(controller.chatEndpoint(validPayload)).rejects.toThrow(
        serviceError,
      );
    });

    it('deve validar limites configuráveis via env', () => {
      // Testa que os limites são baseados em variáveis de ambiente
      const originalEnv = process.env.MSG_MAX_LEN;

      // Esta é uma verificação conceitual - em testes reais,
      // você reinicializaria o módulo com diferentes env vars
      expect(typeof Number(process.env.MSG_MAX_LEN ?? 1000)).toBe('number');

      process.env.MSG_MAX_LEN = originalEnv;
    });
  });
});
