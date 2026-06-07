# AIEW-237 면접 대비 — AI 면접 서비스 상태 관리 리팩토링

> 자소서 문장: *"WebSocket과 WebRTC 등 3개의 인스턴스가 얽히며 발생하는 상태 충돌 문제를 해결하기 위해 시스템 전체를 유한 상태 머신(FSM)으로 모델링… 12가지 비정상 시나리오를 포함한 통합 테스트를 설계… STT 전사 지연 상황을 대비해 타임아웃 전이 로직을 구축하고 실제 메시지를 주입하며 테스트."*

**한 줄 요약:** 4개 Zustand store + 컴포넌트 ref + 6개 모듈 전역에 흩어져 있던 면접 화면 상태를, **단일 XState FSM + 4개 invoked actor**로 통합하고 **12개 비정상 시나리오 테스트**로 검증했다.

---

## 0. 30초 치트시트 (면접 직전에 이것만)

| 항목 | Before | After | 근거 |
|---|---|---|---|
| 상태 저장소 | Zustand store 3 + answerStore + 컴포넌트 ref | 머신 context 9 필드 | — |
| 모듈 전역 mutable | **6개** | **0개** | actor closure |
| 상태 전이 useEffect | 2개 (암묵적) | 0개 (명시적 전이) | — |
| 소켓 구현 | **2개 공존** (싱글톤 + factory) | 1개 (`socketActor`) | — |
| STT 지연 시 | **영구 정지 가능** (타임아웃 없음) | `after: 30000 → done` | `interviewMachine.ts:411` |
| interview 흐름 테스트 | **0건** | **12개 + wire contract** | `abnormalScenarios.test.ts` |
| 코드 변화 | — | 리팩토링 후 옛 코드 **1,335줄 삭제** | 커밋 `9b8b0eb` |

**핵심 5문장 (암기용)**
1. 세 비동기 인스턴스(Socket/WebRTC/Audio)의 상태가 서로 다른 store에 흩어져, 전이를 `useEffect` 의존성 배열이 암묵적으로 담당 → race.
2. 특히 답변 제출이 `useEffect [endAt, canStopSession]`에 묶여, STT 마지막 전사가 안 오면 **면접이 영구 정지**(타임아웃 부재).
3. 모듈 전역 변수 + `await` race로 orphan socket/RTCPeerConnection/카메라 indicator **leak**, StrictMode 이중 마운트에 취약.
4. 이를 단일 FSM으로 모델링 — 비정상 이벤트는 "현재 상태에 전이가 없으면 무시"로 **구조적 차단**, STT 지연은 `sttWaiting + after(30s)` 타임아웃 전이로 해결.
5. mock actor를 주입해 머신의 순수 전이만 단위 테스트 → **12개 비정상 시나리오 + wire contract** 회귀 안전망 확보.

---

## 1. 파일 지도 (코드 위치)

```
apps/web-client/src/app/(main)/interview/(socket)/[sessionId]/_machine/
├─ interviewMachine.ts                 ← FSM 본체 (단일 hierarchical statechart)
├─ _types.ts                           ← context / event 타입
├─ actors/
│  ├─ socketActor.ts                   ← Socket.IO   (옛 interviewStore.ts 대체)
│  ├─ sttActor.ts                      ← WebRTC/STT  (옛 sttStore.ts 대체)
│  ├─ audioActor.ts                    ← TTS 재생    (HTMLAudioElement)
│  └─ cameraActor.ts                   ← 카메라/녹화  (옛 Interviewee.tsx useEffect 대체)
└─ __tests__/abnormalScenarios.test.ts ← 12개 비정상 시나리오 + wire contract
```

**JIRA:** AIEW-237 · **삭제 커밋:** `9b8b0eb` (옛 Zustand store/hook 12파일 제거)

---

## 2. 상태 다이어그램 (말로 설명할 때 그릴 그림)

```
session
  notConnected ──CONNECT──▶ connected ──QUESTION_READY──▶ step ──▶ stepFinished
                                                            │            │
  step                                                      └─QUESTION_READY(새 step)
    ├─ preparing  (parallel:  audio × stt)   ← TTS재생 ∥ DataChannel open (독립 시간축)
    │     audio: playing → played(final)
    │     stt:   connecting → ready(final)
    │     onDone(둘 다 final) ─▶ preparedReady
    ├─ preparedReady   (답변 버튼 활성)
    └─ answering  (parallel: stt × finishing)
          finishing: idle → sttWaiting ──after(30s)──▶ done   ← STT 지연 타임아웃
                                       └──STT_FINISH──▶ done

interviewFinished ─ waitingReport → reportReady → (3s) → redirecting
error  (terminal final)   ← SERVER_ERROR 시 진입, 모든 actor 자동 cleanup
```

**왜 parallel?** audio 재생과 STT 연결은 본질적으로 독립된 시간축. sequential로 묶으면 도착 순서(audio먼저 vs stt먼저)마다 race가 생기지만, parallel region으로 두면 어느 쪽이 먼저 final에 도달해도 `onDone`이 안전하게 트리거됨.

---

## 3. 문제 카드 5장 (Before 코드 → 문제 → After 해결 → 테스트)

### 카드 1. STT 전사 지연 → 면접 영구 정지 ⭐ 자소서의 그 장애

**Before** — `useAnswerControl.tsx`
```ts
useEffect(() => {
  if (endAt && canStopSession) {   // 두 store 값의 교집합
    if (isRedo) { setSentences(''); setIsRedo(false) }
    else { submit() }
    answerReset()
  }
}, [endAt, canStopSession])
```
**문제:** `canStopSession`은 OpenAI Realtime의 마지막 segment가 도착해야 `true`. **그 메시지가 영영 안 오면 이 useEffect는 영원히 안 돌고 답변 제출 불가 → 면접 멈춤.** 타임아웃·폴백이 전혀 없음.

**After** — `interviewMachine.ts:396-414`
```ts
sttWaiting: {
  on: { STT_FINISH: { target: 'done', actions: 'assignSentences' } },
  after: { 30000: { target: 'done' } },   // 극단적 race 방어 (10s→30s 보수적 확장)
}
```
**테스트:** `#4` (5초 후 STT 도착 → done), `#5` (30초 timeout → 마지막 sentences 유지). `vi.advanceTimersByTime()`으로 **실제 시간을 주입**해 검증.

---

### 카드 2. 모듈 전역 변수 → leak + 테스트 불가

**Before** — `sttStore.ts:23-27`, `interviewStore.ts:78`
```ts
let peerConnection: RTCPeerConnection | null   // 모듈 전역
let mediaStream: MediaStream | null
let dataChannel: RTCDataChannel | null
const handlersBound = { value: false }         // 중복 바인딩 방지 임시방편
```
**문제:** 모듈이 살아있는 한 영구 존속 → 컴포넌트 언마운트와 무관하게 남아 leak. 테스트마다 같은 전역을 공유해 **단위 테스트 격리 불가** (이 시기 interview 테스트 0건).

**After:** 모든 mutable 상태를 actor **closure**로 격리 (`socketActor.ts:71`, `sttActor.ts:38-49`). 정량: *모듈 전역 6 → 0*.

---

### 카드 3. await race → orphan 인스턴스 (StrictMode 취약)

**Before** — `sttStore.ts` `connect()`
```ts
const ms = await navigator.mediaDevices.getUserMedia({ audio: true })
// ... await pc.createOffer() ... await fetch(SDP) ...
peerConnection = pc; mediaStream = ms  // disconnect()가 이 사이에 돌아도 감지 불가
```
**문제:** `disconnect()`가 await 도중 실행돼도 막을 방법이 없음. 늦게 resolve된 `pc`/`ms`가 전역에 재할당 → **마이크/카메라 indicator가 켜진 채 leak**. React 19/Next.js dev 이중 effect에 그대로 노출.

**After:** 각 actor의 `disposed` 플래그가 **모든 await 경계에서 `if (disposed) return`** (`sttActor.ts:96,158,161,172,181`). actor cleanup이 XState invoke lifecycle에 자동 위임.
**테스트:** `#12` (stop/start 반복 격리), `#11b` (STT_READY가 audio보다 먼저 와도 흡수).

---

### 카드 4. 비동기 콜백 안의 throw → 안 잡힘 + error 흐름 부재

**Before** — `interviewStore.ts`
```ts
s.on('server:next-question', (payload) => {
  set((state) => { if (!questionText) throw new Error('...') })  // socket 콜백
})
s.on('server:error', (err) => { set({ error: ... }); throw new Error('...') })
```
**문제:** 이 `throw`는 **소켓 이벤트 콜백(비동기 스택)** 안 → `connect`의 `try/catch`에 절대 도달 못함. unhandled 또는 조용히 소실. 에러가 나도 STT/카메라는 계속 살아있음 (terminal 정리 없음).

**After:** `SERVER_ERROR → #error` terminal final (`interviewMachine.ts:213-216, 478-481`). 진입 시 머신 종료 → 모든 invoked actor 자동 cleanup.
**테스트:** `#8` (`status === 'done'` + actor cleanup 검증).

---

### 카드 5. 메시지 순서 역전 / 중복 수신 방어 부재

**Before:** `server:next-question` 핸들러가 **연결 여부·중복 여부와 무관하게 무조건 실행**. CONNECT 전에 와도 `current` 설정되고, 같은 stepId가 두 번 오면 questions 배열에 중복 누적.

**After:**
- `notConnected` 상태엔 `QUESTION_READY` 전이가 **아예 없음** → 자동 무시 (`#1`).
- `isNewStep` guard (`interviewMachine.ts:75-79`)가 동일 stepId 차단 → idempotent (`#2`).

---

## 4. 12개 비정상 시나리오 빠른 색인

`__tests__/abnormalScenarios.test.ts`

| # | 카테고리 | 시나리오 | 방어 메커니즘 |
|---|---|---|---|
| 1 | 순서 역전 | CONNECT 전 QUESTION_READY | notConnected에 전이 없음 |
| 2 | 중복 | 같은 stepId QUESTION_READY | `isNewStep` guard |
| 3 | 순서 역전 | START_ANSWER 전 STT_FINISH | 해당 상태에 전이 없음 |
| 4 | STT 지연 | FINISH 후 5초 뒤 STT 도착 | `sttWaiting → STT_FINISH` |
| 5 | STT 지연 | 30초 timeout | `sttWaiting → after(30s)` |
| 6 | 종료 race | finished + report 동시 | 둘 다 처리 |
| 7 | 종료 race | report가 finish보다 먼저 | `preReportReady` flag |
| 8 | 장애 | answering 중 server:error | `#error` terminal |
| 9 | 사용자 race | START_ANSWER 중복 클릭 | answering에서 무시 |
| 10 | 사용자 race | REDO → 재시작 | sentences 초기화 |
| 11 | 재연결 | 동일 sessionId 진행 복원 | input으로 progress 주입 |
| 12 | StrictMode | 이중 마운트 격리 | actor lifecycle 분리 |

(+ `#11b/#11c` parallel race, wire contract 3종까지 포함)

---

## 5. 예상 꼬리질문 & 모범답안

**Q1. 왜 Redux/Zustand 대신 XState(상태머신)인가요?**
> Zustand는 "값을 담는" 데는 좋지만 "어떤 상태에서 어떤 이벤트가 유효한가"를 강제하지 못합니다. 우리 문제의 본질은 값 저장이 아니라 **전이 규칙**이었습니다. 예를 들어 "연결 전 next-question은 무시", "답변 중 중복 START_ANSWER 무시" 같은 규칙을 Zustand에선 매번 if문으로 흩뿌려야 했고, 그게 빠지면 곧 버그였습니다. statechart는 전이를 선언적으로 표현해 **불가능한 상태 전이를 구조적으로 차단**하고, 그대로 테스트 대상이 됩니다.

**Q2. STT 타임아웃을 왜 하필 30초로 잡았나요?**
> 처음엔 10초였는데, 긴 답변에선 OpenAI Realtime의 마지막 transcription이 5~10초 지연되는 게 빈번했습니다. 10초 timeout이 정상 답변까지 잘라 sentences 누락을 유발했죠. 그래서 보수적으로 30초로 확장했습니다. 중요한 건 이 timeout은 정상 경로용이 아니라 **STT_FINISH가 영영 안 오는 극단 race만 방어**하는 안전망이라는 점입니다. 정상이면 STT_FINISH가 먼저 도착해 즉시 빠져나갑니다. (`interviewMachine.ts:403-410` 주석)

**Q3. preparing을 왜 parallel state로?**
> audio 재생과 STT(WebRTC) 연결은 시작은 같이 하지만 끝나는 시점이 독립적입니다. sequential로 두면 "누가 먼저 끝나느냐"로 4가지 경우의 수가 생기고 각각 race입니다. parallel region 두 개로 두면 각자 final에 도달하고, **둘 다 final일 때만 onDone**이 트리거되므로 도착 순서와 무관하게 안전합니다. 도착 순서 4종을 테스트로 못 박았습니다.

**Q4. StrictMode 이중 마운트 race를 정확히 어떻게 막았나요?**
> actor closure 안에 `disposed` 플래그를 두고, getUserMedia/SDP fetch 등 **모든 await 경계 직후에 `if (disposed) return`**으로 끊습니다. cleanup이 await 도중 실행되면 늦게 resolve된 stream/peerConnection을 그 자리에서 stop/close하고 사이드이펙트(sendBack)도 전면 차단합니다. 이전엔 모듈 전역이라 "이미 정리됐다"는 사실 자체를 표현할 수가 없었습니다.

**Q5. 테스트는 실제 socket/WebRTC를 띄웠나요?**
> 아니요. 머신의 책임은 **전이/guard/action**이고 actor는 외부 I/O입니다. 그래서 actor를 no-op mock으로 주입(`interviewMachine.provide`)해 머신의 순수 로직만 결정론적으로 검증했습니다. 다만 머신이 actor로 보내는 메시지의 payload 계약(startAt/endAt 누락 회귀)은 spy actor로 발화 메시지를 캡처해 별도 검증했습니다(wire contract 테스트).

**Q6. 이 경험이 우리 회사(옴니채널) 환경에 어떻게 적용되나요?**
> 매장·물류센터처럼 여러 비동기 주체가 메시지로 얽히는 환경의 본질적 문제는 "순서 역전·중복·지연"입니다. 저는 이걸 상태머신으로 모델링해 정상 흐름만이 아니라 비정상 전이를 구조적으로 차단하고, 그걸 **메시지 주입 테스트로 증명**하는 방식을 체화했습니다. 데이터 정합성이 핵심인 환경에서 그대로 쓰일 역량입니다.

---

## 6. 함정 질문 대비 (솔직하게 인정할 부분)

- **"카메라 actor는 머신 흐름에 영향 안 주는데 왜 actor로?"** → 흐름엔 무관하지만 **생명주기**가 핵심. interviewFinished 진입 시 머신이 사라지며 자동 cleanup → 카메라 indicator leak이 구조적으로 차단. UX-level 에러(CAMERA_ERROR)는 context에만 기록.
- **"리팩토링으로 기능이 바뀐 건 없나?"** → 동작은 보존(옛 store 로직 주석으로 출처 명시). 추가된 건 STT 즉시 활성화 UX 1건과 race 방어. 테스트로 회귀 없음 확인.
- **"30초나 멈춰 있으면 그것도 UX 문제 아닌가?"** → 맞다. 그래서 정상 경로(STT_FINISH 우선)와 분리했고, 30초는 어디까지나 최후의 안전망. 정상 답변에선 거의 닿지 않는다.
