export enum VtsApiMessageType {
  STATE_BROADCAST = 'VTubeStudioApiStateBroadcast',
  STATE_REQUEST = 'VTubeStudioApiStateRequest',
  API_ERROR = 'ApiError',
  AUTHENTICATION_TOKEN_REQUEST = 'AuthenticationTokenRequest',
  AUTHENTICATION_TOKEN_RESPONSE = 'AuthenticationTokenResponse',
  AUTHENTICATION_REQUEST = 'AuthenticationRequest',
  AUTHENTICATION_RESPONSE = 'AuthenticationResponse',
  API_STATE_REQUEST = 'APIStateRequest',
  API_STATE_RESPONSE = 'APIStateResponse',
  INPUT_PARAMETER_LIST_REQUEST = 'InputParameterListRequest',
  INPUT_PARAMETER_LIST_RESPONSE = 'InputParameterListResponse',
  PARAMETER_CREATION_REQUEST = 'ParameterCreationRequest',
  PARAMETER_CREATION_RESPONSE = 'ParameterCreationResponse',
  INJECT_PARAMETER_DATA_REQUEST = 'InjectParameterDataRequest',
  INJECT_PARAMETER_DATA_RESPONSE = 'InjectParameterDataResponse'
}
export type VtsApiObject<T = unknown> = {
  apiName: 'VTubeStudioPublicAPI'
  apiVersion: '1.0'
  messageType: VtsApiMessageType
  requestID: string
  timestamp?: number
  data: T
}

export type VtsApiErrorData = {
  errorID: number
  message: string
}

export type VtsAuthenticationTokenRequestData = {
  pluginName: string
  pluginDeveloper: string
  pluginIcon?: string
}

export type VtsAuthenticationTokenResponseData = {
  authenticationToken: string
}

export type VtsAuthenticationRequestData = {
  pluginName: string
  pluginDeveloper: string
  authenticationToken: string
}

export type VtsAuthenticationResponseData = {
  authenticated: boolean
  reason: string
}

export type VtsAPIStateResponseData = {
  active: boolean
  vTubeStudioVersion: string
  currentSessionAuthenticated: boolean
}

export type VtsParameter = {
  name: string
  addedBy: string
  value: number
  min: number
  max: number
  defaultValue: number
}

export type VtsInputParameterListResponseData = {
  modelLoaded: boolean
  modelName: string
  modelID: string
  customParameters: Array<VtsParameter>
  defaultParameters: Array<VtsParameter>
}

export type VtsParameterCreationRequestData = {
  parameterName: string
  explanation: string
  min: number
  max: number
  defaultValue: number
}

export type VtsParameterCreationResponseData = {
  parameterName: string
}

export type VtsInjectParameterDataRequestData = {
  faceFound: boolean
  mode: 'set' | 'add'
  parameterValues: Array<{
    id: string
    value: number
  }>
}

export type VtsInjectParameterDataResponseData = {}
