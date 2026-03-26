import { defineConfig } from 'orval'

const input = process.env.OPENAPI_SPEC?.trim() || 'http://127.0.0.1:8000/openapi.json'

export default defineConfig({
  ttsServer: {
    input: { target: input },
    output: {
      mode: 'single',
      target: './generated/api/tts-api.ts',
      schemas: './generated/api/model',
      client: 'fetch',
      baseUrl: '',
      mock: false
    }
  }
})
