import { Type } from '@sinclair/typebox'

import SchemaId from '@/utils/schema-id'

// GET /me, GET /users/:userId 응답 등에 재사용될 기본 사용자 정보
export const S_User = Type.Object(
  {
    id: Type.String({
      description: '사용자의 고유 ID',
      example: 'clwqv440h000008l55g2d7gfa',
    }),
    email: Type.String({
      format: 'email',
      example: 'skgudwls@konkuk.ac.kr',
    }),
    name: Type.String({ example: '나형진' }),
    pic_url: Type.String({
      example:
        'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=mail@ashallendesign.co.uk',
    }),
    provider: Type.Union([Type.Literal('GOOGLE'), Type.Literal('GITHUB')], {
      example: 'GITHUB',
    }),
    createdAt: Type.String({
      format: 'date-time',
      example: '2025-08-27T12:34:56Z',
    }),
    updatedAt: Type.String({
      format: 'date-time',
      example: '2025-08-27T12:34:56Z',
    }),
  },
  { $id: SchemaId.User },
)

// --- PATCH /users/:userId ---
// 사용자 정보 수정을 위한 요청 본문 스키마
export const S_UserPatchBody = Type.Object(
  {
    name: Type.Optional(Type.String({ example: '새로운 이름' })),
    pic_url: Type.Optional(
      Type.String({
        format: 'uri',
        example: 'https://new.profile.pic/image.png',
      }),
    ),
  },
  { $id: SchemaId.UserPatchBody },
)

// --- DELETE /users/:userId ---
// 사용자 삭제 응답 스키마
export const S_UserDeleteResponse = Type.Object(
  {
    message: Type.String({ example: 'User deleted successfully.' }),
  },
  { $id: SchemaId.UserDeleteResponse },
)
