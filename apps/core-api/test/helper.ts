// This file contains code that we reuse between our tests.
import * as test from 'node:test'
import { join } from 'path'

import AutoLoad from '@fastify/autoload'
import Cookie from '@fastify/cookie'
import Cors from '@fastify/cors'
import Multipart from '@fastify/multipart'
import { ajvFilePlugin } from '@fastify/multipart'
import Fastify from 'fastify'

import { app as AppPlugin } from '../src/app'
// Manually import plugins to control loading order
import jwtPlugin from '../src/plugins/jwt'
import prismaPlugin from '../src/plugins/prisma'
import sensiblePlugin from '../src/plugins/sensible'
import socketIOPlugin from '../src/plugins/socket'

export type TestContext = {
  after: typeof test.after
}

// Fill in this config with all the configurations
// needed for testing the application
function config() {
  return {}
}

// Automatically build and tear down our instance
async function build(t: TestContext) {
  const app = Fastify({
    ajv: {
      plugins: [ajvFilePlugin],
    },
    logger: false, // Disable logger for cleaner test output
  })

  // Register the main application plugin first
  await app.register(AppPlugin)

  // Register essential plugins manually in the correct order
  await app.register(sensiblePlugin)
  await app.register(Cookie)
  await app.register(Multipart, {
    attachFieldsToBody: true,
  })
  await app.register(Cors, {
    origin: 'http://localhost:4000',
    credentials: true,
  })
  // Register plugins with dependencies
  await app.register(prismaPlugin)
  await app.register(jwtPlugin)
  await app.register(socketIOPlugin)

  // Load other plugins that don't have strict dependency order
  await app.register(AutoLoad, {
    dir: join(__dirname, '../src/plugins'),
    ignorePattern: /prisma\.ts|jwt\.ts|sensible\.ts|socket\.ts/, // Ignore manually loaded plugins
  })

  // Load routes similar to server.ts
  await app.register(AutoLoad, {
    dir: join(__dirname, '../src/routes'),
  })

  // Tear down our app after we are done
  t.after(() => app.close())

  await app.ready()

  return app
}

export { config, build }
