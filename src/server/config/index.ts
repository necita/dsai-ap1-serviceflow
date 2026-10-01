export type RuntimeEnvironment = "development" | "test" | "production";

export interface DatabaseConfig {
  url: string;
  host: string;
  port: number;
  protocol: string;
  database: string;
  username: string;
}

export const serverConfig = {
  nodeEnv: (process.env.NODE_ENV as RuntimeEnvironment | undefined) ?? "development",
  databaseUrl: process.env.DATABASE_URL?.trim() ?? "",
};

export function parseDatabaseUrl(rawUrl: string): DatabaseConfig {
  const url = rawUrl.trim();

  if (!url) {
    throw new Error("DATABASE_URL is required.");
  }

  try {
    const parsed = new URL(url);

    if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
      throw new Error("DATABASE_URL must use the PostgreSQL protocol (postgresql:// or postgres://).");
    }

    const host = parsed.hostname;
    const port = Number(parsed.port || 5432);

    if (!host) {
      throw new Error("DATABASE_URL must include a host.");
    }

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error("DATABASE_URL port must be a valid TCP port.");
    }

    const database = parsed.pathname.replace(/^\/+/, "");

    if (!database) {
      throw new Error("DATABASE_URL must include a database name.");
    }

    return {
      url,
      host,
      port,
      protocol: parsed.protocol.replace(":", ""),
      database,
      username: parsed.username || "",
    };
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("DATABASE_URL is not a valid PostgreSQL URL.");
    }

    throw error instanceof Error ? error : new Error(String(error));
  }
}

export function getDatabaseConfig(
  env: NodeJS.ProcessEnv = process.env,
): DatabaseConfig | null {
  const databaseUrl = env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    return null;
  }

  return parseDatabaseUrl(databaseUrl);
}

export function validateServerEnv(
  env: NodeJS.ProcessEnv = process.env,
): {
  isValid: boolean;
  nodeEnv: RuntimeEnvironment;
  databaseUrl: string;
  errors: string[];
  database?: string;
} {
  const databaseUrl = env.DATABASE_URL?.trim() ?? "";
  const errors: string[] = [];

  if (!databaseUrl) {
    errors.push("Missing required environment variable DATABASE_URL.");
  } else {
    try {
      const databaseConfig = parseDatabaseUrl(databaseUrl);
      return {
        isValid: true,
        nodeEnv: (env.NODE_ENV as RuntimeEnvironment | undefined) ?? "development",
        databaseUrl,
        errors: [],
        database: databaseConfig.database,
      };
    } catch (error) {
      errors.push((error as Error).message);
    }
  }

  return {
    isValid: false,
    nodeEnv: (env.NODE_ENV as RuntimeEnvironment | undefined) ?? "development",
    databaseUrl,
    errors,
  };
}
