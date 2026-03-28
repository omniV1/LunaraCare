import winston from 'winston';

const level = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const logger = winston.createLogger({
  level,
  levels: winston.config.npm.levels,
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(
      ({ timestamp, level, message }: winston.Logform.TransformableInfo) =>
        `${timestamp} ${level}: ${message}`
    )
  ),
  transports: [new winston.transports.Console()],
});

export default logger;
