import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { basicPromptInjectionGuard } from '../../utils/sanitize.js';

const BLOCK_PATTERNS = [
  /ignore (all )?(previous|prior) (instructions|messages)/i,
  /\bact as (system|developer|jailbreak)\b/i,
  /\byou are (now )?(system prompt|developer mode)\b/i,
  /\boverride\b.*\brules\b/i,
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
