import {
  FastifyPluginAsyncTypebox,
  TypeBoxTypeProvider,
} from '@fastify/type-provider-typebox'
import { Static, Type } from '@sinclair/typebox'
import { FastifyInstance, FastifySchema, RouteHandler } from 'fastify'

import { Tag } from '@/configs/swagger-option'
import { Prisma } from '@/generated/prisma/client'
import SchemaId from '@/utils/schema-id'

const controller: FastifyPluginAsyncTypebox = async (
  fastify: FastifyInstance,
) => {
  const server = fastify.withTypeProvider<TypeBoxTypeProvider>()

  const C_Params = Type.Object({
    userId: Type.String({
      description: '요청 대상 사용자의 ID',
    }),
  })
  const C_User = Type.Ref(SchemaId.User)
  const C_UserPatchBody = Type.Ref(SchemaId.UserPatchBody)
  const C_UserDeleteResponse = Type.Ref(SchemaId.UserDeleteResponse)
  const C_ResErr = Type.Ref(SchemaId.Error)

  // GET api/v1/users/:userId
  const getSchema: FastifySchema = {
    tags: [Tag.User],
    summary: '특정 사용자 정보 조회',
    description: '`:userId`에 해당하는 사용자 정보를 조회합니다.',
    params: C_Params,
    response: {
      200: C_User,
      403: C_ResErr,
      404: C_ResErr,
    },
  }

  const getHandler: RouteHandler<{ Params: Static<typeof C_Params> }> = async (
    request,
    reply,
  ) => {
    const { userId: requestedUserId } = request.params

    const user = await server.userService.getUserById(requestedUserId)

    if (!user) {
      return reply.notFound(`User with ID '${requestedUserId}' not found.`)
    }

    reply.send(user)
  }

  server.route<{ Params: Static<typeof C_Params> }>({
    method: 'GET',
    url: '/',
    onRequest: [server.authenticate],
    schema: getSchema,
    handler: getHandler,
  })

  // PATCH api/v1/users/:userId
  const patchSchema: FastifySchema = {
    tags: [Tag.User],
    summary: '특정 사용자 정보 수정',
    description:
      '`:userId`에 해당하는 사용자 정보를 수정합니다. **본인 정보만 수정할 수 있습니다.**',
    params: C_Params,
    body: C_UserPatchBody,
    response: {
      200: C_User,
      403: C_ResErr,
      404: C_ResErr,
    },
  }

  const patchHandler: RouteHandler<{
    Params: Static<typeof C_Params>
    Body: Static<typeof C_UserPatchBody>
  }> = async (request, reply) => {
    const { userId: requestedUserId } = request.params
    const { userId: currentUserId } = request.user

    if (requestedUserId !== currentUserId) {
      return reply.forbidden('You are not authorized to modify this resource.')
    }

    const updatedUser = await server.userService.updateUser(
      requestedUserId,
      request.body as Prisma.UserUpdateInput,
    )

    reply.send(updatedUser)
  }

  server.route<{
    Params: Static<typeof C_Params>
    Body: Static<typeof C_UserPatchBody>
  }>({
    method: 'PATCH',
    url: '/',
    onRequest: [server.authenticate],
    schema: patchSchema,
    handler: patchHandler,
  })

  // DELETE api/v1/users/:userId
  const deleteSchema: FastifySchema = {
    tags: [Tag.User],
    summary: '특정 사용자 삭제 (회원 탈퇴)',
    description:
      '`:userId`에 해당하는 사용자를 삭제합니다. **본인만 삭제할 수 있습니다.**',
    params: C_Params,
    response: {
      200: C_UserDeleteResponse,
      403: C_ResErr,
      404: C_ResErr,
    },
  }

  const deleteHandler: RouteHandler<{
    Params: Static<typeof C_Params>
  }> = async (request, reply) => {
    const { userId: requestedUserId } = request.params
    const { userId: currentUserId } = request.user

    if (requestedUserId !== currentUserId) {
      return reply.forbidden('You are not authorized to delete this resource.')
    }

    await server.userService.deleteUser(requestedUserId)

    reply
      .clearCookie('accessToken', { path: '/' })
      .clearCookie('refreshToken', { path: '/' })

    return { message: 'User deleted successfully.' }
  }

  server.route<{ Params: Static<typeof C_Params> }>({
    method: 'DELETE',
    url: '/',
    onRequest: [server.authenticate],
    schema: deleteSchema,
    handler: deleteHandler,
  })
}

export default controller
