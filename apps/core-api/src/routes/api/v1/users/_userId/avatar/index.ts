import {
  FastifyPluginAsyncTypebox,
  TypeBoxTypeProvider,
} from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import {
  FastifyInstance,
  FastifySchema,
  RouteHandler,
  RouteOptions,
} from 'fastify'

import { Tag } from '@/configs/swagger-option'
import SchemaId from '@/utils/schema-id'

const controller: FastifyPluginAsyncTypebox = async (
  fastify: FastifyInstance,
) => {
  const server = fastify.withTypeProvider<TypeBoxTypeProvider>()

  const C_Params = Type.Object({
    userId: Type.String({
      description: '아바타를 변경할 사용자의 ID',
    }),
  })
  const C_User = Type.Ref(SchemaId.User)
  const C_ResErr = Type.Ref(SchemaId.Error)

  // PUT /api/v1/users/:userId/avatar
  const putSchema: FastifySchema = {
    tags: [Tag.User],
    summary: '아바타(프로필 사진) 업로드',
    description:
      '사용자의 아바타를 업로드합니다. **본인만 변경할 수 있습니다.** 지원 형식: JPEG, PNG, WebP, GIF (최대 3MB). `file` 필드로 이미지를 전송하세요.',
    consumes: ['multipart/form-data'],
    params: C_Params,
    response: {
      200: C_User,
      400: C_ResErr,
      403: C_ResErr,
    },
  }

  const putHandler: RouteHandler = async (request, reply) => {
    const { userId: requestedUserId } = request.params as { userId: string }
    const { userId: currentUserId } = request.user

    // 본인만 변경 가능
    if (requestedUserId !== currentUserId) {
      return reply.forbidden('You are not authorized to modify this resource.')
    }

    // multipart 파일 파싱
    const file = await request.file()

    if (!file) {
      return reply.badRequest('No file uploaded.')
    }

    // Content-Type 검증
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ]
    if (!allowedTypes.includes(file.mimetype)) {
      return reply.badRequest(
        `Invalid file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, GIF`,
      )
    }

    // 파일을 Buffer로 변환
    const buffer = await file.toBuffer()

    // 파일 크기 검증 (3MB)
    const maxSize = 3 * 1024 * 1024
    if (buffer.length > maxSize) {
      return reply.badRequest(
        `File too large: ${Math.round((buffer.length / 1024 / 1024) * 100) / 100}MB. Maximum: 3MB`,
      )
    }

    // R2에 업로드
    const r2Url = await server.fileService.uploadProfilePictureFromBuffer(
      requestedUserId,
      buffer,
      file.mimetype,
    )

    if (!r2Url) {
      return reply.badRequest('Failed to upload profile picture.')
    }

    // DB 업데이트
    const updatedUser = await server.userService.updateUser(requestedUserId, {
      pic_url: r2Url,
    })

    return updatedUser
  }

  const putOpts: RouteOptions = {
    method: 'PUT',
    url: '/',
    onRequest: [server.authenticate],
    schema: putSchema,
    handler: putHandler,
  }

  server.route(putOpts)
}

export default controller
