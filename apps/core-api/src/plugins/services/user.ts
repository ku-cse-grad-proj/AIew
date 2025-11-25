import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

import { Prisma, User } from '@/generated/prisma/client'

export class UserService {
  private fastify: FastifyInstance

  constructor(fastifyInstance: FastifyInstance) {
    this.fastify = fastifyInstance
  }

  /**
   * 사용자 ID로 사용자 조회
   */
  public async getUserById(userId: string): Promise<User | null> {
    const user = await this.fastify.prisma.user.findUnique({
      where: { id: userId },
    })
    return user
  }

  /**
   * 사용자 정보 수정
   */
  public async updateUser(
    userId: string,
    data: Prisma.UserUpdateInput,
  ): Promise<User> {
    const updatedUser = await this.fastify.prisma.user.update({
      where: { id: userId },
      data,
    })

    this.fastify.log.info(
      `User ${userId} updated at ${new Date().toISOString()}`,
    )

    return updatedUser
  }

  /**
   * 사용자 삭제 (회원 탈퇴)
   */
  public async deleteUser(userId: string): Promise<void> {
    await this.fastify.prisma.user.delete({
      where: { id: userId },
    })

    this.fastify.log.info(
      `User ${userId} deleted at ${new Date().toISOString()}`,
    )
  }

  /**
   * 이메일로 사용자 조회 또는 생성 (OAuth용)
   */
  public async findOrCreateUserByEmail(
    email: string,
    userData: {
      name: string
      pic_url: string
      provider: 'GOOGLE' | 'GITHUB'
    },
  ): Promise<User> {
    let user = await this.fastify.prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      user = await this.fastify.prisma.user.create({
        data: {
          email,
          name: userData.name,
          pic_url: userData.pic_url,
          provider: userData.provider,
        },
      })

      this.fastify.log.info(
        `New user created: ${user.id} (${email}) via ${userData.provider}`,
      )
    }

    return user
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    userService: UserService
  }
}

export default fp(
  async (fastify) => {
    const userService = new UserService(fastify)
    fastify.decorate('userService', userService)
  },
  {
    name: 'userService',
  },
)
