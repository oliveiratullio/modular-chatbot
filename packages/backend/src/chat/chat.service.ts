import { Injectable, Inject } from '@nestjs/common';
import type {
  ChatRequestDTO,
  ChatResponseDTO as AgentResponse,
  AgentStep,
  AgentContext,
  IRouterAgent,
} from '../agents/contracts.js';
import { AGENT_TOKENS } from '../agents/index.js';
import { MathAgent } from '../agents/math.agent.js';
import { KnowledgeAgent } from '../agents/knowledge.agent.js';

@Injectable()
export class ChatService {
  constructor(
    @Inject(AGENT_TOKENS.RouterAgent) private readonly router: IRouterAgent,
    @Inject(AGENT_TOKENS.MathAgent) private readonly math: MathAgent,
    @Inject(AGENT_TOKENS.KnowledgeAgent)
    private readonly knowledge: KnowledgeAgent,
  ) {}

  async handle(req: ChatRequestDTO): Promise<AgentResponse> {
    const ctx: AgentContext = {
      conversation_id: req.conversation_id,
      user_id: req.user_id,
    };

    const trail: AgentStep[] = [];

    const decision = await this.router.route(req.message, ctx);
    trail.push({ agent: 'RouterAgent', decision: decision.agent });

    if (decision.agent === 'MathAgent') {
      return this.math.handle(req.message, ctx, trail);
    }
    return this.knowledge.handle(req.message, ctx, trail);
  }
}
