import { Type } from '@sinclair/typebox'

import SchemaId from '@/utils/schema-id'

// 로그아웃 응답
export const S_AuthLogoutResponse = Type.Object(
  {
    message: Type.String({
      description: '로그아웃 성공 메시지',
      example: 'Logged out successfully',
    }),
  },
  { $id: SchemaId.AuthLogoutResponse, description: '로그아웃 성공 응답' },
)
