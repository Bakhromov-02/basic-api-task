import {
  Catch,
  Logger,
  HttpStatus,
  ArgumentsHost,
  HttpException,
  ExceptionFilter,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Request, Response } from 'express';

const PG_UNIQUE_VIOLATION = '23505';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      message =
        typeof body === 'string'
          ? body
          : ((body as { message?: string | string[] }).message ?? message);
    } else if (
      exception instanceof QueryFailedError &&
      (exception.driverError as { code?: string })?.code === PG_UNIQUE_VIOLATION
    ) {
      status = HttpStatus.CONFLICT;
      message = 'Resource already exists';
    } else {
      // Unexpected error: log the details, never send them to the client.
      this.logger.error(
        `${request.method} ${request.originalUrl}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    });
  }
}
