import { join } from 'node:path'

import AutoLoad from '@fastify/autoload'
import Cookie from '@fastify/cookie'
import Cors from '@fastify/cors'
import Multipart from '@fastify/multipart'
import { ajvFilePlugin } from '@fastify/multipart'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import Fastify from 'fastify'

import { app as AppPlugin } from './app'
import SwaggerOption from './configs/swagger-option'
import SwaggerUiOption from './configs/swagger-ui-option'

const start = async () => {
  const app = Fastify({
    ajv: {
      plugins: [ajvFilePlugin],
      customOptions: {
        keywords: ['example'],
      },
    },
    logger: {
      transport: {
        target: '@fastify/one-line-logger',
      },
    },
  }).withTypeProvider<TypeBoxTypeProvider>()

  // Register the main application plugin
  await app.register(AppPlugin)

  // Register Swagger plugins
  await app.register(swagger, SwaggerOption)
  await app.register(swaggerUi, SwaggerUiOption)

  // Register essential plugins
  await app.register(Cookie)
  await app.register(Multipart, {
    limits: {
      fieldNameSize: 100, // 필드명 크기 (bytes)
      fieldSize: 1024 * 10, // 필드값 크기 (10KB)
      fields: 4, // 텍스트 필드 수
      fileSize: 10 * 1024 * 1024, // 개별 파일 크기 (10MB)
      files: 2, // 파일 수
      headerPairs: 2000, // 헤더 쌍 수
      parts: 6, // 전체 파트(필드+파일) 수
    },
  })
  await app.register(Cors, {
    origin: 'http://localhost:4000',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true, // Allow cookies to be sent
  })

  // Autoload plugins
  await app.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
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
    await app.listen({ port: 3000, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

void start()
