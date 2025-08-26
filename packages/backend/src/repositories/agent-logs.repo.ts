import { Injectable } from '@nestjs/common';
import { RedisService } from '../infra/redis.service.js';
import { AgentName, type AgentStep } from '../agents/contracts.js';

export type AgentLog = {
  ts: string;
  level: 'INFO' | 'ERROR' | 'DEBUG';
  agent: 'RouterAgent' | 'KnowledgeAgent' | 'MathAgent' | 'HTTP' | string;
  message?: string;
  data?: Record<string, unknown>;
};

export type LogLevel = 'INFO' | 'ERROR' | 'WARN' | 'DEBUG';

export type AgentLogEntry = {
  // agora opcional; default = 'INFO'
  level?: LogLevel;
  agent: AgentName | 'HTTP' | string;

  // campos “clássicos”
  message?: string;
  error?: string;
  request_id?: string;
  extra?: Record<string, unknown>;
  ts?: string; // ISO
  conversation_id?: string;

  // ✅ campos que você está passando na chamada
  user_id?: string;
  workflow?: AgentStep[];
  source?: string;
  duration_ms?: number;
  created_at?: number; // epoch ms
};

function convoLogKey(conversationId: string) {
  return `agent:logs:${conversationId}`;
}

const LOG_TTL = Number(process.env.AGENT_LOG_TTL ?? 60 * 60 * 24 * 7);

function mapLevel(level: LogLevel): AgentLog['level'] {
  return level === 'WARN' ? 'INFO' : level;
}

@Injectable()
export class AgentLogsRepository {
  private readonly globalKey: string;

  constructor(private readonly redis: RedisService) {
    const ns = process.env.REDIS_NAMESPACE ?? 'app';
    this.globalKey = `${ns}:logs:agent`;
  }

  /** Compat: log por conversa (estrutura antiga) */
  async push(conversationId: string, log: AgentLog): Promise<void> {
    const key = convoLogKey(conversationId);
    await this.redis.appendList(key, JSON.stringify(log));
    await this.redis.expire(key, LOG_TTL);
  }

  async tail(conversationId: string, count = 100): Promise<AgentLog[]> {
    const key = convoLogKey(conversationId);
    const raw = await this.redis.lrangeTail(key, count);
    return raw.map((s) => JSON.parse(s) as AgentLog);
  }

  /**
   * Log genérico: sempre grava no global; se vier conversation_id, grava também no log da conversa.
   * Aceita campos adicionais usados na orquestração de /chat.
   */
  async log(entry: AgentLogEntry): Promise<void> {
    const lvl = mapLevel(entry.level ?? 'INFO');
    const payload: AgentLog = {
      ts: entry.ts ?? new Date().toISOString(),
      level: lvl,
      agent: entry.agent,
      message: entry.message,
      data: {
        request_id: entry.request_id,
        error: entry.error,
        // campos usados na pipeline /chat
        conversation_id: entry.conversation_id,
        user_id: entry.user_id,
        workflow: entry.workflow,
        source: entry.source,
        duration_ms: entry.duration_ms,
        created_at: entry.created_at,
        // espaço para qualquer outra coisa
        ...entry.extra,
      },
    };

    // global
    await this.redis.appendList(this.globalKey, JSON.stringify(payload));
    await this.redis.expire(this.globalKey, LOG_TTL);

    // opcional: por conversa
    if (entry.conversation_id) {
      await this.push(entry.conversation_id, payload);
    }
  }

  /** Atalho explícito para logar por conversa (se preferir) */
  async logForConversation(
    conversationId: string,
    entry: Omit<AgentLogEntry, 'conversation_id'>,
  ): Promise<void> {
    await this.log({ ...entry, conversation_id: conversationId });
  }
}
