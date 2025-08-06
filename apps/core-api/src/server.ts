import { join } from 'node:path'

import AutoLoad from '@fastify/autoload'
import Cookie from '@fastify/cookie'
import Cors from '@fastify/cors'
import Multipart from '@fastify/multipart'
import { ajvFilePlugin } from '@fastify/multipart'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import Fastify from 'fastify'

import { app as AppPlugin } from './app'
import SwaggerOption from './configs/swaggerOption'
import SwaggerUiOption from './configs/swaggerUiOption'

const start = async () => {
  const app = Fastify({
    ajv: {
      plugins: [ajvFilePlugin],
    },
    logger: {
      transport: {
        target: '@fastify/one-line-logger',
      },
    },
  })

  // Register the main application plugin
  await app.register(AppPlugin)

  // Register Swagger plugins
  await app.register(swagger, SwaggerOption)
  await app.register(swaggerUi, SwaggerUiOption)

  // Register essential plugins
  await app.register(Cookie)
  await app.register(Multipart, {
    attachFieldsToBody: true,
  })
  await app.register(Cors, {
    origin: 'http://localhost:4000',
    credentials: true, // Allow cookies to be sent
  })

  // Autoload plugins
  await app.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    dirNameRoutePrefix: true,
    options: {},
  })

  // Autoload routes
  await app.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    dirNameRoutePrefix: true,
    routeParams: true,
    options: {},
  })

  try {
    await app.listen({ port: 3000 })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

void start()
