import { registerAs } from '@nestjs/config';
import { ValidationPipeOptions, BadRequestException } from '@nestjs/common';

export default registerAs(
  'validation',
  (): ValidationPipeOptions => ({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    disableErrorMessages: process.env.NODE_ENV === 'production',

    exceptionFactory: (errors) => {
      const messages = errors.map((error) => ({
        field: error.property,
        errors: Object.values(error.constraints || {}),
      }));

      return new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: messages,
      });
    },
  }),
);
