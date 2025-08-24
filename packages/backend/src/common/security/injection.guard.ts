import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { basicPromptInjectionGuard } from '../../utils/sanitize.js';

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
}
