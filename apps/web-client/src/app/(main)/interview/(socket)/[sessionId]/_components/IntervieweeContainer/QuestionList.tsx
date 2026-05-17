'use client'

import { InterviewContext } from '../../_machine/interviewContext'

export default function QuestionList() {
  const questions = InterviewContext.useSelector(
    (state) => state.context.questions,
  )
  const currentText = InterviewContext.useSelector(
    (state) => state.context.currentQuestion.text,
  )
  return (
    <div className="w-full h-full p-8 overflow-y-auto">
      {questions.map((q, i) => (
        <div key={i} className="pl-8 py-8">
          {/* main 질문 */}
          <h4
            className={
              q.main === currentText ? 'font-medium' : 'text-neutral-subtext'
            }
          >
            Q{i + 1}. {q.main}
          </h4>
          {/* 꼬리 질문 */}
          {q.followUps.length > 0 && (
            <ul className="pl-16 pl-4 py-4">
              {q.followUps.map((f, j) => (
                <li
                  key={j}
                  className={
                    f === currentText
                      ? 'font-medium p-4'
                      : 'text-neutral-subtext p-4'
                  }
                >
                  Q{i + 1} - {j + 1}. {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}
