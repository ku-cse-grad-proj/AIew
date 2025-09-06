'use client'

import useEmblaCarousel from 'embla-carousel-react'
import { useMemo, useState } from 'react'

import InterviewCard from './InterviewCard'

import {
  NextButton,
  PrevButton,
  usePrevNextButtons,
} from '@/app/hooks/EmblaCarouselArrowButtons'
import { DotButton, useDotButton } from '@/app/hooks/EmblaCarouselDotButton'

// 한 슬라이스에서 보여줄 InterviewCard 개수
const GROUP_SIZE = 4

export default function EmblaCarousel({ cards }: { cards: Interview[] }) {
  const [localCards, setLocalCards] = useState<Interview[]>(cards)
  const [emblaRef, emblaApi] = useEmblaCarousel()

  const { selectedIndex, scrollSnaps, onDotButtonClick } =
    useDotButton(emblaApi)

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi)

  // GROUP_SIZE를 기준으로 2차원 배열 생성
  const groups = useMemo(() => {
    const result: Interview[][] = []
    for (let i = 0; i < localCards.length; i += GROUP_SIZE) {
      result.push(localCards.slice(i, i + GROUP_SIZE))
    }
    return result
  }, [localCards])

  const handleDelete = (id: string) => {
    setLocalCards((prev) => {
      const idx = prev.findIndex((c) => c.id === id)
      if (idx === -1) return prev
      const next = [...prev]
      next.splice(idx, 1) // 삭제 후 뒤 카드들이 자동으로 앞으로 당겨짐

      return next
    })
  }

  const dot = `w-8 h-8 rounded-full bg-gray-300`

  return (
    <section className="w-full flex-1 relative">
      {/* Carousel 좌 우 로 이동하는 버튼 */}
      <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
      <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />

      {localCards.length === 0 && (
        <div className="h-full flex items-center justify-center">
          please create interview
        </div>
      )}

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {groups.map((group, groupIdx) => (
            <div
              key={`group-${groupIdx}`}
              className="flex-none basis-full px-24 pt-16 pb-20 grid grid-rows-4 lg:grid-cols-2 lg:grid-rows-2 gap-24"
            >
              {group.map((localCard: Interview) => (
                <InterviewCard
                  key={localCard.id}
                  data={localCard}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="w-full flex gap-8 items-center justify-center">
        {scrollSnaps.map((_, index) => (
          <DotButton
            key={index}
            onClick={() => onDotButtonClick(index)}
            className={`${dot} ${index === selectedIndex ? ' bg-neutral-text' : ''}`}
          />
        ))}
      </div>
    </section>
  )
}
