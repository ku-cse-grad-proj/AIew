import { Type } from '@sinclair/typebox'

import SchemaId from '@/utils/schema-id'

export const errorSchema = Type.Object(
  {
    statusCode: Type.Number({ example: 400 }),
    error: Type.String({ example: 'Bad Request' }),
    message: Type.String({ example: 'Invalid Input' }),
  },
  { $id: SchemaId.Error },
)
