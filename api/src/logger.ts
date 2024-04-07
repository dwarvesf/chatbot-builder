import pino from "pino";
import prettyPino from "pino-pretty";
import { isDev } from "./config";

const logger = isDev() ? 
  pino(prettyPino({
    colorize: true,
  })) : 
  pino();

export default logger;
