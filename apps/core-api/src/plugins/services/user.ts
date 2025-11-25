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
      // 기본 pic_url로 사용자 생성
      user = await this.fastify.prisma.user.create({
        data: {
          email,
          name: userData.name,
          // 기본 avatar 설정 (prisma에 default로 설정되어 있기에 명시하지 않아도 되긴 함)
          pic_url: `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${email}`,
          provider: userData.provider,
        },
      })

      this.fastify.log.info(
        `New user created: ${user.id} (${email}) via ${userData.provider}`,
      )

      // 프로필 사진 업로드 완료 후 반환
      // 실패해도 기본 아바타가 유지되므로 에러는 로깅만
      const updatedUser = await this.uploadAndUpdateProfilePicture(
        user.id,
        userData.pic_url,
        userData.provider,
      )

      return updatedUser ?? user
    }

    return user
  }

  /**
   * 외부 URL에서 프로필 사진을 R2에 업로드하고 DB 업데이트
   * @returns 업데이트된 User 또는 실패 시 null
   */
  private async uploadAndUpdateProfilePicture(
    userId: string,
    sourceUrl: string,
    provider: string,
  ): Promise<User | null> {
    try {
      // FileService를 통해 외부 URL → R2 업로드
      const r2Url = await this.fastify.fileService.uploadProfilePictureFromUrl(
        userId,
        sourceUrl,
        provider,
      )

      if (r2Url) {
        // R2 업로드 성공 시 DB 업데이트 후 반환
        const updatedUser = await this.fastify.prisma.user.update({
          where: { id: userId },
          data: { pic_url: r2Url },
        })

        this.fastify.log.info(
          `Profile picture updated in DB for user ${userId}: ${r2Url}`,
        )

        return updatedUser
      }

      // r2Url이 null이면 기본 dicebear URL 유지 (로그는 FileService에서 처리)
      return null
    } catch (error) {
      this.fastify.log.error(
        error,
        `Failed to upload profile picture for user ${userId}`,
      )
      return null
    }
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
