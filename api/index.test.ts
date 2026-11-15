import { beforeAll, describe, expect, it, jest } from "@jest/globals";

// Mocked so importing index.ts doesn't connect to MongoDB or open a port
const mockConnectDb = jest.fn(async () => {});
const mockCreateApiServer = jest.fn((_port: number) => {});
const mockLogError = jest.fn();

jest.mock("./db.ts", () => ({ connectDb: mockConnectDb }));
jest.mock("./api.ts", () => ({ createApiServer: mockCreateApiServer }));
jest.mock("./env.ts", () => ({ loadEnv: () => ({}) }));
jest.mock("./log.ts", () => ({
  logger: () => ({ error: mockLogError, info: jest.fn() }),
}));

beforeAll(async () => {
  await import("./index.ts");
  // Let the main() call made on import finish
  await new Promise(setImmediate);
});

describe("on import", () => {
  it("connects and starts the server on the default port", () => {
    expect(mockConnectDb).toHaveBeenCalledTimes(1);
    expect(mockCreateApiServer).toHaveBeenCalledTimes(1);
    expect(mockCreateApiServer).toHaveBeenCalledWith(3000);
  });
});
