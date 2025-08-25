import { Injectable, Inject } from '@nestjs/common';
import type {
  ChatRequestDTO,
  ChatResponseDTO,
  AgentStep,
  AgentContext,
  AgentDecision,
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

  async handle(req: ChatRequestDTO): Promise<ChatResponseDTO> {
    const ctx: AgentContext = {
      conversation_id: req.conversation_id,
      user_id: req.user_id,
    };

    const trail: AgentStep[] = [];

    // router decide
    const decision: AgentDecision = await this.router.route(req.message, ctx);
    // registra a decisão do roteador no trail
    trail.push({ agent: 'RouterAgent', decision: decision.agent });

    if (decision.agent === 'MathAgent') {
      return this.math.handle(req.message, ctx, trail);
    }

    // default: Knowledge
    return this.knowledge.handle(req.message, ctx, trail);
  }
}
