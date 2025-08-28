import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { basicPromptInjectionGuard } from '../../utils/sanitize.js';

const SP = '[\\s\\t\\n]+'; // espaços flexíveis
const BLOCK_PATTERNS = [
  new RegExp(
    `ignore${SP}(all${SP})?(previous|prior)${SP}(instructions|messages)`,
    'i',
  ),
  new RegExp(`\\bact${SP}as${SP}(system|developer|jailbreak)\\b`, 'i'),
  new RegExp(
    `\\byou${SP}are${SP}(now${SP})?(system${SP}prompt|developer${SP}mode)\\b`,
    'i',
  ),
  new RegExp(`\\boverride\\b(?:${SP}.*)?\\brules\\b`, 'i'),
];

@Injectable()
export class InjectionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const msg: string | undefined = req?.body?.message;
    if (msg && basicPromptInjectionGuard(msg)) {
      throw new ForbiddenException(
        'Input rejected by minimal prompt-injection policy.',
      );
    }
    return true;
  }

  checkOrThrow(message: string) {
    for (const rx of BLOCK_PATTERNS) {
      if (rx.test(message)) {
        throw new ForbiddenException({
          error_code: 'PROMPT_INJECTION_DETECTED',
        });
      }
    }
  }
}
