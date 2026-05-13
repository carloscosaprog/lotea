import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers?.authorization;

    if (!authorization) {
      request.user = null;
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = any>(_err: any, user: any): TUser | null {
    return user ?? null;
  }
}
