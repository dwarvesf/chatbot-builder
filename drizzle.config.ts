import { type Config } from "drizzle-kit";

import { env } from "~/env";

export default {
  schema: "./src/migration/schema.ts",
  driver: "pg",
  dbCredentials: {
    connectionString: env.DATABASE_URL,
  },
  // tablesFilter: ["chatbot-builder_*"],
  out: "./migrations",
} satisfies Config;
