import { FastifySwaggerUiOptions } from '@fastify/swagger-ui'

const swaggerUiOption: FastifySwaggerUiOptions = {
  routePrefix: '/docs',
  uiConfig: {
    tagsSorter: 'alpha',
    docExpansion: 'none',
    persistAuthorization: true,
    filter: true,
    tryItOutEnabled: true,
    deepLinking: true,
    syntaxHighlight: {
      activate: true,
      theme: 'monokai',
    },
  },
}

export default swaggerUiOption
