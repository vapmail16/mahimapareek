import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import config from '../config';

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// JSON format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logLevel,
  format: fileFormat,
  transports: [
    // Error log file
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat,
    }),
    // Combined log file
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat,
    }),
  ],
});

// Add console transport in development
if (config.nodeEnv !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// PII masking function
function maskPII(data: string): string {
  // Mask email addresses: user@example.com -> u***@example.com
  data = data.replace(
    /([a-zA-Z0-9._%+-])[a-zA-Z0-9._%+-]*@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    '$1***@$2'
  );

  // Mask phone numbers: +1-234-567-8900 -> +1-***-***-8900
  data = data.replace(
    /(\+\d{1,3}[-.\s]?)?(\d{3})[-.\s]?(\d{3})[-.\s]?(\d{4})/g,
    '$1***-***-$4'
  );

  // Mask credit card numbers: 4111-1111-1111-1111 -> ****-****-****-1111
  data = data.replace(
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?(\d{4})\b/g,
    '****-****-****-$1'
  );

  return data;
}

// Wrap logger methods to mask PII
const wrappedLogger = {
  error: (message: string, meta?: object) => {
    const maskedMessage = maskPII(message);
    const maskedMeta = meta ? JSON.parse(maskPII(JSON.stringify(meta))) : {};
    logger.error(maskedMessage, maskedMeta);
  },
  warn: (message: string, meta?: object) => {
    const maskedMessage = maskPII(message);
    const maskedMeta = meta ? JSON.parse(maskPII(JSON.stringify(meta))) : {};
    logger.warn(maskedMessage, maskedMeta);
  },
  info: (message: string, meta?: object) => {
    const maskedMessage = maskPII(message);
    const maskedMeta = meta ? JSON.parse(maskPII(JSON.stringify(meta))) : {};
    logger.info(maskedMessage, maskedMeta);
  },
  debug: (message: string, meta?: object) => {
    const maskedMessage = maskPII(message);
    const maskedMeta = meta ? JSON.parse(maskPII(JSON.stringify(meta))) : {};
    logger.debug(maskedMessage, maskedMeta);
  },
};

export default wrappedLogger;

