import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';



export const IdempotencyKey = createParamDecorator(
  (required: boolean = false, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const key = request.headers['idempotency-key'];

    if (required && !key) {
      throw new BadRequestException(
        'Idempotency-Key header is required for this endpoint',
      ); 
    }

    return key;
  },
);