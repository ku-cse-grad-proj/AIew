import axios, { AxiosInstance } from 'axios'

import { QuestionGenerateResponse } from '@/types/ai.types'

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any, // TODO: QuestionRequest 모델에 맞춰 타입 정의
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
}
