import { ChatResponseDTO } from '../shared/types.js';
import type { AgentContext, AgentStep, IAgent } from './contracts.js';

export class KnowledgeAgent implements IAgent {
  public readonly name = 'KnowledgeAgent' as const;

  canHandle(_message: string) {
    return true;
  }

  async handle(
    _message: string,
    ctx: AgentContext,
    trail: AgentStep[],
  ): Promise<ChatResponseDTO> {
    return {
      response: 'KnowledgeAgent placeholder',
      source_agent_response: 'KnowledgeAgent',
      agent_workflow: [...trail, { agent: 'KnowledgeAgent' }],
    };
  }
}
