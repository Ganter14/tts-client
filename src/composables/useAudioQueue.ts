import { WSMessageChunk } from '@api/model'
import { createSharedComposable } from '@vueuse/core'
import { ref } from 'vue'

class AsyncArrayAbortError extends DOMException {
  constructor(message = 'Aborted') {
    super(message, 'AbortError')
  }
}

export const isAsyncArrayAbortError = (error: unknown): error is AsyncArrayAbortError =>
  error instanceof AsyncArrayAbortError || (error instanceof DOMException && error.name === 'AbortError')

class AsyncArray<T> {
  items: Array<T>
  readIndex: number
  waiters: Array<(v?: unknown) => void>
  constructor() {
    this.items = []
    this.readIndex = 0
    this.waiters = []
  }

  push(item: T) {
    this.items.push(item)
    this.waiters.shift()?.()
    this.waiters.splice(0).forEach(resolve => resolve())
  }

  reset() {
    this.readIndex = 0
  }

  setReadPosition(index: number) {
    this.readIndex = index
  }

  async next(signal?: AbortSignal): Promise<T> {
    if (this.readIndex < this.items.length && this.items.length !== 0) {
      return this.items[this.readIndex++]
    }

    await new Promise<void>((resolve, reject) => {
      if (signal?.aborted) {
        reject(new AsyncArrayAbortError())
        return
      }

      const onAbort = () => {
        const idx = this.waiters.indexOf(waiter)
        if (idx >= 0) this.waiters.splice(idx, 1)
        signal?.removeEventListener('abort', onAbort)
        reject(new AsyncArrayAbortError())
      }

      const waiter = () => {
        signal?.removeEventListener('abort', onAbort)
        resolve()
      }
      this.waiters.push(waiter)
      signal?.addEventListener('abort', onAbort)
    })

    return this.items[this.readIndex++]
  }
}

export class AudioQueueItem {
  requestId: string
  status: 'queued' | 'playing' | 'completed'
  isAllChunksReady: boolean
  abortController: AbortController
  text?: string // TODO: add speaker and text in server
  speaker?: string // TODO: add speaker and text in server
  chunks: AsyncArray<WSMessageChunk>
  constructor(requestId: string, text?: string, speaker?: string) {
    this.requestId = requestId
    this.text = text || ''
    this.speaker = speaker || ''
    this.isAllChunksReady = false
    this.status = 'queued'
    this.chunks = new AsyncArray<WSMessageChunk>()
    this.abortController = new AbortController()
  }

  addChunk(chunk: WSMessageChunk) {
    this.chunks.push(chunk)
    if (chunk.is_final) {
      this.isAllChunksReady = true
    }
  }

  abort() {
    this.abortController.abort()
  }

  reset() {
    this.abortController = new AbortController()
    this.chunks.reset()
  }

  markComplete() {
    this.status = 'completed'
  }

  markPlaying() {
    this.status = 'playing'
  }

  async *getChunks(fromStart?: boolean) {
    if (fromStart) this.reset()
    while (true) {
      const chunk = await this.chunks.next(this.abortController.signal)
      yield chunk
      if (chunk.is_final) {
        return
      }
    }
  }
}

export const useAudioQueue = createSharedComposable(() => {
  const audioQueue = ref<AsyncArray<AudioQueueItem>>(new AsyncArray<AudioQueueItem>())

  const getAudioItemByRequestId = (requestId: string | null) => {
    return audioQueue.value.items.find(item => item.requestId === requestId)
  }

  const addAudioItem = (requestId: string, text: string, speaker: string) => {
    audioQueue.value.push(new AudioQueueItem(requestId, '', ''))
  }

  const removeItem = (requestId: string) => {
    const itemIndex = audioQueue.value.items.findIndex(item => item.requestId === requestId)
    audioQueue.value.items.splice(itemIndex, 1)
  }

  const addChunk = (chunk: WSMessageChunk) => {
    const item = getAudioItemByRequestId(chunk.request_id)
    item?.addChunk(chunk)
  }

  async function* getNextAudioItem(
    fromRequestId?: string,
    signal?: AbortSignal
  ): AsyncGenerator<AudioQueueItem, never, unknown> {
    let index = audioQueue.value.items.findIndex(item => item.requestId === fromRequestId)
    if (index > 0) audioQueue.value.setReadPosition(index++)
    while (true) {
      yield await audioQueue.value.next(signal)
    }
  }

  return {
    audioQueue,
    addAudioItem,
    removeItem,
    addChunk,
    getNextAudioItem,
    getAudioItemByRequestId
  }
})
