/// <reference types="vitest" />
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // globals: true,
    environment: 'node',
    testTimeout: 30000, // 30 seconds
    // reporters: ['verbose'],
    deps: {
      inline: ['@fastify/autoload'],
    },
    env: {
      DATABASE_URL: 'postgresql://test:test@localhost:5433/aiew_test',
      AI_SERVER_URL: 'http://mock-ai-server.com',
      JWT_SECRET: 'test-jwt-secret',
    },
  },
})
