import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import axios from 'axios'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

export class FileService {
  private fastify: FastifyInstance
  private static readonly MAX_PROFILE_PICTURE_SIZE = 3 * 1024 * 1024 // 3MB

  constructor(fastifyInstance: FastifyInstance) {
    this.fastify = fastifyInstance
  }

  /**
   * R2 업로드 담당
   * @param key - R2 파일 키 (예: 'profilePictures/userId/avatar.jpg')
   * @param buffer - 업로드할 파일 Buffer
   * @param contentType - 파일 MIME 타입
   * @returns R2 Public URL
   */
  public async uploadToR2(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    await this.fastify.r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    )

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

    this.fastify.log.info(`File uploaded to R2: ${key}`)

    return publicUrl
  }

  /**
   * Buffer로 프로필 사진 업로드 (사용자 직접 업로드용)
   * @param userId - 사용자 ID
   * @param buffer - 이미지 Buffer
   * @param contentType - 이미지 MIME 타입 (image/jpeg, image/png 등)
   * @returns R2 Public URL 또는 null (실패 시)
   */
  public async uploadProfilePictureFromBuffer(
    userId: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string | null> {
    try {
      // 파일 크기 검증
      if (buffer.length > FileService.MAX_PROFILE_PICTURE_SIZE) {
        this.fastify.log.warn(
          `Profile picture too large (${buffer.length} bytes) for user ${userId}, max: ${FileService.MAX_PROFILE_PICTURE_SIZE} bytes`,
        )
        return null
      }

      const ext = this.getExtensionFromContentType(contentType)
      const fileKey = `profilePictures/${userId}/avatar.${ext}`

      // 기존 프로필 사진 삭제 (확장자가 바뀌면 고아 파일이 되므로)
      try {
        await this.deleteByPrefix(`profilePictures/${userId}/`)
      } catch {
        // 삭제 실패해도 업로드는 진행
        this.fastify.log.warn(
          `Failed to delete old profile pictures for user ${userId}, proceeding with upload`,
        )
      }

      const publicUrl = await this.uploadToR2(fileKey, buffer, contentType)

      this.fastify.log.info(
        `Profile picture uploaded successfully for user ${userId}`,
      )

      return publicUrl
    } catch (error) {
      this.fastify.log.error(
        error,
        `Failed to upload profile picture to R2 for user ${userId}:`,
      )
      return null
    }
  }

  /**
   * 외부 URL에서 프로필 사진을 다운로드하여 R2에 업로드 (OAuth용)
   * @param userId - 사용자 ID
   * @param sourceUrl - OAuth 제공사의 프로필 사진 URL
   * @param provider - OAuth 제공사 (로깅용, optional)
   * @returns R2 Public URL 또는 null (실패 시)
   */
  public async uploadProfilePictureFromUrl(
    userId: string,
    sourceUrl: string,
    provider?: string,
  ): Promise<string | null> {
    const source = provider || 'external URL'

    try {
      // 외부 URL에서 이미지 다운로드
      const response = await axios.get(sourceUrl, {
        responseType: 'arraybuffer',
        timeout: 5000, // 5초 타임아웃
        maxContentLength: FileService.MAX_PROFILE_PICTURE_SIZE,
        validateStatus: (status) => status === 200,
      })

      const contentType = response.headers['content-type'] || 'image/jpeg'
      const buffer = Buffer.from(response.data)

      // Buffer 업로드 메서드 재사용
      const publicUrl = await this.uploadProfilePictureFromBuffer(
        userId,
        buffer,
        contentType,
      )

      if (publicUrl) {
        this.fastify.log.info(
          `Profile picture fetched from ${source} for user ${userId}`,
        )
      }

      return publicUrl
    } catch (error) {
      // 에러 타입별 로깅
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          this.fastify.log.warn(
            `Profile picture download timeout for user ${userId} from ${source}`,
          )
        } else if (error.response?.status === 404) {
          this.fastify.log.warn(
            `Profile picture not found: ${sourceUrl} for user ${userId}`,
          )
        } else if (error.message.includes('maxContentLength')) {
          this.fastify.log.warn(
            `Profile picture too large (>3MB) for user ${userId} from ${source}`,
          )
        } else {
          this.fastify.log.error(
            error,
            `Failed to download profile picture for user ${userId}:`,
          )
        }
      } else {
        this.fastify.log.error(
          error,
          `Failed to upload profile picture for user ${userId}:`,
        )
      }

      return null
    }
  }

  /**
   * R2에서 단일 파일 삭제
   * @param key - 삭제할 파일 키 (예: 'profilePictures/userId/avatar.jpg')
   */
  public async deleteFromR2(key: string): Promise<void> {
    try {
      await this.fastify.r2.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
        }),
      )
      this.fastify.log.info(`File deleted from R2: ${key}`)
    } catch (error) {
      this.fastify.log.error(error, `Failed to delete file from R2: ${key}`)
      throw error
    }
  }

  /**
   * R2에서 특정 prefix로 시작하는 모든 파일 삭제
   * @param prefix - 삭제할 파일들의 prefix (예: 'coverLetter/sessionId/')
   */
  public async deleteByPrefix(prefix: string): Promise<void> {
    try {
      const listResponse = await this.fastify.r2.send(
        new ListObjectsV2Command({
          Bucket: process.env.R2_BUCKET_NAME,
          Prefix: prefix,
        }),
      )

      const objects = listResponse.Contents ?? []
      if (objects.length === 0) {
        this.fastify.log.info(`No files found with prefix: ${prefix}`)
        return
      }

      await Promise.all(
        objects
          .filter((obj) => obj.Key)
          .map((obj) => this.deleteFromR2(obj.Key!)),
      )

      this.fastify.log.info(
        `Deleted ${objects.length} files with prefix: ${prefix}`,
      )
    } catch (error) {
      this.fastify.log.error(
        error,
        `Failed to delete files with prefix: ${prefix}`,
      )
      throw error
    }
  }

  /**
   * Content-Type에서 파일 확장자를 추출
   */
  private getExtensionFromContentType(contentType: string): string {
    const extensionMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    }

    return extensionMap[contentType.toLowerCase()] || 'jpg'
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    fileService: FileService
  }
}

export default fp(
  async (fastify) => {
    const fileService = new FileService(fastify)
    fastify.decorate('fileService', fileService)
  },
  {
    name: 'fileService',
    dependencies: ['r2'],
  },
)
