import { Injectable, Inject } from '@nestjs/common';
import { RedisService } from '../infra/redis.service.js';
import { logger } from '../common/logging/logger.service.js';

export interface HistoryQuestion {
  id: string;
  question: string;
  timestamp: string;
  conversation_id: string;
  user_id: string;
}

@Injectable()
export class HistoryService {
  constructor(@Inject(RedisService) private readonly redis: RedisService) {
    logger.info({
      level: 'INFO',
      scope: 'HistoryService',
      message: 'HistoryService criado',
      redis_available: !!this.redis,
      redis_enabled: this.redis?.isEnabled,
    });
  }

  /**
   * Salva uma pergunta no histórico do usuário
   */
  async saveQuestion(
    question: string,
    userId: string,
    conversationId: string,
  ): Promise<void> {
    logger.info({
      level: 'INFO',
      scope: 'HistoryService',
      message: 'Tentando salvar pergunta no histórico',
      user_id: userId,
      conversation_id: conversationId,
      question: question,
      redis_enabled: this.redis.isEnabled,
    });

    if (!this.redis.isEnabled) {
      logger.warn({
        level: 'WARN',
        scope: 'HistoryService',
        message: 'Redis não disponível - pergunta não salva no histórico',
      });
      return;
    }

    try {
      const historyQuestion: HistoryQuestion = {
        id: crypto.randomUUID(),
        question: question.trim(),
        timestamp: new Date().toISOString(),
        conversation_id: conversationId,
        user_id: userId,
      };

      logger.info({
        level: 'INFO',
        scope: 'HistoryService',
        message: 'Criando pergunta no histórico',
        question_id: historyQuestion.id,
        question_key: `history:question:${historyQuestion.id}`,
        user_history_key: `history:user:${userId}`,
      });

      // Salva a pergunta individual
      const questionKey = `history:question:${historyQuestion.id}`;
      await this.redis.setEx(
        questionKey,
        86400 * 30,
        JSON.stringify(historyQuestion),
      ); // 30 dias

      // Adiciona à lista de perguntas do usuário
      const userHistoryKey = `history:user:${userId}`;
      await this.redis.appendList(userHistoryKey, historyQuestion.id);

      // Define expiração para a lista do usuário (30 dias)
      await this.redis.expire(userHistoryKey, 86400 * 30);

      logger.info({
        level: 'INFO',
        scope: 'HistoryService',
        message: 'Pergunta salva no histórico',
        question_id: historyQuestion.id,
        user_id: userId,
      });
    } catch (error) {
      logger.error({
        level: 'ERROR',
        scope: 'HistoryService',
        message: 'Erro ao salvar pergunta no histórico',
        error: (error as Error).message,
        user_id: userId,
      });
    }
  }

  /**
   * Recupera o histórico de perguntas de um usuário
   */
  async getUserHistory(
    userId: string,
    limit: number = 20,
  ): Promise<HistoryQuestion[]> {
    logger.info({
      level: 'INFO',
      scope: 'HistoryService',
      message: 'Buscando histórico do usuário',
      user_id: userId,
      limit: limit,
      redis_enabled: this.redis.isEnabled,
    });

    if (!this.redis.isEnabled) {
      logger.warn({
        level: 'WARN',
        scope: 'HistoryService',
        message: 'Redis não disponível - retornando histórico vazio',
      });
      return [];
    }

    try {
      const userHistoryKey = `history:user:${userId}`;

      // Pega os IDs das perguntas mais recentes
      const questionIds = await this.redis.lrangeTail(userHistoryKey, limit);

      if (questionIds.length === 0) {
        return [];
      }

      // Recupera as perguntas individuais
      const questions: HistoryQuestion[] = [];
      for (const questionId of questionIds) {
        const questionKey = `history:question:${questionId}`;
        const questionData = await this.redis.get(questionKey);

        if (questionData) {
          try {
            const question = JSON.parse(questionData) as HistoryQuestion;
            questions.push(question);
          } catch (parseError) {
            logger.warn({
              level: 'WARN',
              scope: 'HistoryService',
              message: 'Erro ao fazer parse da pergunta do histórico',
              question_id: questionId,
              error: (parseError as Error).message,
            });
          }
        }
      }

      // Ordena por timestamp (mais recente primeiro)
      questions.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      logger.info({
        level: 'INFO',
        scope: 'HistoryService',
        message: 'Histórico de perguntas recuperado',
        user_id: userId,
        count: questions.length,
      });

      return questions;
    } catch (error) {
      logger.error({
        level: 'ERROR',
        scope: 'HistoryService',
        message: 'Erro ao recuperar histórico de perguntas',
        error: (error as Error).message,
        user_id: userId,
      });
      return [];
    }
  }

  /**
   * Remove uma pergunta específica do histórico
   */
  async removeQuestion(questionId: string, userId: string): Promise<boolean> {
    if (!this.redis.isEnabled) {
      return false;
    }

    try {
      const questionKey = `history:question:${questionId}`;
      const questionData = await this.redis.get(questionKey);

      if (!questionData) {
        return false;
      }

      const question = JSON.parse(questionData) as HistoryQuestion;

      // Verifica se a pergunta pertence ao usuário
      if (question.user_id !== userId) {
        logger.warn({
          level: 'WARN',
          scope: 'HistoryService',
          message: 'Tentativa de remover pergunta de outro usuário',
          question_id: questionId,
          user_id: userId,
        });
        return false;
      }

      // Remove a pergunta individual
      await this.redis.del(questionKey);

      // Remove da lista do usuário (isso é mais complexo no Redis, mas por simplicidade vamos deixar)
      // Em uma implementação mais robusta, usaríamos um Set ou Hash

      logger.info({
        level: 'INFO',
        scope: 'HistoryService',
        message: 'Pergunta removida do histórico',
        question_id: questionId,
        user_id: userId,
      });

      return true;
    } catch (error) {
      logger.error({
        level: 'ERROR',
        scope: 'HistoryService',
        message: 'Erro ao remover pergunta do histórico',
        error: (error as Error).message,
        question_id: questionId,
        user_id: userId,
      });
      return false;
    }
  }

  /**
   * Limpa todo o histórico de um usuário
   */
  async clearUserHistory(userId: string): Promise<boolean> {
    if (!this.redis.isEnabled) {
      return false;
    }

    try {
      const userHistoryKey = `history:user:${userId}`;
      const questionIds = await this.redis.lrangeTail(userHistoryKey, 1000); // Pega até 1000 perguntas

      // Remove todas as perguntas individuais
      for (const questionId of questionIds) {
        const questionKey = `history:question:${questionId}`;
        await this.redis.del(questionKey);
      }

      // Remove a lista do usuário
      await this.redis.del(userHistoryKey);

      logger.info({
        level: 'INFO',
        scope: 'HistoryService',
        message: 'Histórico do usuário limpo',
        user_id: userId,
        removed_count: questionIds.length,
      });

      return true;
    } catch (error) {
      logger.error({
        level: 'ERROR',
        scope: 'HistoryService',
        message: 'Erro ao limpar histórico do usuário',
        error: (error as Error).message,
        user_id: userId,
      });
      return false;
    }
  }
}
