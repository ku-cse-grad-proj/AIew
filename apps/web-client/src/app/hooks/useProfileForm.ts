'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useRef } from 'react'

import { useProfileUpdatingStore } from '../lib/useProfileUpdatingStore'
import {
  UpdateProfileAction,
  UpdateProfileState,
} from '../profile/edit/_lib/action'

export default function useProfileForm(action: UpdateProfileAction) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState<
    UpdateProfileState,
    FormData
  >(action, { ok: false })

  const setIsUpdating = useProfileUpdatingStore((state) => state.setIsUpdating)
  const hadPendingRef = useRef(false)

  //isPending을 이용해 모달 닫는 규칙 정의
  //업로드 성공시에만 프로필 수정 모달이 닫힌다.
  //모달 닫는 함수는 router.back()
  useEffect(() => {
    if (isPending) {
      hadPendingRef.current = true
      setIsUpdating(true)
      return
    }

    if (!hadPendingRef.current) return

    hadPendingRef.current = false
    setIsUpdating(false)

    if (state.ok) {
      router.back()
    } else {
      //업로드 했는데 실패할 경우 error 호출
      //TODO::toast나 다른 알림 메시지로 변경
      alert(state.error)
    }
  }, [isPending, state.error, router, state.ok, setIsUpdating])

  return { formAction, isPending }
}
