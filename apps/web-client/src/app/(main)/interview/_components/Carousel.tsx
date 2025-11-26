'use client'

import useEmblaCarousel from 'embla-carousel-react'
import { useMemo } from 'react'

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
    for (let i = 0; i < cards.length; i += GROUP_SIZE) {
      result.push(cards.slice(i, i + GROUP_SIZE))
    }
    return result
  }, [cards])

  const dot = `w-8 h-8 rounded-full bg-gray-300`

  return (
    <section className="w-full flex-1 min-h-0 flex flex-col relative">
      {/* Carousel 좌 우 로 이동하는 버튼 */}
      <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
      <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />

      {cards.length === 0 && (
        <div className="h-full flex items-center justify-center">
          please create interview
        </div>
      )}

      <div
        className="overflow-hidden flex-1 min-h-620 flex flex-col"
        ref={emblaRef}
      >
        <div className="flex flex-1 min-h-620">
          {groups.map((group, groupIdx) => (
            <div
              key={`group-${groupIdx}`}
              className="flex-none basis-full px-24 pt-16 pb-20 grid grid-rows-4 lg:grid-cols-2 lg:grid-rows-2 gap-24"
            >
              {group.map((card: Interview) => (
                <InterviewCard
                  key={`${card.id}-${card.updatedAt}`}
                  data={card}
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
