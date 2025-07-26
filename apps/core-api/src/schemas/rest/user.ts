import SchemaId from '../../utils/schemaId'

import ISchema from './interface'

export const userSchema: ISchema = {
  $id: SchemaId.User,
  type: 'object',
  properties: {
    email: {
      type: 'string',
      format: 'email',
      example: 'skgudwls@konkuk.ac.kr',
    },
    name: { type: 'string', example: '나형진' },
    provider: { type: 'string', enum: ['GOOGLE', 'GITHUB'], example: 'GITHUB' },
    createdAt: { type: 'string', format: 'date-time', example: 1752635039582 },
    updatedAt: { type: 'string', format: 'date-time', example: 1752635039582 },
  },
}
