import { fromPromise } from 'xstate'

/**
 * TTS base64 MP3 재생 promise actor.
 * TDD Red 단계의 stub.
 */
export const audioActor = fromPromise<void, { audioBase64: string }>(
  async () => {
    // TODO(AIEW-237): new Audio(...).play() + onended resolve
  },
)
