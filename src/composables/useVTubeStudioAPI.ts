import {
  VtsApiMessageType,
  VtsApiObject,
  VtsAPIStateResponseData,
  VtsAuthenticationRequestData,
  VtsAuthenticationResponseData,
  VtsAuthenticationTokenRequestData,
  VtsAuthenticationTokenResponseData,
  VtsInjectParameterDataRequestData,
  VtsInputParameterListResponseData,
  VtsParameter,
  VtsParameterCreationRequestData
} from '@/types/VTubeStudioTypes'
import { createSharedComposable, useWebSocket } from '@vueuse/core'
import { reactive, ref } from 'vue'
import { useUserSettings } from './useUserSettings'

export const useVTubeStudioAPI = createSharedComposable(() => {
  const pluginName = 'TTS Lipsync Plugin'
  const pluginDeveloper = 'Ganter14'
  const pluginVoiceFrequencyParameterName = 'TTSVoiceFrequency'
  const pluginVoiceVolumeParameterName = 'TTSVoiceVolume'
  const voiceFrequencyParameter = reactive<VtsParameter>({
    name: pluginVoiceFrequencyParameterName,
    addedBy: pluginName,
    value: 0.5,
    min: 0,
    max: 1,
    defaultValue: 0.5
  })
  const voiceVolumeParameter = reactive<VtsParameter>({
    name: pluginVoiceVolumeParameterName,
    addedBy: pluginName,
    value: 0,
    min: 0,
    max: 1,
    defaultValue: 0
  })
  const { vtsAuthenticationToken, vtsPort, vtsAddress } = useUserSettings()
  const requestID = ref<number>(0)
  const isAuthenticated = ref<boolean>(false)
  const isConnected = ref<boolean>(false)
  const isError = ref<boolean>(false)
  const { open, close, status, send } = useWebSocket(`ws://${vtsAddress.value}:${vtsPort.value}`, {
    immediate: false,
    autoReconnect: {
      retries: 5,
      delay: retries => Math.min(1000 * 2 ** (retries - 1), 30000)
    },
    onConnected(_ws) {
      console.log('Connected to VTS API!')
      isConnected.value = true
      sendAPIStateRequest()
    },
    onDisconnected(_ws, event) {
      console.log('Disconnected from VTS API!', event.code)
      isConnected.value = false
    },
    onError(_ws, event) {
      console.error('Error on VTS API:', event)
      isError.value = true
      isConnected.value = status.value === 'OPEN'
    },
    onMessage(_ws, event) {
      const data = JSON.parse(event.data) as VtsApiObject
      if (data.messageType === VtsApiMessageType.API_STATE_RESPONSE) {
        const stateResponse = data as VtsApiObject<VtsAPIStateResponseData>
        if (!stateResponse.data.currentSessionAuthenticated) {
          authenticate()
        } else {
          sendInputParameterListRequest()
        }
      }
      if (data.messageType === VtsApiMessageType.AUTHENTICATION_TOKEN_RESPONSE) {
        vtsAuthenticationToken.value = (
          data as VtsApiObject<VtsAuthenticationTokenResponseData>
        ).data.authenticationToken
        isAuthenticated.value = true
      }
      if (data.messageType === VtsApiMessageType.AUTHENTICATION_RESPONSE) {
        isAuthenticated.value = (data as VtsApiObject<VtsAuthenticationResponseData>).data.authenticated
        if (!isAuthenticated.value) {
          console.error('Not authenticated, sending authentication token request')
          vtsAuthenticationToken.value = ''
          sendAuthTokenRequest()
        } else {
          sendInputParameterListRequest()
        }
      }
      if (data.messageType === VtsApiMessageType.INPUT_PARAMETER_LIST_RESPONSE) {
        const inputParameterListResponse = data as VtsApiObject<VtsInputParameterListResponseData>
        createParametersIfNotExist(inputParameterListResponse.data.customParameters)
      }
    }
  })
  function sendRequest<T>(messageType: VtsApiMessageType, data?: T) {
    const request: VtsApiObject<T | {}> = {
      apiName: 'VTubeStudioPublicAPI',
      apiVersion: '1.0',
      messageType,
      requestID: (requestID.value++).toString(),
      data: data ?? {}
    }
    send(JSON.stringify(request))
  }

  function sendAPIStateRequest() {
    sendRequest(VtsApiMessageType.API_STATE_REQUEST)
  }

  function authenticate() {
    if (!vtsAuthenticationToken.value) {
      sendAuthTokenRequest()
    } else {
      sendAuthRequest()
    }
  }

  function sendAuthTokenRequest() {
    sendRequest<VtsAuthenticationTokenRequestData>(VtsApiMessageType.AUTHENTICATION_TOKEN_REQUEST, {
      pluginName,
      pluginDeveloper
    })
  }

  function sendAuthRequest() {
    sendRequest<VtsAuthenticationRequestData>(VtsApiMessageType.AUTHENTICATION_REQUEST, {
      pluginName,
      pluginDeveloper,
      authenticationToken: vtsAuthenticationToken.value
    })
  }

  function sendInputParameterListRequest() {
    sendRequest(VtsApiMessageType.INPUT_PARAMETER_LIST_REQUEST)
  }

  function sendParameterCreationRequest(parameter: VtsParameter, explanation: string) {
    sendRequest<VtsParameterCreationRequestData>(VtsApiMessageType.PARAMETER_CREATION_REQUEST, {
      parameterName: parameter.name,
      explanation,
      min: parameter.min,
      max: parameter.max,
      defaultValue: parameter.defaultValue
    })
  }

  function checkIfParametersExist(parameters: Array<VtsParameter>) {
    const voiceFrequencyParameterExists = parameters.some(
      parameter => parameter.name === pluginVoiceFrequencyParameterName
    )
    const voiceVolumeParameterExists = parameters.some(parameter => parameter.name === pluginVoiceVolumeParameterName)
    return {
      voiceFrequencyParameterExists,
      voiceVolumeParameterExists
    }
  }

  function createParametersIfNotExist(parameters: Array<VtsParameter>) {
    const { voiceFrequencyParameterExists, voiceVolumeParameterExists } = checkIfParametersExist(parameters)
    if (voiceFrequencyParameterExists && voiceVolumeParameterExists) {
      console.log('All parameters already exist')
      return
    }
    if (!voiceFrequencyParameterExists) {
      sendParameterCreationRequest(voiceFrequencyParameter, 'Frequency of the TTS voice')
      console.log('Created voice frequency parameter')
    }
    if (!voiceVolumeParameterExists) {
      sendParameterCreationRequest(voiceVolumeParameter, 'Volume of the TTS voice')
      console.log('Created voice volume parameter')
    }
    console.log('All parameters created')
  }

  function injectParameterData(volume: number, frequency: number) {
    sendRequest<VtsInjectParameterDataRequestData>(VtsApiMessageType.INJECT_PARAMETER_DATA_REQUEST, {
      faceFound: true,
      mode: 'set',
      parameterValues: [
        {
          id: pluginVoiceFrequencyParameterName,
          value: frequency
        },
        {
          id: pluginVoiceVolumeParameterName,
          value: volume
        }
      ]
    })
  }

  return {
    open,
    close,
    status,
    authenticate,
    isAuthenticated,
    injectParameterData,
    isConnected,
    isError
  }
})
