import { Type } from '@sinclair/typebox'

import SchemaId from '@/utils/schemaId'

export const userSchema = Type.Object(
  {
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
