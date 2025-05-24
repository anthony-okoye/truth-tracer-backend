import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { SonarApiException, SonarValidationException, SonarTimeoutException, SonarConfigurationException } from '../exceptions/sonar.exceptions';

@Catch()
export class SonarExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SonarExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const correlationId = request.headers['x-correlation-id'] || 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
      message: 'Internal server error'
    };

    if (exception instanceof SonarApiException) {
      status = exception.statusCode;
      errorResponse = {
        ...errorResponse,
        statusCode: status,
        message: exception.message,
        errorCode: exception.errorCode,
        details: exception.details
      };
    } else if (exception instanceof SonarValidationException) {
      status = HttpStatus.BAD_REQUEST;
      errorResponse = {
        ...errorResponse,
        statusCode: status,
        message: exception.message,
        field: exception.field,
        value: exception.value
      };
    } else if (exception instanceof SonarTimeoutException) {
      status = HttpStatus.REQUEST_TIMEOUT;
      errorResponse = {
        ...errorResponse,
        statusCode: status,
        message: exception.message,
        timeout: exception.timeout
      };
    } else if (exception instanceof SonarConfigurationException) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = {
        ...errorResponse,
        statusCode: status,
        message: exception.message,
        configKey: exception.configKey
      };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      errorResponse = {
        ...errorResponse,
        statusCode: status,
        message: typeof exceptionResponse === 'string' ? exceptionResponse : (exceptionResponse as any).message
      };
    }

    this.logger.error(
      `Exception occurred: ${exception instanceof Error ? exception.message : 'Unknown error'}`,
      exception instanceof Error ? exception.stack : undefined,
      {
        correlationId,
        path: request.url,
        method: request.method,
        status
      }
    );

    response.status(status).json(errorResponse);
  }
} 