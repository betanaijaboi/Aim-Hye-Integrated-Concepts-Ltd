import { defineConfig } from "prisma/config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: "file:./prisma/dev.db",
  },
} as any);
