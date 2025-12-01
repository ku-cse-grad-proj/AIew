import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

// Google Cloud TTS 요청에 대한 옵션 타입 정의
export interface TTSOptions {
  languageCode?: string
  voiceName?: string
  speakingRate?: number
  pitch?: number
}

export class TTSService {
  private fastify: FastifyInstance

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify
  }

  /**
   * 주어진 텍스트를 음성으로 변환하여 Base64 인코딩된 문자열로 반환합니다.
   * @param text 변환할 텍스트
   * @param options TTS 변환 옵션 (언어, 목소리, 속도 등)
   * @returns Base64 인코딩된 MP3 오디오 데이터
   */
  public async generate(
    text: string,
    options: TTSOptions = {},
  ): Promise<string> {
    const { googleTTS, log } = this.fastify

    // 기본값과 사용자 옵션을 병합
    const input = { text }
    const voice = {
      languageCode: options.languageCode || 'ko-KR',
      name: options.voiceName || 'ko-KR-Standard-C',
    }
    const audioConfig = {
      audioEncoding: 'MP3' as const,
      speakingRate: options.speakingRate || 1.0,
      pitch: options.pitch || 0,
    }

    const request = { input, voice, audioConfig }

    try {
      log.info(`Requesting TTS for text: "${text.substring(0, 30)}..."`)
      const [response] = await googleTTS.synthesizeSpeech(request)

      if (!response.audioContent) {
        throw new Error('TTS response is empty.')
      }

      // Buffer를 Base64 문자열로 변환하여 반환
      return Buffer.from(response.audioContent).toString('base64')
    } catch (error) {
      log.error(error, 'Error generating TTS audio')
      // 에러를 다시 던져서 호출한 쪽에서 처리하도록 함
      throw new Error('Failed to generate speech audio.')
    }
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    ttsService: TTSService
  }
}

export default fp(
  async (fastify) => {
    const ttsService = new TTSService(fastify)
    fastify.decorate('ttsService', ttsService)
  },
  {
    name: 'ttsService',
    dependencies: ['googleTTS', 'googleTTSAuth'],
  },
)
