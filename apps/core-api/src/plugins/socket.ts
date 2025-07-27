import { FastifyInstance } from 'fastify'
import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { Server, Socket } from 'socket.io'

declare module 'fastify' {
  interface FastifyInstance {
    io: Server
  }
}

const socketIOPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // 1. socket.io 서버를 생성하고, Fastify의 HTTP 서버에 연결합니다.
  const io = new Server(fastify.server, {
    cors: {
      origin: 'http://localhost:4000',
      credentials: true,
    },
  })

  // 2. 생성된 io 인스턴스를 fastify.decorate를 통해 추가합니다.
  //    이제 다른 라우트나 플러그인에서 fastify.io로 접근할 수 있습니다.
  fastify.decorate('io', io)

  const onConnection = (socket: Socket) => {
    fastify.log.info(`Socket connected: ${socket.id}`)

    // 클라이언트로부터 메시지를 받는 리스너 예시
    socket.on('client:hello', (msg) => {
      fastify.log.info(`Message from ${socket.id}: ${msg}`)
      // 클라이언트로 메시지 보내기 예시
      socket.emit('server:hello', `Hello from server! You sent: ${msg}`)
    })

    socket.on('disconnect', () => {
      fastify.log.info(`Socket disconnected: ${socket.id}`)
    })
  }

  // 'connection' 이벤트 리스너를 등록합니다.
  fastify.io.on('connection', onConnection)

  // 3. Fastify 서버가 닫힐 때 socket.io 서버도 함께 닫히도록 hook을 등록합니다.
  fastify.addHook('onClose', (instance, done) => {
    instance.io.close()
    done()
  })
}

export default fp(socketIOPlugin)
