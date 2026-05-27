import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 50000;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || message;
      code = status * 100 + (typeof res === 'object' ? ((res as any).code || 0) : 0);
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`${request.method} ${request.url}`, exception.stack);
    }

    response.status(status).json({
      code,
      message: Array.isArray(message) ? message.join('; ') : message,
      data: null,
      timestamp: Date.now(),
    });
  }
}
