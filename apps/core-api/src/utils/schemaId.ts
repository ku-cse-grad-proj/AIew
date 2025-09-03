enum SchemaId {
  // REST Schemas
  Error = 'ErrorResponse',
  User = 'UserResponse',
  UserPatchBody = 'UserPatchBody',
  UserDeleteResponse = 'UserDeleteResponse',
  InterviewListItem = 'InterviewListItem',
  InterviewList = 'InterviewList',

  // WebSocket Schemas
  WsClientSubmitAnswer = 'WsClientSubmitAnswer',
  WsServerQuestionsReady = 'WsServerQuestionsReady',
  WsServerNextQuestion = 'WsServerNextQuestion',
  WsServerInterviewFinished = 'WsServerInterviewFinished',
  WsServerError = 'WsServerError',
}

export default SchemaId
