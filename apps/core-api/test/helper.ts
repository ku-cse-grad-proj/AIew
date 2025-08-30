// This file contains code that we reuse between our tests.
import { join } from 'node:path'
import * as test from 'node:test'

import { S3Client } from '@aws-sdk/client-s3'
import AutoLoad from '@fastify/autoload'
import Cookie from '@fastify/cookie'
import Cors from '@fastify/cors'
import { FastifyJWT } from '@fastify/jwt'
import Multipart from '@fastify/multipart'
import { ajvFilePlugin } from '@fastify/multipart'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { PrismaClient, User } from '@prisma/client'
import { FastifyInstance as OriginalFastifyInstance } from 'fastify'
import Fastify from 'fastify'
import { Server as SocketIOServer } from 'socket.io'

import { app as AppPlugin } from '../src/app'
import { AiClientService } from '../src/plugins/services/ai-client'
import { InterviewService } from '../src/plugins/services/interview'

// Extend the FastifyInstance interface with all our decorators
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
    r2: S3Client
    io: SocketIOServer
    aiClientService: AiClientService
    interviewService: InterviewService
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>
  }
  // Add JWT decorator types
  interface FastifyRequest {
    jwt: FastifyJWT
  }
}

// Use the extended interface
export type FastifyInstance = OriginalFastifyInstance<
  // eslint-disable-next-line
  any,
  // eslint-disable-next-line
  any,
  // eslint-disable-next-line
  any,
  // eslint-disable-next-line
  any,
  TypeBoxTypeProvider
>

export type TestContext = {
  after: typeof test.after
}

// Automatically build and tear down our instance
async function build(t: TestContext): Promise<FastifyInstance> {
  const app = Fastify({
    ajv: {
      plugins: [ajvFilePlugin],
    },
    logger: true, // Disable logger for cleaner test output
  }).withTypeProvider<TypeBoxTypeProvider>()

  // Register the main application plugin first
  await app.register(AppPlugin)

  // Register essential plugins
  await app.register(Cookie)
  await app.register(Multipart, {
    attachFieldsToBody: true,
  })
  await app.register(Cors, {
    origin: 'http://localhost:4000',
    credentials: true,
  })

  // Autoload all plugins. fastify-plugin handles the dependency order.
  await app.register(AutoLoad, {
    dir: join(__dirname, '../src/plugins'),
    options: {},
  })

  // Autoload all routes
  await app.register(AutoLoad, {
    dir: join(__dirname, '../src/routes'),
    dirNameRoutePrefix: true,
    options: {},
  })

  // Start listening on an ephemeral port
  await app.listen({ port: 0 })

  // Tear down our app after we are done
  t.after(() => app.close())

  await app.ready()

  return app
}

/**
 * Creates a test user in the database and returns the user and an access token.
 */
async function createTestUserAndToken(
  app: FastifyInstance,
): Promise<{ user: User; accessToken: string }> {
  const testEmail = `test-${Date.now()}@example.com`
  const user = await app.prisma.user.create({
    data: {
      email: testEmail,
      name: 'Test User',
      provider: 'TEST',
    },
  })

  const accessToken = await app.jwt.sign({ userId: user.id })
  return { user, accessToken }
}

export { build, createTestUserAndToken }
