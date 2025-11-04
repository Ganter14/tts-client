import { ref } from 'vue'

enum WebSocketStatus {
  CONNECTING = WebSocket.CONNECTING,
  OPEN = WebSocket.OPEN,
  CLOSING = WebSocket.CLOSING,
  CLOSED = WebSocket.CLOSED,
}
export function useWebsocket(url: string = 'ws://localhost:8000/ws', onMessage: (event: MessageEvent) => void, ) {
  const websocket = ref<WebSocket | null>(null)
  const status = ref<WebSocketStatus>(WebSocketStatus.CLOSED)

  const connect = () => {
    try {
      websocket.value = new WebSocket(url)
      status.value = WebSocketStatus.CONNECTING
      websocket.value?.addEventListener('open', () => {
        status.value = WebSocketStatus.OPEN
        console.log('Connected to websocket')
        websocket.value?.addEventListener('message', onMessage)
      })
      websocket.value?.addEventListener('close', () => {
        console.log('WebSocket closed')
        status.value = WebSocketStatus.CLOSED
      })
      websocket.value?.addEventListener('error', (error) => {
        console.error('WebSocket error', error)
        status.value = WebSocketStatus.CLOSING
      })
    } catch (error) {
      console.error('Failed to connect to websocket', error)
      throw error
    }
  }

  const disconnect = () => {
    websocket.value?.close()
  }


  return {
    websocket,
    connect,
    disconnect,
    status,
  }
}
