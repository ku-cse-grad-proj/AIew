import textToSpeech, { TextToSpeechClient } from '@google-cloud/text-to-speech'
import fp from 'fastify-plugin'

declare module 'fastify' {
  export interface FastifyInstance {
    googleTTS: TextToSpeechClient
  }
}

export default fp(
  async (fastify) => {
    const googleTTSClient = new textToSpeech.TextToSpeechClient({})

    fastify.decorate('googleTTS', googleTTSClient)
  },
  {
    name: 'googleTTS',
  },
)
