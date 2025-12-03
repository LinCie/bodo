import { logger } from "../logger/index.ts";

const pinoLoggerMiddleware = (message: string, ...rest: string[]) => {
  logger.info([...rest], message);
};

export { pinoLoggerMiddleware };
