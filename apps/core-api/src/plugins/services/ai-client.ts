import axios, { AxiosInstance } from 'axios'
import fp from 'fastify-plugin'

import {
  AiQuestionRequest,
  AnswerEvaluationRequest,
  EvaluationResult,
  FollowUp,
  FollowupRequest,
  QuestionGenerateResponse,
  ShownQuestion,
  UserAnswer,
} from '@/types/ai.types'

// ai-server 응답 타입 정의
interface PdfParseResponse {
  filename: string
  extracted_text: string
}

export class AiClientService {
  private client: AxiosInstance

  constructor() {
    // 환경 변수에서 AI 서버 URL을 가져옵니다.
    const baseURL = process.env.AI_SERVER_URL
    if (!baseURL) {
      throw new Error('AI_SERVER_URL is not defined in environment variables.')
    }

    this.client = axios.create({
      baseURL,
    })
  }

  /**
   * PDF 파일을 AI 서버로 보내 텍스트를 파싱합니다.
   * @param fileBuffer - PDF 파일의 Buffer
   * @param filename - 원본 파일명
   * @param sessionId - 현재 면접 세션 ID
   */
  async parsePdf(
    fileBuffer: Buffer,
    filename: string,
    sessionId: string,
  ): Promise<PdfParseResponse> {
    const formData = new FormData()
    formData.append('file', new Blob([fileBuffer]), filename)

    const response = await this.client.post<PdfParseResponse>(
      '/api/v1/pdf/pdf-text-parsing',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Session-Id': sessionId,
        },
      },
    )
    return response.data
  }

  /**
   * 파싱된 텍스트와 면접 정보를 AI 서버로 보내 질문을 생성합니다.
   * @param data - 질문 생성에 필요한 데이터
   * @param sessionId - 현재 면접 세션 ID
   */
  async generateQuestions(
    data: AiQuestionRequest,
    sessionId: string,
  ): Promise<QuestionGenerateResponse> {
    const response = await this.client.post<QuestionGenerateResponse>(
      '/api/v1/question/question-generating',
      data,
      {
        headers: {
          'X-Session-Id': sessionId,
        },
      },
    )
    return response.data
  }

  /**
   * 사용자의 답변을 AI 서버로 보내 평가를 요청합니다.
   * @param data - 답변 평가에 필요한 데이터
   * @param sessionId - 현재 면접 세션 ID
   */
  async evaluateAnswer(
    data: AnswerEvaluationRequest,
    sessionId: string,
  ): Promise<EvaluationResult> {
    const response = await this.client.post<EvaluationResult>(
      '/api/v1/evaluation/answer-evaluating',
      data,
      {
        headers: {
          'X-Session-Id': sessionId,
        },
      },
    )
    return response.data
  }

  /**
   * 평가 결과를 바탕으로 AI 서버에 꼬리 질문 생성을 요청합니다.
   * @param data - 꼬리 질문 생성에 필요한 데이터
   * @param sessionId - 현재 면접 세션 ID
   */
  async generateFollowUpQuestion(
    data: FollowupRequest,
    sessionId: string,
  ): Promise<FollowUp> {
    const response = await this.client.post<FollowUp>(
      '/api/v1/followup/followup-generating',
      data,
      {
        headers: {
          'X-Session-Id': sessionId,
        },
      },
    )
    return response.data
  }

  /**
   * 출제된 질문을 AI 서버 메모리에 기록합니다.
   * @param data - 출제된 질문 정보
   * @param sessionId - 현재 면접 세션 ID
   */
  async logShownQuestion(
    data: ShownQuestion,
    sessionId: string,
  ): Promise<void> {
    await this.client.post('/api/v1/session-log/log/question-shown', data, {
      headers: {
        'X-Session-Id': sessionId,
      },
    })
  }

  /**
   * 사용자의 답변을 AI 서버 메모리에 기록합니다.
   * @param data - 사용자의 답변 정보
   * @param sessionId - 현재 면접 세션 ID
   */
  async logUserAnswer(data: UserAnswer, sessionId: string): Promise<void> {
    await this.client.post('/api/v1/session-log/log/user-answer', data, {
      headers: {
        'X-Session-Id': sessionId,
      },
    })
  }
}

export default fp(
  async (fastify) => {
    const aiClientService = new AiClientService()
    fastify.decorate('aiClientService', aiClientService)
  },
  {
    name: 'aiClientService',
  },
)

declare module 'fastify' {
  interface FastifyInstance {
    aiClientService: AiClientService
  }
}
