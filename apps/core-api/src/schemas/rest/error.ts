import SchemaId from '../../utils/schemaId'

export const errorSchema = {
  $id: SchemaId.Error,
  type: 'object',
  properties: {
    statusCode: { type: 'number', example: 400 },
    error: { type: 'string', example: 'Bad Request' },
    message: { type: 'string', example: 'Invalid Input' },
  },
}
