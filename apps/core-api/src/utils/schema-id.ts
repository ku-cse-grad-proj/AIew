enum SchemaId {
  // REST Schemas
  Error = 'ErrorResponse',
  User = 'UserResponse',
  UserPatchBody = 'UserPatchBody',
  UserDeleteResponse = 'UserDeleteResponse',
  InterviewSessionItem = 'InterviewSessionItem',
  InterviewSessionList = 'InterviewSessionList',
  InterviewSessionPatchBody = 'InterviewSessionPatchBody',
  InterviewSessionDeleteResponse = 'InterviewSessionDeleteResponse',
  ReportsQueryParams = 'ReportsQueryParams',
  ReportItem = 'ReportItem',
  ReportsResponse = 'ReportsResponse',
  ReportsPagesCountResponse = 'ReportsPagesCountResponse',
  ReportsSummaryResponse = 'ReportsSummaryResponse',
  DashboardUserInfos = 'DashboardUserInfos',
  DashboardInterview = 'DashboardInterview',
  DashboardReportItem = 'DashboardReportItem',
  DashboardResponse = 'DashboardResponse',
  DashboardLineGraphResponse = 'DashboardLineGraphResponse',
  DashboardCompanyGraphResponse = 'DashboardCompanyGraphResponse',

  // WebSocket Schemas
  WsClientSubmitAnswer = 'WsClientSubmitAnswer',
  WsServerQuestionsReady = 'WsServerQuestionsReady',
  WsServerNextQuestion = 'WsServerNextQuestion',
  WsServerInterviewFinished = 'WsServerInterviewFinished',
  WsServerError = 'WsServerError',
  WsServerQuestionAudioReady = 'WsServerQuestionAudioReady',
}

export default SchemaId
