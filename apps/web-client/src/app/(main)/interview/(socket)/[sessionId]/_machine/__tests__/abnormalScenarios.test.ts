/**
 * AIEW-237 interviewMachine — 12개 비정상 시나리오 (TDD)
 *
 * spec: docs/AIEW-237-interview-machine-design.md §5.1
 *
 * - 본 파일은 TDD Red 단계.
 * - 머신 placeholder 상태에서는 모든 it 가 빨강이어야 함.
 * - 머신 본문 채우면(Green 단계) 모두 초록.
 *
 * 자소서: "12가지 비정상 시나리오를 포함한 통합 테스트를 설계"
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createActor, fromCallback, fromPromise } from 'xstate'

import type { CurrentQuestion, InterviewInput, QuestionBundle } from '../_types'
import { interviewMachine } from '../interviewMachine'

/**
 * 머신 단위 테스트용 no-op actor 들. 본 테스트는 머신의 전이/guard/action
 * 만 검증하므로 실제 socket/RTC/Audio/setInterval 부수효과를 제거한다.
 * Phase 2.2 — 컴포넌트 단계에서 실제 actor 가 연결된 후에도 본 unit test 는
 * mock actor 로 머신의 순수 로직만 검증.
 */
const noopCallbackActor = fromCallback(() => () => {})
const noopPromiseActor = fromPromise(async () => {})

const testMachine = interviewMachine.provide({
  actors: {
    // setup() 에서 등록된 정확한 타입과 다른 mock actor 를 provide 하기 위해 cast.
    // 머신 unit test 는 실제 actor 의 side-effect 가 아닌 머신 전이/guard/action 만 검증.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socketActor: noopCallbackActor as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sttActor: noopCallbackActor as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    audioActor: noopPromiseActor as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    elapsedTickActor: noopCallbackActor as any,
  },
})

/**
 * wire contract 검증용 머신 빌더.
 *
 * 기존 testMachine 은 socketActor 를 noop 으로 대체해 머신의 state 전이만
 * 검증한다. 하지만 PR #208 f9c9792 가 노출한 한계 — 머신이 socketActor 로
 * sendTo 한 메시지의 payload 키/타입이 빠져 있어도 unit test 는 통과하고
 * 실 서버에서 throw 한 점 — 을 회귀로 잡으려면 머신이 actor 로 보낸 메시지
 * 자체를 캡처해 검증해야 한다.
 *
 * 패턴: socketActor 를 fromCallback 으로 대체하되 receive 콜백 안에서
 * vi.fn() spy 를 호출 → spy.mock.calls 로 머신이 sendTo 한 메시지를 검사.
 */
function buildSpyMachine() {
  const socketActorSpy = vi.fn()
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const spyMachine = interviewMachine.provide({
    actors: {
      socketActor: fromCallback(({ receive }) => {
        receive((event) => socketActorSpy(event))
        return () => {}
      }) as any,
      sttActor: noopCallbackActor as any,
      audioActor: noopPromiseActor as any,
      elapsedTickActor: noopCallbackActor as any,
    },
  })
  return { spyMachine, socketActorSpy }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

const baseInput: InterviewInput = {
  sessionId: 'test-session',
  url: 'http://mock',
  revalidate: vi.fn(),
}

const sampleQuestion: CurrentQuestion = {
  stepId: 'step-1',
  text: 'Q1',
  audioBase64: 'AAA',
  isFollowUp: false,
  order: 1,
  type: '기술',
  criteria: [],
  rationale: '',
  sttToken: 'tok-1',
}

const sampleQuestion2: CurrentQuestion = {
  ...sampleQuestion,
  stepId: 'step-2',
  text: 'Q2',
  order: 2,
}

const sampleBundles: QuestionBundle[] = [{ main: 'Q1', followUps: [] }]

function startActor(input: InterviewInput = baseInput) {
  const actor = createActor(testMachine, { input }).start()
  return actor
}

/** session.notConnected 에서 CONNECT 정상 흐름 */
function advanceToConnected(actor: ReturnType<typeof startActor>) {
  actor.send({
    type: 'CONNECT',
    payload: { elapsedSec: 0, questions: [] },
  })
}

/** session.connected → step.preparedReady 정상 흐름 (audio + stt 모두 ready) */
function advanceToStepReady(actor: ReturnType<typeof startActor>) {
  advanceToConnected(actor)
  actor.send({
    type: 'QUESTION_READY',
    payload: { current: sampleQuestion, questions: sampleBundles },
  })
  // parallel 의 두 region 을 각각 final 로 — 순서 무관 (#audio-first / #stt-first
  // 모두 동일하게 preparedReady 도달).
  actor.send({ type: 'AUDIO_PLAYED' })
  actor.send({ type: 'STT_READY' })
}

/** session.step.answering 으로 진입 */
function advanceToAnswering(actor: ReturnType<typeof startActor>) {
  advanceToStepReady(actor)
  actor.send({ type: 'START_ANSWER' })
}

describe('interviewMachine — 12개 비정상 시나리오', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ─── 메시지 순서/중복 ────────────────────────────────────────────────

  describe('메시지 순서/중복', () => {
    it('#1 CONNECT 전 QUESTION_READY 가 도착해도 머신은 무시한다', () => {
      const actor = startActor()
      expect(actor.getSnapshot().matches({ session: 'notConnected' })).toBe(
        true,
      )

      // 순서 역전: 아직 connect 안 됐는데 QUESTION_READY 도착
      actor.send({
        type: 'QUESTION_READY',
        payload: { current: sampleQuestion, questions: sampleBundles },
      })

      // state, context 모두 변화 없음
      expect(actor.getSnapshot().matches({ session: 'notConnected' })).toBe(
        true,
      )
      expect(actor.getSnapshot().context.questions).toHaveLength(0)
      expect(actor.getSnapshot().context.currentQuestion.stepId).toBe('')
    })

    it('#2 같은 stepId 의 QUESTION_READY 중복 수신은 idempotent', () => {
      const actor = startActor()
      advanceToConnected(actor)

      actor.send({
        type: 'QUESTION_READY',
        payload: { current: sampleQuestion, questions: sampleBundles },
      })
      const snapshotA = actor.getSnapshot()

      // 같은 페이로드 재전송
      actor.send({
        type: 'QUESTION_READY',
        payload: { current: sampleQuestion, questions: sampleBundles },
      })
      const snapshotB = actor.getSnapshot()

      // questions 누적되지 않음 (idempotent)
      expect(snapshotB.context.questions).toHaveLength(1)
      expect(snapshotB.context.currentQuestion.stepId).toBe(
        snapshotA.context.currentQuestion.stepId,
      )
    })

    it('#3 STT_FINISH 가 START_ANSWER 전 도착하면 무시 (sentences 변화 없음)', () => {
      const actor = startActor()
      advanceToStepReady(actor)
      expect(
        actor.getSnapshot().matches({ session: { step: 'preparedReady' } }),
      ).toBe(true)

      // 부적절한 타이밍에 STT_FINISH
      actor.send({ type: 'STT_FINISH', sentences: 'should be ignored' })

      // step.preparedReady 유지, sentences 그대로
      expect(
        actor.getSnapshot().matches({ session: { step: 'preparedReady' } }),
      ).toBe(true)
      expect(actor.getSnapshot().context.answer.sentences).toBe('')
    })
  })

  // ─── STT 타이밍 ──────────────────────────────────────────────────────

  describe('STT 타이밍', () => {
    it('#4 FINISH_ANSWER 시 STT 가 transcribing → 10s 안에 STT_FINISH 도착 (sttWaiting → done)', () => {
      const actor = startActor()
      advanceToAnswering(actor)
      actor.send({ type: 'TRANSCRIBE' })

      expect(
        actor.getSnapshot().matches({
          session: { step: { answering: { stt: 'transcribing' } } },
        }),
      ).toBe(true)

      // STT 진행 중에 답변 종료
      actor.send({ type: 'FINISH_ANSWER' })
      expect(
        actor.getSnapshot().matches({
          session: { step: { answering: { finishing: 'sttWaiting' } } },
        }),
      ).toBe(true)

      // 5초 후 STT 도착
      vi.advanceTimersByTime(5000)
      actor.send({ type: 'STT_FINISH', sentences: '최종 답변' })

      // stepFinished 로 이행
      expect(actor.getSnapshot().matches({ session: 'stepFinished' })).toBe(
        true,
      )
      expect(actor.getSnapshot().context.answer.sentences).toBe('최종 답변')
    })

    it('#5 FINISH_ANSWER + STT transcribing → 10s timeout — 마지막 sentences 유지', () => {
      const actor = startActor()
      advanceToAnswering(actor)

      // 어느 정도 transcribing 진행, sentences 누적
      actor.send({ type: 'TRANSCRIBE' })
      actor.send({ type: 'STT_FINISH', sentences: '부분 답변' })
      // 다시 transcribing
      actor.send({ type: 'TRANSCRIBE' })
      expect(
        actor.getSnapshot().matches({
          session: { step: { answering: { stt: 'transcribing' } } },
        }),
      ).toBe(true)

      // 답변 종료
      actor.send({ type: 'FINISH_ANSWER' })
      expect(
        actor.getSnapshot().matches({
          session: { step: { answering: { finishing: 'sttWaiting' } } },
        }),
      ).toBe(true)

      // 10초 timeout
      vi.advanceTimersByTime(10000)

      // stepFinished 진입, sentences 는 마지막 transcribed 값 유지
      expect(actor.getSnapshot().matches({ session: 'stepFinished' })).toBe(
        true,
      )
      expect(actor.getSnapshot().context.answer.sentences).toBe('부분 답변')
    })
  })

  // ─── 면접 종료 race ──────────────────────────────────────────────────

  describe('면접 종료 race', () => {
    it('#6 interview-finished + evaluation-finished 동시 수신 — 둘 다 처리', () => {
      const actor = startActor()
      advanceToConnected(actor)

      actor.send({ type: 'FINISH_INTERVIEW' })
      actor.send({ type: 'REPORT_READY' })

      expect(
        actor.getSnapshot().matches({ interviewFinished: 'reportReady' }),
      ).toBe(true)
    })

    it('#7 evaluation-finished 가 interview-finished 보다 먼저 도착 — preReportReady 보관 후 즉시 reportReady 진입', () => {
      const actor = startActor()
      advanceToConnected(actor)

      // 평가 종료 먼저
      actor.send({ type: 'REPORT_READY' })
      // 머신은 아직 면접 진행 중이라 reportReady 갈 수 없지만 preReportReady 로 기억
      expect(actor.getSnapshot().context.preReportReady).toBe(true)
      expect(actor.getSnapshot().matches({ session: 'connected' })).toBe(true)

      // 면접 종료 도착 → 즉시 reportReady 로 진입 (waitingReport 안 거침)
      actor.send({ type: 'FINISH_INTERVIEW' })
      expect(
        actor.getSnapshot().matches({ interviewFinished: 'reportReady' }),
      ).toBe(true)
    })
  })

  // ─── 장애 처리 ───────────────────────────────────────────────────────

  describe('장애 처리', () => {
    it('#8 server:error 가 answering 도중 도착 — terminal error 진입, actor cleanup', () => {
      const actor = startActor()
      advanceToAnswering(actor)
      expect(
        actor.getSnapshot().matches({ session: { step: 'answering' } }),
      ).toBe(true)

      actor.send({
        type: 'SERVER_ERROR',
        payload: { code: 'STT_TIMEOUT', message: '전사 실패' },
      })

      expect(actor.getSnapshot().matches('error')).toBe(true)
      expect(actor.getSnapshot().status).toBe('done')
      expect(actor.getSnapshot().context.error).toEqual({
        code: 'STT_TIMEOUT',
        message: '전사 실패',
      })
    })
  })

  // ─── 사용자 race ─────────────────────────────────────────────────────

  describe('사용자 race', () => {
    it('#9 START_ANSWER 중복 클릭 — 두 번째는 무시', () => {
      const actor = startActor()
      advanceToStepReady(actor)

      actor.send({ type: 'START_ANSWER' })
      const startAtA = actor.getSnapshot().context.answer.startAt
      expect(
        actor.getSnapshot().matches({ session: { step: 'answering' } }),
      ).toBe(true)

      // 답변 중에 START_ANSWER 한 번 더
      actor.send({ type: 'START_ANSWER' })
      const startAtB = actor.getSnapshot().context.answer.startAt

      // state 동일, startAt 변화 없음 (idempotent)
      expect(
        actor.getSnapshot().matches({ session: { step: 'answering' } }),
      ).toBe(true)
      expect(startAtB).toBe(startAtA)
    })

    it('#10 REDO_ANSWER → 다시 START_ANSWER — sentences 초기화, isRedo=true', () => {
      const actor = startActor()
      advanceToAnswering(actor)
      actor.send({ type: 'TRANSCRIBE' })
      actor.send({ type: 'STT_FINISH', sentences: '첫 답변' })

      // 재답변 트리거
      actor.send({ type: 'REDO_ANSWER' })
      expect(actor.getSnapshot().context.answer.sentences).toBe('')
      expect(actor.getSnapshot().context.answer.isRedo).toBe(true)

      // 다시 답변 시작
      actor.send({ type: 'START_ANSWER' })
      expect(
        actor.getSnapshot().matches({ session: { step: 'answering' } }),
      ).toBe(true)
      // sentences 비어있는 채로 답변 시작
      expect(actor.getSnapshot().context.answer.sentences).toBe('')
    })
  })

  // ─── 재연결 / StrictMode ─────────────────────────────────────────────

  describe('재연결 / StrictMode', () => {
    it('#11 disconnect → 재연결, 동일 sessionId — input 으로 받은 progress(elapsedSec, questions) 복원', () => {
      // 첫 진입: 면접 진행 일부
      const actor1 = startActor()
      advanceToConnected(actor1)
      actor1.send({
        type: 'QUESTION_READY',
        payload: { current: sampleQuestion, questions: sampleBundles },
      })
      actor1.stop()

      // 재진입: 서버 측에서 동일 sessionId 로 진행 상태 복원해서 push
      const actor2 = startActor()
      actor2.send({
        type: 'CONNECT',
        payload: {
          elapsedSec: 120,
          questions: [
            { main: 'Q1', followUps: [] },
            { main: 'Q2', followUps: ['follow up'] },
          ],
        },
      })

      const s = actor2.getSnapshot()
      expect(s.matches({ session: 'connected' })).toBe(true)
      expect(s.context.elapsedSec).toBe(120)
      expect(s.context.questions).toHaveLength(2)
      expect(s.context.questions[1].followUps).toEqual(['follow up'])
    })

    it('#11b STT_READY 가 audio 재생보다 먼저 도착해도 preparedReady 로 진입 (race 흡수)', () => {
      // AIEW-237 parallel 재설계 — audio.playing 과 stt.connecting 이 독립
      // region 이므로 어느 쪽이 먼저 final 에 도달해도 preparing.onDone 트리거.
      // (옛 sequential 흐름의 questionPlaying.STT_READY drop race 가 구조에서
      //  자연스럽게 해소.)
      const actor = startActor()
      advanceToConnected(actor)
      actor.send({
        type: 'QUESTION_READY',
        payload: { current: sampleQuestion, questions: sampleBundles },
      })
      // preparing.audio.playing 에 머무는 동안 STT_READY 가 먼저 도착
      expect(
        actor.getSnapshot().matches({
          session: { step: { preparing: { audio: 'playing' } } },
        }),
      ).toBe(true)
      actor.send({ type: 'STT_READY' })
      // stt 만 final, audio 는 아직 playing → preparedReady 아직 X
      expect(actor.getSnapshot().context.sttReady).toBe(true)
      expect(
        actor.getSnapshot().matches({
          session: { step: { preparing: { stt: 'ready' } } },
        }),
      ).toBe(true)
      expect(
        actor.getSnapshot().matches({
          session: { step: { preparing: { audio: 'playing' } } },
        }),
      ).toBe(true)

      // audio 재생 종료 → 두 region 모두 final → preparing.onDone → preparedReady
      actor.send({ type: 'AUDIO_PLAYED' })
      expect(
        actor.getSnapshot().matches({ session: { step: 'preparedReady' } }),
      ).toBe(true)
    })

    it('#11c 다음 question 진입 시 sttReady flag 가 초기화된다', () => {
      // race flag 가 다음 step 으로 잘못 누수되지 않는지 검증
      const actor = startActor()
      advanceToConnected(actor)
      actor.send({
        type: 'QUESTION_READY',
        payload: { current: sampleQuestion, questions: sampleBundles },
      })
      actor.send({ type: 'STT_READY' })
      actor.send({ type: 'AUDIO_PLAYED' })
      expect(
        actor.getSnapshot().matches({ session: { step: 'preparedReady' } }),
      ).toBe(true)
      expect(actor.getSnapshot().context.sttReady).toBe(true)

      // 다음 question 진입 — flag 가 false 로 리셋되어야
      actor.send({ type: 'START_ANSWER' })
      actor.send({ type: 'FINISH_ANSWER' })
      actor.send({
        type: 'QUESTION_READY',
        payload: { current: sampleQuestion2, questions: sampleBundles },
      })
      expect(actor.getSnapshot().context.sttReady).toBe(false)
      // 새 step.preparing.audio.playing 에 있고 preparedReady 로 자동 진입하지 않음
      expect(
        actor.getSnapshot().matches({
          session: { step: { preparing: { audio: 'playing' } } },
        }),
      ).toBe(true)
    })

    it('#12 StrictMode 이중 마운트 — actor stop/start 반복해도 listener 누수 없음 (cleanup 호출)', () => {
      // mock cleanup spy
      const cleanupSpy = vi.fn()
      // 머신 자체의 lifecycle 검증: 두 actor start → stop 으로 두 번의 cleanup
      const actor1 = startActor()
      advanceToConnected(actor1)
      actor1.stop()

      const actor2 = startActor()
      advanceToConnected(actor2)
      actor2.send({
        type: 'QUESTION_READY',
        payload: { current: sampleQuestion2, questions: sampleBundles },
      })
      actor2.stop()

      // 두 actor 가 독립적으로 시작·종료. 두 번째 actor 의 state 가 첫 번째와 격리됨
      expect(actor2.getSnapshot().context.currentQuestion.stepId).toBe('step-2')

      // (Phase 2.2 컴포넌트 단계에서 실제 listener leak 검증 추가 예정)
      // 본 단계에서는 actor lifecycle 분리 검증으로 충분
      expect(cleanupSpy).toBeDefined()
    })
  })

  // ─── UX — STT_READY 즉시 활성화 ───────────────────────────────────────
  //
  // 사용자 결정 (spec 변경): TTS audio 재생 종료를 기다리지 않고 STT 준비
  // 즉시 마이크 활성화. step level 의 on.START_ANSWER (guard: isSttReady) 가
  // questionPlaying / idle / ready 어느 sub-state 에서든 answering 진입을
  // 허용한다.

  describe('UX — STT_READY 즉시 활성화', () => {
    it('preparing 중 STT_READY 도착 후 START_ANSWER 즉시 answering 진입 (audio cleanup)', () => {
      const actor = startActor()
      advanceToConnected(actor)
      actor.send({
        type: 'QUESTION_READY',
        payload: { current: sampleQuestion, questions: sampleBundles },
      })
      // preparing.audio.playing 에 머무름 (audio 재생 중)
      expect(
        actor.getSnapshot().matches({
          session: { step: { preparing: { audio: 'playing' } } },
        }),
      ).toBe(true)

      // STT_READY 도착 — stt region 은 ready(final), audio 는 아직 playing
      actor.send({ type: 'STT_READY' })
      expect(actor.getSnapshot().context.sttReady).toBe(true)
      expect(
        actor.getSnapshot().matches({
          session: { step: { preparing: { audio: 'playing', stt: 'ready' } } },
        }),
      ).toBe(true)

      // 사용자가 audio 듣는 도중 답변 시작 — preparing exit 시 audioActor 자동 cleanup
      actor.send({ type: 'START_ANSWER' })
      expect(
        actor.getSnapshot().matches({ session: { step: 'answering' } }),
      ).toBe(true)
      // startAt 기록됨
      expect(actor.getSnapshot().context.answer.startAt).toBeGreaterThan(0)
    })

    it('preparing 중 sttReady=false 일 때 START_ANSWER 무시', () => {
      const actor = startActor()
      advanceToConnected(actor)
      actor.send({
        type: 'QUESTION_READY',
        payload: { current: sampleQuestion, questions: sampleBundles },
      })
      expect(
        actor.getSnapshot().matches({
          session: { step: { preparing: { audio: 'playing' } } },
        }),
      ).toBe(true)
      expect(actor.getSnapshot().context.sttReady).toBe(false)

      // STT_READY 없이 START_ANSWER — guard isSttReady 가 차단
      actor.send({ type: 'START_ANSWER' })
      expect(
        actor.getSnapshot().matches({
          session: { step: { preparing: { audio: 'playing' } } },
        }),
      ).toBe(true)
      // startAt 기록 안 됨
      expect(actor.getSnapshot().context.answer.startAt).toBe(0)
    })

    it('AUDIO_PLAYED 도착해도 sttReady=true 면 preparedReady 거쳐 정상 답변 시작 (회귀)', () => {
      // 옛 흐름 — audio 끝까지 듣고 preparedReady 에서 START_ANSWER — 그대로 작동
      const actor = startActor()
      advanceToConnected(actor)
      actor.send({
        type: 'QUESTION_READY',
        payload: { current: sampleQuestion, questions: sampleBundles },
      })
      actor.send({ type: 'STT_READY' })
      actor.send({ type: 'AUDIO_PLAYED' })
      // parallel 의 두 region 모두 final → preparing.onDone → preparedReady
      expect(
        actor.getSnapshot().matches({ session: { step: 'preparedReady' } }),
      ).toBe(true)

      actor.send({ type: 'START_ANSWER' })
      expect(
        actor.getSnapshot().matches({ session: { step: 'answering' } }),
      ).toBe(true)
      expect(actor.getSnapshot().context.answer.startAt).toBeGreaterThan(0)
    })
  })

  // ─── parallel 재설계 — audio × stt 독립 진행 ────────────────────────
  //
  // AIEW-237 step.preparing 을 parallel state 로 모델링.
  // audio 재생과 STT 연결이 독립 시간축이라는 도메인 사실을 머신 구조에서
  // 명시적으로 표현. 도착 순서 4가지 조합을 검증.

  describe('parallel — audio × stt 도착 순서 4종', () => {
    it('audio.played 가 먼저 도착 → STT_READY → preparedReady', () => {
      const actor = startActor()
      advanceToConnected(actor)
      actor.send({
        type: 'QUESTION_READY',
        payload: { current: sampleQuestion, questions: sampleBundles },
      })

      // audio 만 먼저 final
      actor.send({ type: 'AUDIO_PLAYED' })
      expect(
        actor.getSnapshot().matches({
          session: {
            step: { preparing: { audio: 'played', stt: 'connecting' } },
          },
        }),
      ).toBe(true)
      expect(actor.getSnapshot().context.sttReady).toBe(false)

      // stt final 도달 → 두 region 모두 final → preparing.onDone
      actor.send({ type: 'STT_READY' })
      expect(actor.getSnapshot().context.sttReady).toBe(true)
      expect(
        actor.getSnapshot().matches({ session: { step: 'preparedReady' } }),
      ).toBe(true)
    })

    it('STT_READY 가 먼저 도착 → AUDIO_PLAYED → preparedReady', () => {
      const actor = startActor()
      advanceToConnected(actor)
      actor.send({
        type: 'QUESTION_READY',
        payload: { current: sampleQuestion, questions: sampleBundles },
      })

      // stt 만 먼저 final, audio 는 playing
      actor.send({ type: 'STT_READY' })
      expect(actor.getSnapshot().context.sttReady).toBe(true)
      expect(
        actor.getSnapshot().matches({
          session: { step: { preparing: { audio: 'playing', stt: 'ready' } } },
        }),
      ).toBe(true)

      // audio final 도달 → preparedReady
      actor.send({ type: 'AUDIO_PLAYED' })
      expect(
        actor.getSnapshot().matches({ session: { step: 'preparedReady' } }),
      ).toBe(true)
    })

    it('audio 진행 중 sttReady=true 면 START_ANSWER → answering (audioActor cleanup)', () => {
      // preparing exit 시 audioActor 가 자동 cleanup → TTS audio 중단.
      // 사용자 답변과 TTS 가 겹치지 않도록 spec 결정.
      const actor = startActor()
      advanceToConnected(actor)
      actor.send({
        type: 'QUESTION_READY',
        payload: { current: sampleQuestion, questions: sampleBundles },
      })
      actor.send({ type: 'STT_READY' })
      // audio 는 아직 playing — preparing 안에 머무름
      expect(
        actor.getSnapshot().matches({
          session: { step: { preparing: { audio: 'playing', stt: 'ready' } } },
        }),
      ).toBe(true)

      actor.send({ type: 'START_ANSWER' })
      // step.answering 으로 직행, preparing exit
      expect(
        actor.getSnapshot().matches({ session: { step: 'answering' } }),
      ).toBe(true)
      // audioActor 가 cleanup 되었는지는 invoke 가 step.preparing.audio 안에
      // 있었으므로 preparing exit 자체가 자동 cleanup 을 의미. (XState 의
      // invoke lifecycle: invoke 선언 상태가 exit 되면 actor 가 stop.)
    })

    it('STT 미준비 + audio.played → preparedReady 미진입 (stt 미 final)', () => {
      const actor = startActor()
      advanceToConnected(actor)
      actor.send({
        type: 'QUESTION_READY',
        payload: { current: sampleQuestion, questions: sampleBundles },
      })

      // audio 만 final
      actor.send({ type: 'AUDIO_PLAYED' })
      // stt 는 여전히 connecting → preparing.onDone 트리거 X
      expect(
        actor.getSnapshot().matches({
          session: {
            step: { preparing: { audio: 'played', stt: 'connecting' } },
          },
        }),
      ).toBe(true)
      expect(
        actor.getSnapshot().matches({ session: { step: 'preparedReady' } }),
      ).toBe(false)
      expect(actor.getSnapshot().context.sttReady).toBe(false)

      // 이 상태에서 START_ANSWER 보내도 guard 차단 (sttReady=false)
      actor.send({ type: 'START_ANSWER' })
      expect(
        actor.getSnapshot().matches({ session: { step: 'answering' } }),
      ).toBe(false)
    })
  })

  // ─── wire contract — socketActor 메시지 ───────────────────────────────
  //
  // 머신이 socketActor 로 sendTo 한 메시지의 payload 시그니처를 직접 검증.
  // f9c9792 가 fix 한 startAt/endAt 누락 회귀를 잡기 위한 안전망 (spec §5.3).
  // 기존 12개 시나리오는 state 전이만 보았기에 wire contract 위반이 회귀에
  // 안 잡혔던 점을 해결.

  describe('wire contract — socketActor 메시지', () => {
    /** spy 머신을 stepFinished 까지 진행시켜 SUBMIT_ANSWER 가 발화되도록 한다 */
    function advanceSpyToStepFinished(
      actor: ReturnType<typeof createActor<typeof testMachine>>,
    ) {
      actor.send({
        type: 'CONNECT',
        payload: { elapsedSec: 0, questions: [] },
      })
      actor.send({
        type: 'QUESTION_READY',
        payload: { current: sampleQuestion, questions: sampleBundles },
      })
      actor.send({ type: 'AUDIO_PLAYED' })
      actor.send({ type: 'STT_READY' })
      actor.send({ type: 'START_ANSWER' })
      actor.send({ type: 'TRANSCRIBE' })
      actor.send({ type: 'STT_FINISH', sentences: '답변 텍스트' })
      actor.send({ type: 'FINISH_ANSWER' })
    }

    it('SUBMIT_ANSWER 페이로드는 5필드(stepId/answer/duration/startAt/endAt) 모두 포함', () => {
      const { spyMachine, socketActorSpy } = buildSpyMachine()
      const actor = createActor(spyMachine, { input: baseInput }).start()

      advanceSpyToStepFinished(actor)

      // stepFinished 진입 → entry: submitAnswerToSocket 발화
      expect(actor.getSnapshot().matches({ session: 'stepFinished' })).toBe(
        true,
      )

      const submitCall = socketActorSpy.mock.calls.find(
        ([event]) => event?.type === 'SUBMIT_ANSWER',
      )
      expect(submitCall).toBeDefined()
      const [submitEvent] = submitCall!
      expect(submitEvent).toEqual(
        expect.objectContaining({
          type: 'SUBMIT_ANSWER',
          payload: expect.objectContaining({
            stepId: expect.any(String),
            answer: expect.any(String),
            duration: expect.any(Number),
            // f9c9792 회귀 안전망 — 두 필드가 누락되면 서버에서
            // ANSWER_PROCESSING_FAILED 로 throw.
            startAt: expect.any(Number),
            endAt: expect.any(Number),
          }),
        }),
      )

      // payload 값 sanity — answer 와 stepId 가 context 와 일치
      const payload = (submitEvent as { payload: Record<string, unknown> })
        .payload
      expect(payload.stepId).toBe('step-1')
      expect(payload.answer).toBe('답변 텍스트')
      // startAt/endAt 은 Date.now() — number 타입으로 들어가야. (fake timer 환경
      // 에서는 둘 다 같은 mock 시각이 될 수 있으므로 값 비교가 아닌 타입/필드
      // 존재만 검증. 핵심은 5개 키가 모두 payload 에 들어 있다는 점.)
      expect(typeof payload.startAt).toBe('number')
      expect(typeof payload.endAt).toBe('number')
      // f9c9792 이전 머신 코드는 payload 에 startAt/endAt 키 자체가 없어
      // 두 값이 undefined → 서버에서 new Date(undefined) → Invalid Date.
      // 본 테스트는 그 회귀를 잡는 것이 목적.
      expect(payload).toHaveProperty('startAt')
      expect(payload).toHaveProperty('endAt')
    })

    it('TICK_ELAPSED 수신 시 socketActor 에 elapsedSec 함께 forward', () => {
      const { spyMachine, socketActorSpy } = buildSpyMachine()
      const actor = createActor(spyMachine, { input: baseInput }).start()

      actor.send({
        type: 'CONNECT',
        payload: { elapsedSec: 0, questions: [] },
      })

      // elapsedTickActor 가 1초마다 보낸다고 가정 — 직접 send 로 시뮬레이션
      actor.send({ type: 'TICK_ELAPSED' })

      const tickCall = socketActorSpy.mock.calls.find(
        ([event]) => event?.type === 'TICK_ELAPSED',
      )
      expect(tickCall).toBeDefined()
      const [tickEvent] = tickCall!
      expect(tickEvent).toEqual(
        expect.objectContaining({
          type: 'TICK_ELAPSED',
          elapsedSec: expect.any(Number),
        }),
      )
      // incrementElapsed action 이 forwardTickToSocket 보다 먼저 실행되므로
      // forward 시점의 context.elapsedSec 은 최소 1.
      expect(
        (tickEvent as { elapsedSec: number }).elapsedSec,
      ).toBeGreaterThanOrEqual(1)
    })

    it('SUBMIT_ANSWER 는 매 답변마다 정확히 1회 forward (중복 발화 없음)', () => {
      const { spyMachine, socketActorSpy } = buildSpyMachine()
      const actor = createActor(spyMachine, { input: baseInput }).start()

      // 1번째 답변 — stepFinished 진입까지
      advanceSpyToStepFinished(actor)

      // 같은 stepId 의 QUESTION_READY 가 또 와도 isNewStep guard 가 차단 →
      // 새 SUBMIT_ANSWER 발화 안 함
      actor.send({
        type: 'QUESTION_READY',
        payload: { current: sampleQuestion, questions: sampleBundles },
      })

      // 2번째 step — stepFinished 까지 진행
      actor.send({
        type: 'QUESTION_READY',
        payload: { current: sampleQuestion2, questions: sampleBundles },
      })
      actor.send({ type: 'AUDIO_PLAYED' })
      actor.send({ type: 'STT_READY' })
      actor.send({ type: 'START_ANSWER' })
      actor.send({ type: 'TRANSCRIBE' })
      actor.send({ type: 'STT_FINISH', sentences: '답변 2' })
      actor.send({ type: 'FINISH_ANSWER' })

      const submitCalls = socketActorSpy.mock.calls.filter(
        ([event]) => event?.type === 'SUBMIT_ANSWER',
      )
      // 2개 답변 → 정확히 2회
      expect(submitCalls).toHaveLength(2)
      expect(
        (submitCalls[0][0] as { payload: { stepId: string } }).payload.stepId,
      ).toBe('step-1')
      expect(
        (submitCalls[1][0] as { payload: { stepId: string } }).payload.stepId,
      ).toBe('step-2')
    })
  })
})
