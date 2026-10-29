import { Logger } from "tslog";

const log = new Logger({ minLevel: "DEBUG" });

/** Create a scoped logger */
export function logger(tag: string) {
  return log.child({ name: tag });
}
