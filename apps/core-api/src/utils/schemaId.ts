enum SchemaId {
  // REST Schemas
  Error = 'ErrorResponse',
  User = 'UserResponse',

  // WebSocket Schemas
  WsClientReady = 'WsClientReady',
  WsServerQuestionsReady = 'WsServerQuestionsReady',
  WsServerError = 'WsServerError',
}

export default SchemaId
