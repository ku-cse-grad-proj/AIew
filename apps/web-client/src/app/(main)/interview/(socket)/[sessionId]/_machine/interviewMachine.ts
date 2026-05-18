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
 *
 * step 구조 (AIEW-237 parallel 재설계)
 *   step
 *     ├─ preparing (parallel: audio × stt)
 *     │   ├─ audio: playing → played(final)         — TTS 재생
 *     │   └─ stt:   connecting → ready(final)       — DataChannel open
 *     │   onDone (audio.played ∧ stt.ready) → preparedReady
 *     ├─ preparedReady (tag answerButtonClickable)  — 정상 흐름의 답변 시작점
 *     └─ answering (parallel: stt × finishing)      — 사용자 답변 진행
 *
 *   step level
 *     on.START_ANSWER (guard isSttReady) → .answering
 *       — preparing 도중에도 sttReady=true 면 즉시 answering 진입,
 *         preparing exit 시 audioActor 자동 cleanup → TTS 중단
 *     invoke sttActor                              — 한 step 동안 1회 invoke
 *
 * audio 와 stt 가 본질적으로 독립적인 시간축이라는 도메인 사실을 parallel
 * statechart 의미론에 1:1 매핑. 이전 sequential 흐름
 * (questionPlaying → idle → ready) 에서 context.sttReady flag + idle.always
 * 가드로 흡수하던 race 가 구조에서 자연스럽게 해소됨.
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
          initial: 'preparing',
          invoke: {
            id: 'sttActor',
            src: 'sttActor',
            input: ({ context }) => ({
              sttToken: context.currentQuestion.sttToken,
            }),
          },
          on: {
            REDO_ANSWER: {
              target: '.preparedReady',
              actions: ['redoAnswer', 'forwardFinishAnswerToStt'],
            },
            // UX 개선 — STT 가 준비되면 audio 재생 종료를 기다리지 않고 바로
            // 답변 시작 가능. preparing 도중에 START_ANSWER 가 도착하면 step
            // 의 sub-state 가 answering 으로 전이 → preparing exit 시 invoke 된
            // audioActor 가 자동 cleanup (사용자 답변과 TTS audio 겹침 방지).
            // sttActor 는 step level 에 있어 preparing → answering 이행에도
            // 살아남아 음성 수신 계속 가능.
            START_ANSWER: {
              guard: 'isSttReady',
              target: '.answering',
              actions: ['assignStartAt', 'forwardStartAnswerToStt'],
            },
          },
          states: {
            // ─── preparing (parallel: audio × stt) ──────────────────────
            //
            // audio 재생과 STT 연결은 본질적으로 독립적 비동기 작업이라는
            // 도메인 사실을 머신 구조에서 명시적으로 표현. 각 region 이
            // 독립 final 도달 시 onDone 으로 preparedReady 진입.
            //
            // - audio.playing → audioActor invoke (TTS 재생)
            //   AUDIO_PLAYED 또는 onDone(Error) → audio.played(final)
            // - stt.connecting → STT_READY 수신 시 stt.ready(final),
            //   markSttReady 로 context.sttReady=true 설정 (step level
            //   on.START_ANSWER guard 가 의존).
            preparing: {
              type: 'parallel',
              onDone: { target: 'preparedReady' },
              states: {
                audio: {
                  initial: 'playing',
                  states: {
                    playing: {
                      invoke: {
                        id: 'audioActor',
                        src: 'audioActor',
                        input: ({ context }) => ({
                          audioBase64:
                            context.currentQuestion.audioBase64 ?? '',
                        }),
                        onDone: { target: 'played' },
                        onError: { target: 'played' },
                      },
                      on: {
                        AUDIO_PLAYED: { target: 'played' },
                      },
                    },
                    played: { type: 'final' },
                  },
                },
                stt: {
                  initial: 'connecting',
                  states: {
                    connecting: {
                      on: {
                        // STT_READY 수신 시 sttReady flag set + ready 진입.
                        // step level on.START_ANSWER 가 isSttReady guard 에
                        // 의존하므로 markSttReady 도 함께 실행.
                        STT_READY: {
                          target: 'ready',
                          actions: 'markSttReady',
                        },
                      },
                    },
                    ready: { type: 'final' },
                  },
                },
              },
            },
            preparedReady: {
              tags: ['answerButtonClickable'],
              // START_ANSWER 는 step level 의 on 으로 통합 (sttReady=true 일 때
              // preparing / preparedReady 어느 sub-state 에서든 answering 진입).
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
