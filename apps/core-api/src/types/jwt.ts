/**
 * 모든 JWT 토큰이 공유하는 공통 페이로드
 */
export interface BaseTokenPayload {
  userId: string
  deviceId: string
}

/**
 * Access Token 페이로드
 * 고유 필드가 없으므로 우선 type alias로
 * TODO: 고유 필드 생기면 interface로 바꾸기
 */
export type AccessTokenPayload = BaseTokenPayload

/**
 * Refresh Token 페이로드 (RTR용 jti 포함)
 */
export interface RefreshTokenPayload extends BaseTokenPayload {
  jti: string
}
