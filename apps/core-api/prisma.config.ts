import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // CI에서 prisma generate 시 DATABASE_URL이 없어도 동작하도록 fallback 제공
    url:
      process.env.DATABASE_URL ||
      'postgresql://placeholder:placeholder@localhost:5432/placeholder',
  },
})
