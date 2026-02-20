export interface IdempotencyKeyInterface {
  key: string;
  userId?: string;
  createdAt: Date;
  expiresAt: Date;
  response?: any;
}

export interface IdempotencyRequestInterface {
  idempotencyKey: string;
  method: string;
  path: string;
  body: any;
  userId?: string;
}

export interface IdempotencyResponseInterface {
  statusCode: number;
  data: any;
  cachedAt: Date;
}