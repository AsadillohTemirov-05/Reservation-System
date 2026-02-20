export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  timestamp: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export class ResponseUtil {

  static success<T>(
    data: T,
    message: string = 'Success',
    statusCode: number = 200,
  ): ApiResponse<T> {
    return {
      success: true,
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

 
  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message: string = 'Success',
  ): ApiResponse<T[]> {
    return {
      success: true,
      statusCode: 200,
      message,
      data,
      timestamp: new Date().toISOString(),
      meta: { total, page, limit },
    };
  }

 
  static error(
    message: string,
    statusCode: number = 500,
    error: string = 'Error',
  ): Omit<ApiResponse<null>, 'data'> {
    return {
      success: false,
      statusCode,
      message,
      timestamp: new Date().toISOString(),
    };
  }


  static created<T>(data: T, message: string = 'Created successfully'): ApiResponse<T> {
    return ResponseUtil.success(data, message, 201);
  }
}