enum SchemaId {
  // REST Schemas
  Error = 'ErrorResponse',
  User = 'UserResponse',
  Interview = 'InterviewResponse',

  // WebSocket Schemas
  WsClientReady = 'WsClientReady',
  WsServerQuestionsReady = 'WsServerQuestionsReady',
  WsServerError = 'WsServerError',
}

export default SchemaId
