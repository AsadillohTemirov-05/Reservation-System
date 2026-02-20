import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ClientSession } from 'mongoose';


export const WithSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ClientSession | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.mongoSession || null;
  },
);


export const setSessionOnRequest = (request: any, session: ClientSession) => {
  request.mongoSession = session;
};