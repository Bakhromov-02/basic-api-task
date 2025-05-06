import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('LoggerMiddleware');
  
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    res.on('finish', () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      this.logger.log(
        `Request started at ${new Date(startTime).toISOString()} and finished at ${new Date(endTime).toISOString()} for ${req.method} ${req.originalUrl}, took ${duration}ms`,
      );
    });

    next();
  }
}