/**
 * Access Token 페이로드
 */
export interface AccessTokenPayload {
  userId: string
}

/**
 * Refresh Token 페이로드 (RTR용 jti 포함)
 */
export interface RefreshTokenPayload {
  userId: string
  jti: string
}
