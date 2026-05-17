import { assign, sendTo, setup, stateIn } from 'xstate'

import type {
  CurrentQuestion,
  InterviewContext,
  InterviewEvent,
  InterviewInput,
  QuestionBundle,
} from './_types'
import { audioActor } from './actors/audioActor'
import { elapsedTickActor } from './actors/elapsedTickActor'
import { socketActor } from './actors/socketActor'
import { sttActor } from './actors/sttActor'

/**
 * AIEW-237 interviewMachine
 *
 * spec: docs/AIEW-237-interview-machine-design.md
 *
 * - 면접 진행 화면의 모든 상태 흐름을 단일 hierarchical FSM 으로 모델링
 * - 3개 외부 비동기 인스턴스 (Socket.IO / RTCPeerConnection / HTMLAudioElement) 를
 *   invoked actor 로 포섭
 * - 12가지 비정상 시나리오 (§5.1) 를 구조적으로 차단
 */

const INITIAL_CURRENT_QUESTION: CurrentQuestion = {
  stepId: '',
  text: undefined,
  audioBase64: undefined,
  isFollowUp: false,
  order: 0,
  type: '기술',
  criteria: [],
  rationale: '',
  sttToken: '',
}

export const interviewMachine = setup({
  types: {
    context: {} as InterviewContext,
    input: {} as InterviewInput,
    events: {} as InterviewEvent,
  },
  actors: {
    socketActor,
    sttActor,
    audioActor,
    elapsedTickActor,
  },
  guards: {
    /** 동일 stepId 인 QUESTION_READY 중복 수신 차단 */
    isNewStep: ({ context, event }) => {
      if (event.type !== 'QUESTION_READY') return true
      return event.payload.current.stepId !== context.currentQuestion.stepId
    },
    /** REPORT_READY 가 FINISH_INTERVIEW 보다 먼저 도착했는가 */
    hasPreReportReady: ({ context }) => context.preReportReady,
    /** stt 가 transcribed 상태 (FINISH_ANSWER 시 sttWaiting 우회) */
    sttIsTranscribed: stateIn({
      session: { step: { answering: { stt: 'transcribed' } } },
    }),
    /** STT_READY 가 audio 재생 도중 도착한 경우 idle 진입 즉시 ready 로 직행 */
    isSttReady: ({ context }) => context.sttReady,
  },
  actions: {
    assignConnect: assign(({ event }) => {
      if (event.type !== 'CONNECT') return {}
      return {
        elapsedSec: event.payload.elapsedSec,
        questions: event.payload.questions,
      }
    }),
    assignQuestionReady: assign(({ event }) => {
      if (event.type !== 'QUESTION_READY') return {}
      return {
        currentQuestion: event.payload.current,
        questions: event.payload.questions,
        // 새 step 진입 시 sttReady race flag 초기화 — 이전 step 의 STT_READY
        // 잔재가 다음 step.idle 에서 잘못 트리거되지 않도록.
        sttReady: false,
      }
    }),
    markSttReady: assign({ sttReady: () => true }),
    resetSttReady: assign({ sttReady: () => false }),
    assignStartAt: assign(({ context }) => ({
      answer: { ...context.answer, startAt: Date.now() },
    })),
    assignSentences: assign(({ context, event }) => {
      if (event.type !== 'STT_FINISH') return {}
      return {
        answer: { ...context.answer, sentences: event.sentences },
      }
    }),
    assignEndAt: assign(({ context }) => ({
      answer: { ...context.answer, endAt: Date.now() },
    })),
    markPreReportReady: assign({ preReportReady: () => true }),
    redoAnswer: assign(({ context }) => ({
      answer: { ...context.answer, sentences: '', isRedo: true },
    })),
    assignError: assign(({ event }) => {
      if (event.type !== 'SERVER_ERROR') return {}
      return { error: event.payload }
    }),
    incrementElapsed: assign(({ context }) => ({
      elapsedSec: context.elapsedSec + 1,
    })),
    forwardTickToSocket: sendTo('socketActor', ({ context }) => ({
      type: 'TICK_ELAPSED' as const,
      elapsedSec: context.elapsedSec,
    })),
    forwardStartAnswerToStt: sendTo('sttActor', { type: 'START_ANSWER' }),
    forwardFinishAnswerToStt: sendTo('sttActor', { type: 'FINISH_ANSWER' }),
    submitAnswerToSocket: sendTo('socketActor', ({ context }) => ({
      type: 'SUBMIT_ANSWER' as const,
      payload: {
        stepId: context.currentQuestion.stepId,
        answer: context.answer.sentences,
        duration: Math.max(
          0,
          Math.floor((context.answer.endAt - context.answer.startAt) / 1000),
        ),
        // 서버는 prisma.interviewStep.update 시 answerStartedAt/answerEndedAt
        // (DateTime?) 컬럼에 new Date(payload.startAt)/new Date(payload.endAt) 를
        // 그대로 기록한다. undefined 가 들어오면 Invalid Date 가 되어 Prisma 가
        // throw → server:error ANSWER_PROCESSING_FAILED 로 응답하므로 반드시 함께
        // 전송해야 한다. (옛 Zustand useAnswerControl 의 payload 와 동일 시그니처)
        startAt: context.answer.startAt,
        endAt: context.answer.endAt,
      },
    })),
    callRevalidate: ({ context }) => {
      context.revalidate?.(context.sessionId)
    },
  },
}).createMachine({
  id: 'interview',
  context: ({ input }) => ({
    sessionId: input.sessionId,
    url: input.url,
    elapsedSec: 0,
    questions: [] as QuestionBundle[],
    currentQuestion: { ...INITIAL_CURRENT_QUESTION },
    answer: {
      startAt: 0,
      endAt: 0,
      sentences: '',
      isRedo: false,
    },
    error: null,
    redirectAfterMs: 3000,
    preReportReady: false,
    sttReady: false,
    revalidate: input.revalidate,
  }),
  invoke: [
    {
      id: 'socketActor',
      src: 'socketActor',
      input: ({ context }) => ({
        sessionId: context.sessionId,
        url: context.url,
      }),
    },
    {
      id: 'elapsedTickActor',
      src: 'elapsedTickActor',
    },
  ],
  on: {
    SERVER_ERROR: {
      target: '#error',
      actions: 'assignError',
    },
    TICK_ELAPSED: {
      actions: ['incrementElapsed', 'forwardTickToSocket'],
    },
  },
  initial: 'session',
  states: {
    session: {
      initial: 'notConnected',
      states: {
        notConnected: {
          tags: ['notConnected'],
          on: {
            CONNECT: {
              target: 'connected',
              actions: 'assignConnect',
            },
          },
        },
        connected: {
          id: 'connected',
          on: {
            QUESTION_READY: {
              guard: 'isNewStep',
              target: 'step',
              actions: 'assignQuestionReady',
            },
            FINISH_INTERVIEW: { target: '#interviewFinished' },
            REPORT_READY: {
              actions: 'markPreReportReady',
            },
          },
        },
        step: {
          id: 'step',
          initial: 'questionPlaying',
          invoke: {
            id: 'sttActor',
            src: 'sttActor',
            input: ({ context }) => ({
              sttToken: context.currentQuestion.sttToken,
            }),
          },
          on: {
            REDO_ANSWER: {
              target: '.ready',
              actions: ['redoAnswer', 'forwardFinishAnswerToStt'],
            },
            // STT_READY 는 step 어느 하위 상태에서 받든 sttReady flag 만 set.
            // idle 의 always transition 이 flag 를 보고 ready 로 자동 전이.
            // (questionPlaying 도중 도착하는 race 를 흡수 — DataChannel 'open'
            // 이 audio 재생보다 빨라서 STT_READY 가 drop 되던 버그 fix.)
            STT_READY: {
              actions: 'markSttReady',
            },
            // UX 개선 — STT 가 준비되면 audio 재생 종료를 기다리지 않고 바로
            // 답변 시작 가능. questionPlaying / idle / ready 어느 sub-state 에
            // 있든 sttReady=true 면 START_ANSWER 가 answering 으로 직행.
            // step exit 시 invoke 된 audioActor 가 자동 cleanup 되어 audio 가
            // 중단됨. (옛 흐름 — audio 끝까지 듣고 ready 에서 START — 도 그대로
            // 작동: ready 진입 후 START_ANSWER 시 동일하게 본 핸들러가 처리.)
            START_ANSWER: {
              guard: 'isSttReady',
              target: '.answering',
              actions: ['assignStartAt', 'forwardStartAnswerToStt'],
            },
          },
          states: {
            questionPlaying: {
              invoke: {
                id: 'audioActor',
                src: 'audioActor',
                input: ({ context }) => ({
                  audioBase64: context.currentQuestion.audioBase64 ?? '',
                }),
                onDone: { target: 'idle' },
                onError: { target: 'idle' },
              },
              on: {
                AUDIO_PLAYED: { target: 'idle' },
              },
            },
            idle: {
              // STT_READY 가 questionPlaying 도중 이미 도착했다면 즉시 ready.
              always: [{ guard: 'isSttReady', target: 'ready' }],
              on: {
                // child 핸들러가 outer (step.on.STT_READY) 를 override 하므로
                // markSttReady 도 함께 실행해 context.sttReady=true 보장.
                // (step level 의 on.START_ANSWER guard isSttReady 가 의존.)
                STT_READY: { target: 'ready', actions: 'markSttReady' },
              },
            },
            ready: {
              tags: ['answerButtonClickable'],
              // START_ANSWER 는 step level 의 on 으로 통합됨 (sttReady=true 일 때
              // 어느 sub-state 에서든 answering 진입). ready 진입 후 클릭한
              // 옛 흐름도 동일하게 처리.
            },
            answering: {
              id: 'answering',
              tags: ['answering'],
              type: 'parallel',
              states: {
                stt: {
                  id: 'stt',
                  initial: 'transcribed',
                  states: {
                    transcribed: {
                      on: {
                        TRANSCRIBE: { target: 'transcribing' },
                      },
                    },
                    transcribing: {
                      on: {
                        STT_FINISH: {
                          target: 'transcribed',
                          actions: 'assignSentences',
                        },
                      },
                    },
                    done: { type: 'final' },
                  },
                },
                finishing: {
                  initial: 'idle',
                  states: {
                    idle: {
                      on: {
                        // multi-target: finishing 이동 + stt 도 동시 done.
                        // parallel onDone 은 두 region 모두 final 일 때 트리거되므로
                        // stt 가 transcribing 이어도 명시적으로 done 으로 보내야 함.
                        FINISH_ANSWER: [
                          {
                            guard: 'sttIsTranscribed',
                            target: ['done', '#stt.done'],
                            actions: [
                              'assignEndAt',
                              'forwardFinishAnswerToStt',
                            ],
                          },
                          {
                            target: ['sttWaiting', '#stt.done'],
                            actions: [
                              'assignEndAt',
                              'forwardFinishAnswerToStt',
                            ],
                          },
                        ],
                      },
                    },
                    sttWaiting: {
                      on: {
                        STT_FINISH: {
                          target: 'done',
                          actions: 'assignSentences',
                        },
                      },
                      after: {
                        10000: { target: 'done' },
                      },
                    },
                    done: { type: 'final' },
                  },
                },
              },
              // parallel 의 stt 영역도 자동 done 으로 보내야 onDone 트리거
              // → finishing.done 진입 시 stt 도 강제 done
              onDone: { target: '#stepFinished' },
            },
          },
          // Note: answering parallel 의 onDone 은 두 region 모두 final 일 때 트리거.
          // stt 가 done 으로 못 가면 onDone 안 됨. 본 머신은 finishing 의 done 진입과
          // 동시에 stt 도 done 으로 강제 전이가 필요. always transition 으로 구현.
        },
        stepFinished: {
          id: 'stepFinished',
          // 답변 제출은 socketActor 에 위임. 서버가 다음 next-question 을 push 할
          // 때까지 본 상태에 머무름. QUESTION_READY 도착 시 새 step 으로 자동 전이.
          entry: 'submitAnswerToSocket',
          on: {
            QUESTION_READY: {
              guard: 'isNewStep',
              target: 'step',
              actions: 'assignQuestionReady',
            },
            FINISH_INTERVIEW: { target: '#interviewFinished' },
            REPORT_READY: {
              actions: 'markPreReportReady',
            },
            SUBMIT_FINISH: { target: '#connected' },
          },
        },
      },
    },
    interviewFinished: {
      id: 'interviewFinished',
      initial: 'waitingReport',
      entry: 'callRevalidate',
      states: {
        waitingReport: {
          always: [
            {
              guard: 'hasPreReportReady',
              target: 'reportReady',
            },
          ],
          on: {
            REPORT_READY: { target: 'reportReady' },
          },
        },
        reportReady: {
          after: {
            // redirectAfterMs (context 에서 가져오나 v5 after 는 정적 키)
            3000: { target: 'redirecting' },
          },
        },
        redirecting: {
          type: 'final',
        },
      },
    },
    error: {
      id: 'error',
      type: 'final',
    },
  },
})
