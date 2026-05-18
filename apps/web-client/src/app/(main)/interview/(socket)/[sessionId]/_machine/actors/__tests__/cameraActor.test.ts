/**
 * AIEW-237 후속 — cameraActor lifecycle unit test.
 *
 * 검증 포인트:
 * - actor 종료 시 stream tracks 가 모두 stop 됐는가 (카메라 indicator 해제)
 * - MediaRecorder cloned track 도 함께 stop 됐는가
 * - START/STOP_RECORDING 명령이 recorder 의 start/stop 으로 전달되는가
 * - upload socket disconnect 가 호출되는가
 * - getUserMedia await race — cleanup 이 resolve 전에 발생해도 stream leak X
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createActor } from 'xstate'

import { cameraActor } from '../cameraActor'

// ─── socket.io-client mock ─────────────────────────────────────────────────
const socketDisconnect = vi.fn()
const socketEmit = vi.fn()
const socketClose = vi.fn()
const socketRemoveAllListeners = vi.fn()

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: socketEmit,
    disconnect: socketDisconnect,
    close: socketClose,
    removeAllListeners: socketRemoveAllListeners,
  })),
}))

// ─── MediaStream / MediaStreamTrack / MediaRecorder mock ───────────────────
type TrackSpy = {
  stop: ReturnType<typeof vi.fn>
  clone: ReturnType<typeof vi.fn>
  applyConstraints: ReturnType<typeof vi.fn>
  kind: 'video' | 'audio'
}

function makeTrack(kind: 'video' | 'audio'): TrackSpy {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const track: any = {
    kind,
    stop: vi.fn(),
    applyConstraints: vi.fn().mockResolvedValue(undefined),
  }
  track.clone = vi.fn(() => makeTrack(kind))
  return track
}

let originalGetUserMedia: typeof navigator.mediaDevices.getUserMedia | undefined
let lastStreamTracks: TrackSpy[] = []
const recorderInstances: Array<{
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  state: string
  ondataavailable:
    | ((e: {
        data: { size: number; arrayBuffer(): Promise<ArrayBuffer> }
      }) => void)
    | null
  onstop: (() => void) | null
  inputStreamTracks: TrackSpy[]
  mimeType: string
}> = []

class MockMediaRecorder {
  start = vi.fn(() => {
    this.state = 'recording'
  })
  stop = vi.fn(() => {
    this.state = 'inactive'
    if (this.onstop) this.onstop()
  })
  state = 'inactive'
  ondataavailable:
    | ((e: {
        data: { size: number; arrayBuffer(): Promise<ArrayBuffer> }
      }) => void)
    | null = null
  onstop: (() => void) | null = null
  mimeType = 'video/webm'
  inputStreamTracks: TrackSpy[]

  constructor(stream: { getTracks(): TrackSpy[] }) {
    this.inputStreamTracks = stream.getTracks()
    recorderInstances.push(this)
  }
}

// MediaStream mock — 생성자 receive track 배열
class MockMediaStream {
  private tracks: TrackSpy[]
  constructor(tracks: TrackSpy[] = []) {
    this.tracks = tracks
  }
  getTracks() {
    return this.tracks
  }
  getVideoTracks() {
    return this.tracks.filter((t) => t.kind === 'video')
  }
  getAudioTracks() {
    return this.tracks.filter((t) => t.kind === 'audio')
  }
  removeTrack() {}
}

beforeEach(() => {
  socketDisconnect.mockClear()
  socketEmit.mockClear()
  socketClose.mockClear()
  socketRemoveAllListeners.mockClear()
  recorderInstances.length = 0
  lastStreamTracks = []

  // global mocks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).MediaStream = MockMediaStream
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).MediaRecorder = MockMediaRecorder

  if (!navigator.mediaDevices) {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {},
      configurable: true,
    })
  }
  originalGetUserMedia = navigator.mediaDevices.getUserMedia
  navigator.mediaDevices.getUserMedia = vi.fn(async () => {
    const videoTrack = makeTrack('video')
    lastStreamTracks = [videoTrack]
    return new MockMediaStream(lastStreamTracks) as unknown as MediaStream
  })
})

afterEach(() => {
  if (originalGetUserMedia) {
    navigator.mediaDevices.getUserMedia = originalGetUserMedia
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (globalThis as any).MediaStream
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (globalThis as any).MediaRecorder
})

async function flushMicrotasks() {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

describe('cameraActor — lifecycle', () => {
  it('actor stop 시 stream tracks 가 모두 stop 된다 (카메라 indicator 해제)', async () => {
    const parent = createActor(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cameraActor as any,
      { input: { uploadUrl: 'http://mock' } },
    ).start()
    await flushMicrotasks()

    expect(lastStreamTracks).toHaveLength(1)
    expect(lastStreamTracks[0].stop).not.toHaveBeenCalled()

    parent.stop()

    expect(lastStreamTracks[0].stop).toHaveBeenCalled()
    expect(socketDisconnect).toHaveBeenCalled()
    expect(socketClose).toHaveBeenCalled()
  })

  it('START_RECORDING 명령은 cloned track 으로 MediaRecorder 를 시작한다', async () => {
    const parent = createActor(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cameraActor as any,
      { input: { uploadUrl: 'http://mock' } },
    ).start()
    await flushMicrotasks()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parent.send({ type: 'START_RECORDING', stepId: 'step-1' } as any)

    expect(recorderInstances).toHaveLength(1)
    expect(recorderInstances[0].start).toHaveBeenCalledWith(1000)
    // clone() 이 호출돼 cloned video track 이 사용됐는가
    expect(lastStreamTracks[0].clone).toHaveBeenCalled()
  })

  it('STOP_RECORDING 명령은 cloned track 도 함께 stop 한다', async () => {
    const parent = createActor(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cameraActor as any,
      { input: { uploadUrl: 'http://mock' } },
    ).start()
    await flushMicrotasks()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parent.send({ type: 'START_RECORDING', stepId: 'step-1' } as any)
    const rec = recorderInstances[0]
    const clonedTrack = rec.inputStreamTracks[0]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parent.send({ type: 'STOP_RECORDING' } as any)

    expect(rec.stop).toHaveBeenCalled()
    expect(clonedTrack.stop).toHaveBeenCalled()
  })

  it('actor stop 시 녹화 중인 recorder + cloned track 도 함께 해제된다', async () => {
    const parent = createActor(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cameraActor as any,
      { input: { uploadUrl: 'http://mock' } },
    ).start()
    await flushMicrotasks()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parent.send({ type: 'START_RECORDING', stepId: 'step-1' } as any)
    const rec = recorderInstances[0]
    const clonedTrack = rec.inputStreamTracks[0]
    const originalTrack = lastStreamTracks[0]

    parent.stop()

    expect(rec.stop).toHaveBeenCalled() // recorder stop
    expect(clonedTrack.stop).toHaveBeenCalled() // cloned video track stop
    expect(originalTrack.stop).toHaveBeenCalled() // 원본 stream track stop
  })

  it('cleanup 이 getUserMedia resolve 전에 실행되면 늦게 도착한 stream 을 즉시 해제', async () => {
    let resolveStream: (s: MediaStream) => void = () => {}
    const lateStreamTracks: TrackSpy[] = [makeTrack('video')]
    navigator.mediaDevices.getUserMedia = vi.fn(
      () =>
        new Promise<MediaStream>((resolve) => {
          resolveStream = (s) => resolve(s)
        }),
    )

    const parent = createActor(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cameraActor as any,
      { input: { uploadUrl: 'http://mock' } },
    ).start()
    // 아직 getUserMedia resolve 전
    parent.stop()

    // 늦게 도착한 stream
    resolveStream(
      new MockMediaStream(lateStreamTracks) as unknown as MediaStream,
    )
    await flushMicrotasks()

    // disposed 플래그가 늦게 도착한 stream tracks 를 즉시 stop
    expect(lateStreamTracks[0].stop).toHaveBeenCalled()
  })
})
