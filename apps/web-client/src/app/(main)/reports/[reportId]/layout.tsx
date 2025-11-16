import { ReactNode } from 'react'

import ListSection from '../_components/ListSection'

import { QuestionList } from './questions/_types'

export default function ReportLayout({ children }: { children: ReactNode }) {
  const questions = getQuestions()

  //List에 사용될 데이터 추출
  const questionList: QuestionList[] = questions.map((main) => ({
    id: main.id,
    question: main.question,
    followUps: main.tailSteps.map((step) => ({
      id: step.id,
      question: step.question,
    })),
  }))
  const cardStyle = 'w-full h-full bg-neutral-card rounded-[20px] shadow-box'
  return (
    <div className="w-full h-full flex p-24 gap-24">
      <div className="flex-7">{children}</div>
      <ListSection
        className={`flex-3 min-h-0 ${cardStyle}`}
        questionList={questionList}
      />
    </div>
  )
}

//TODO:: 실제 data로 변경
function getQuestions() {
  return [
    {
      id: 'cmfkkxt410014kvdh09w1zwf0',
      aiQuestionId: 'q1',
      type: 'PERSONALITY',
      question:
        '과거 프로젝트에서 창의적인 문제 해결을 통해 팀워크를 발휘한 경험을 구체적으로 설명해 주세요.',
      answer: ' 인터뷰 중에 챙긴 운동? 뭔가',
      score: 1,
      createdAt: '2025-09-15T03:43:58.370Z',
      updatedAt: '2025-09-23T08:09:08.803Z',
      rationale:
        "지원자는 '창의적인 문제 해결'과 '팀워크'를 회사의 핵심 가치로 언급하며 지원 동기를 설명했습니다. 이를 바탕으로 인재상과의 적합성을 평가하기 위해 질문을 구성했습니다.",
      criteria: ['창의적인 문제 해결', '팀워크'],
      skills: ['협업', '문제 해결'],
      estimatedAnswerTimeSec: 60,
      answerDurationSec: 4,
      answerStartedAt: null,
      answerEndedAt: null,
      strengths: [],
      improvements: [
        '답변의 명확성과 관련성을 높이기 위해 질문에 대한 이해와 준비가 필요합니다.',
      ],
      redFlags: [
        '질문에 전혀 관련 없는 답변을 제공하여 질문의 의도를 파악하지 못한 것으로 보입니다.',
      ],
      feedback:
        '지원자의 답변은 질문과 전혀 관련이 없으며, 질문의 의도를 이해하지 못한 것으로 보입니다. 이는 면접 준비가 부족했거나 질문을 잘못 이해했을 가능성을 시사합니다. 창의적인 문제 해결과 팀워크에 대한 구체적인 경험을 설명해야 했지만, 전혀 관련 없는 답변을 제공했습니다. 따라서, 지원자는 질문의 의도를 명확히 이해하고, 관련된 경험을 구체적으로 설명할 수 있도록 준비해야 합니다. 이는 면접에서 중요한 역량을 평가하는 데 필수적입니다. 또한, 답변의 명확성과 관련성을 높이기 위해 면접 전에 예상 질문에 대한 답변을 준비하는 것이 좋습니다.',
      interviewSessionId: 'wcj1wvytxxljcr6h6z2z2u7h',
      parentStepId: null,
      tailSteps: [
        {
          id: 'cmfw9r5790007j8flt5mtfot7',
          aiQuestionId: 'q1-fu1',
          type: 'PERSONALITY',
          question:
            '과거 프로젝트에서 직면했던 특정 문제를 설명하고, 그 문제를 해결하기 위해 어떤 창의적인 접근 방식을 사용했으며, 팀원들과 어떻게 협력했는지 구체적으로 설명해 주세요.',
          answer: ' 왜? 리스트로 보여줍니다.',
          score: 1,
          createdAt: '2025-09-23T08:04:05.782Z',
          updatedAt: '2025-09-23T08:08:19.590Z',
          rationale:
            '지원자가 질문에 대한 명확한 답변을 제공하지 않았으므로, 구체적인 사례를 통해 창의적인 문제 해결과 팀워크를 어떻게 발휘했는지 확인할 필요가 있습니다.',
          criteria: ['창의적인 문제 해결', '팀워크'],
          skills: ['협업', '문제 해결'],
          estimatedAnswerTimeSec: 45,
          answerDurationSec: 4,
          answerStartedAt: null,
          answerEndedAt: null,
          strengths: [],
          improvements: [
            '지원자가 문제 해결 및 팀워크에 대한 구체적인 설명을 제공하지 않았습니다.',
          ],
          redFlags: [
            '지원자의 답변이 질문에 대한 직접적인 응답을 포함하지 않았습니다.',
          ],
          feedback:
            '지원자의 답변은 질문에 대한 직접적인 응답을 포함하지 않았으며, 문제 해결 및 팀워크에 대한 구체적인 설명이 부족합니다. 이는 지원자가 과거 프로젝트에서의 경험을 통해 얻은 교훈이나 역량을 충분히 설명하지 못했음을 나타냅니다. 특히, 창의적인 문제 해결 방법과 팀원들과의 협력 방식을 구체적으로 설명하지 않아, 지원자의 협업 능력과 문제 해결 능력을 평가하기 어렵습니다. 이러한 부분은 웹개발자 역할에서 중요한 역량이므로, 향후 인터뷰에서는 구체적인 사례와 함께 본인의 기여도를 명확히 설명하는 것이 필요합니다. 예를 들어, 특정 문제를 어떻게 창의적으로 해결했는지, 팀원들과의 협력 과정에서 어떤 역할을 했는지를 명확히 설명하는 것이 좋습니다. 이러한 개선이 이루어질 경우, 지원자의 역량을 보다 정확히 평가할 수 있을 것입니다.',
          interviewSessionId: 'wcj1wvytxxljcr6h6z2z2u7h',
          parentStepId: 'cmfkkxt410014kvdh09w1zwf0',
        },
        {
          id: 'cmfw9woa5000bj8fl6e33eetq',
          aiQuestionId: 'q1-fu2',
          type: 'PERSONALITY',
          question:
            '과거 프로젝트에서 직면했던 문제 중 하나를 구체적으로 설명하고, 그 문제를 해결하기 위해 어떤 창의적인 방법을 사용했는지, 그리고 팀원들과의 협력 과정에서 어떤 역할을 했는지 자세히 이야기해 주세요.',
          answer:
            ' 기능들이 있는 것들이 유스케이스다. 자 이거는 박스가 빠졌는데 오늘 박스가요. 서울에 나라가. 이건 어딜까요? 은행이지 뭐.',
          score: 1,
          createdAt: '2025-09-23T08:08:23.790Z',
          updatedAt: '2025-09-30T04:27:58.265Z',
          rationale:
            '지원자가 문제 해결 및 팀워크에 대한 구체적인 설명을 제공하지 않았으므로, 구체적인 사례를 통해 창의적인 문제 해결과 팀워크 능력을 평가할 필요가 있습니다.',
          criteria: ['창의적인 문제 해결', '팀워크'],
          skills: ['협업', '문제 해결'],
          estimatedAnswerTimeSec: 45,
          answerDurationSec: 25,
          answerStartedAt: '2025-09-30T04:27:25.114Z',
          answerEndedAt: '2025-09-30T04:27:51.014Z',
          strengths: [],
          improvements: ['답변의 명확성과 구체성을 높여야 합니다.'],
          redFlags: [
            '답변이 질문과 관련이 없고 이해하기 어렵습니다.',
            '문제 해결 및 팀워크 관련 정보가 전혀 없습니다.',
          ],
          feedback:
            '지원자의 답변은 질문에 대한 명확한 응답을 제공하지 못했습니다. 과거 프로젝트에서 직면했던 문제와 그 해결 방법, 그리고 팀원들과의 협력 과정에 대한 구체적인 설명이 필요합니다. 현재 답변은 질문과 관련이 없고, 이해하기 어려운 내용으로 구성되어 있어 평가 기준을 충족하지 못했습니다. 창의적인 문제 해결과 팀워크를 평가하기 위해서는 구체적인 사례와 본인의 역할, 기여도를 명확히 설명해야 합니다. 이러한 정보가 부족하면 지원자의 역량을 제대로 평가하기 어렵습니다. 다음에는 질문의 핵심에 맞춰 구체적이고 명확한 답변을 준비하는 것이 필요합니다.',
          interviewSessionId: 'wcj1wvytxxljcr6h6z2z2u7h',
          parentStepId: 'cmfkkxt410014kvdh09w1zwf0',
        },
        {
          id: 'cmfw9xpfv000fj8fl3pqiac8v',
          aiQuestionId: 'q1-fu3',
          type: 'PERSONALITY',
          question:
            '과거 프로젝트에서 직면했던 특정 문제를 어떻게 창의적으로 해결했으며, 그 과정에서 팀원들과의 협업은 어떤 방식으로 이루어졌는지 구체적으로 설명해 주세요.',
          answer: '',
          score: 1,
          createdAt: '2025-09-23T08:09:11.947Z',
          updatedAt: '2025-09-30T07:43:30.877Z',
          rationale:
            '사용자의 답변이 질문과 관련성이 떨어지므로, 구체적인 경험을 통해 창의적인 문제 해결과 팀워크를 어떻게 발휘했는지 명확히 이해할 필요가 있습니다.',
          criteria: ['창의적인 문제 해결', '팀워크'],
          skills: ['협업', '문제 해결'],
          estimatedAnswerTimeSec: 45,
          answerDurationSec: 5,
          answerStartedAt: '2025-09-30T07:43:15.985Z',
          answerEndedAt: '2025-09-30T07:43:21.861Z',
          strengths: [],
          improvements: ['지원자가 구체적인 사례를 제시하지 않았습니다.'],
          redFlags: ['지원자가 질문에 대한 답변을 제공하지 않았습니다.'],
          feedback:
            '지원자는 질문에 대한 답변을 제공하지 않았습니다. 이는 지원자가 과거 프로젝트에서의 문제 해결 경험이나 팀워크 경험을 구체적으로 설명할 수 있는 기회를 놓쳤음을 의미합니다. 창의적인 문제 해결과 팀워크는 웹 개발에서 중요한 역량이므로, 이러한 경험을 명확히 설명할 수 있는 능력이 필요합니다. 향후 면접에서는 구체적인 사례를 통해 자신의 역량을 잘 드러낼 수 있도록 준비하는 것이 중요합니다. 특히, 문제를 어떻게 창의적으로 해결했는지, 그리고 그 과정에서 팀원들과의 협업이 어떻게 이루어졌는지를 명확히 설명하는 것이 필요합니다. 이러한 준비는 지원자의 역량을 더 잘 보여줄 수 있는 기회가 될 것입니다.',
          interviewSessionId: 'wcj1wvytxxljcr6h6z2z2u7h',
          parentStepId: 'cmfkkxt410014kvdh09w1zwf0',
        },
      ],
    },
    {
      id: 'cmfkkxt410015kvdhm9wbwpvh',
      aiQuestionId: 'q2',
      type: 'TECHNICAL',
      question:
        'React와 Zustand를 사용하여 리스트 렌더링 속도를 개선한 방법에 대해 자세히 설명해 주세요.',
      answer:
        ' 오토마크 출출인데 디텍터 이런 것들이 포함된다 이거예요. 여기서는 이쪽은 인베더 얘기고 이쪽은 디펜더 얘기고 이 관계를 자세히 적어준다. 그러면 유스케이스 다이어그램하고 유스케이스 다큐먼트를 보면',
      score: 1,
      createdAt: '2025-09-15T03:43:58.370Z',
      updatedAt: '2025-09-30T04:41:15.590Z',
      rationale:
        '지원자는 성능 최적화 경험을 강조하며 React와 Zustand를 활용한 사례를 언급했습니다. 이러한 기술적 경험을 심층적으로 평가하기 위해 질문을 구성했습니다.',
      criteria: ['프론트엔드 개발', '성능 최적화'],
      skills: ['React', 'Zustand'],
      estimatedAnswerTimeSec: 90,
      answerDurationSec: 40,
      answerStartedAt: '2025-09-30T04:40:16.382Z',
      answerEndedAt: '2025-09-30T04:40:56.842Z',
      strengths: [],
      improvements: [],
      redFlags: [
        '지원자의 답변이 질문과 전혀 관련이 없으며, React와 Zustand를 사용한 리스트 렌더링 속도 개선에 대한 설명이 전혀 포함되어 있지 않음.',
      ],
      feedback:
        '지원자의 답변은 질문과 전혀 관련이 없으며, React와 Zustand를 사용한 리스트 렌더링 속도 개선에 대한 설명이 전혀 포함되어 있지 않습니다. 이는 지원자가 해당 기술에 대한 이해가 부족하거나 질문을 제대로 이해하지 못했음을 나타냅니다. React와 Zustand를 사용하여 리스트 렌더링 속도를 개선하는 방법에는 예를 들어, React.memo를 사용하여 불필요한 렌더링을 방지하거나, Zustand의 상태 관리 최적화를 통해 성능을 향상시키는 방법 등이 있습니다. 지원자는 이러한 구체적인 방법을 설명함으로써 자신의 기술적 역량을 보여줄 필요가 있습니다. 또한, 답변의 내용이 질문과 관련이 없다는 점에서 면접 질문에 대한 이해도와 준비가 부족하다는 인상을 줄 수 있습니다. 이러한 점을 개선하기 위해서는 관련 기술에 대한 깊이 있는 이해와 준비가 필요합니다.',
      interviewSessionId: 'wcj1wvytxxljcr6h6z2z2u7h',
      parentStepId: null,
      tailSteps: [
        {
          id: 'cmg62lcwk0003hceawj579a5h',
          aiQuestionId: 'q2-fu1',
          type: 'TECHNICAL',
          question:
            'React와 Zustand를 사용하여 리스트 렌더링 속도를 개선할 때, 구체적으로 어떤 방법을 사용했으며, 그로 인해 얻은 성능 개선의 수치적 결과나 코드 예시가 있으면 설명해 주세요.',
          answer: '',
          score: 1,
          createdAt: '2025-09-30T04:41:20.267Z',
          updatedAt: '2025-09-30T07:45:44.684Z',
          rationale:
            '사용자의 답변이 질문과 관련이 없고, React와 Zustand를 사용한 성능 최적화에 대한 구체적인 설명이 필요합니다. 특히, 리스트 렌더링 속도를 개선한 방법에 대한 구체적인 사례나 코드 예시를 요구하여 평가 기준에 맞는 답변을 유도합니다.',
          criteria: ['React', '성능 최적화'],
          skills: ['React', 'Zustand'],
          estimatedAnswerTimeSec: 45,
          answerDurationSec: 1,
          answerStartedAt: '2025-09-30T07:45:28.819Z',
          answerEndedAt: '2025-09-30T07:45:30.686Z',
          strengths: [],
          improvements: [],
          redFlags: ['지원자가 답변을 제공하지 않았습니다.'],
          feedback:
            '지원자는 React와 Zustand를 사용한 리스트 렌더링 속도 개선에 대한 구체적인 방법이나 성능 개선의 수치적 결과를 제시하지 않았습니다. 이는 기술적 역량을 평가하는 데 있어 큰 결함으로 작용합니다. React와 Zustand를 활용한 성능 최적화는 웹 개발에서 중요한 부분이며, 이에 대한 이해와 경험을 보여주는 것이 중요합니다. 지원자는 이러한 부분에 대한 경험을 명확히 설명할 수 있어야 하며, 특히 성능 개선의 구체적인 수치나 코드 예시를 제시함으로써 자신의 기술적 역량을 증명할 필요가 있습니다. 답변이 전혀 없었기 때문에, 지원자의 기술적 역량을 평가할 수 있는 근거가 부족합니다. 따라서, 추가적인 질문을 통해 지원자의 역량을 더 깊이 파악할 필요가 있습니다.',
          interviewSessionId: 'wcj1wvytxxljcr6h6z2z2u7h',
          parentStepId: 'cmfkkxt410015kvdhm9wbwpvh',
        },
        {
          id: 'cmg696kh1000wefedoba0j6d5',
          aiQuestionId: 'q2-fu1',
          type: 'TECHNICAL',
          question:
            '리스트 렌더링 속도를 개선하기 위해 사용한 특정 React 최적화 기법의 코드 예시를 설명해 주시겠어요? 특히, Zustand와의 통합 부분을 포함해서요.',
          answer: '',
          score: 1,
          createdAt: '2025-09-30T07:45:47.557Z',
          updatedAt: '2025-09-30T07:46:43.561Z',
          rationale:
            'React와 Zustand를 사용한 성능 최적화 방법에 대한 구체적인 이해를 평가하기 위해, 사용된 최적화 기법의 구체적인 코드 예시나 수치적 결과를 요구하여 후보자의 실무 경험과 문제 해결 능력을 확인하고자 합니다.',
          criteria: ['React', '성능 최적화'],
          skills: ['React', 'Zustand'],
          estimatedAnswerTimeSec: 45,
          answerDurationSec: 6,
          answerStartedAt: '2025-09-30T07:46:26.910Z',
          answerEndedAt: '2025-09-30T07:46:33.377Z',
          strengths: [],
          improvements: [
            '지원자가 React와 Zustand를 사용한 리스트 렌더링 최적화에 대한 구체적인 코드 예시나 설명을 제공하지 않았습니다.',
          ],
          redFlags: [
            '지원자가 질문에 대한 답변을 전혀 제공하지 않았습니다. 이는 React와 Zustand에 대한 이해 부족을 나타낼 수 있습니다.',
          ],
          feedback:
            '지원자는 React와 Zustand를 사용한 리스트 렌더링 최적화에 대한 구체적인 코드 예시나 설명을 제공하지 않았습니다. 이는 해당 기술에 대한 이해도가 부족하다는 인상을 줄 수 있습니다. React에서 리스트 렌더링을 최적화하는 방법으로는 React.memo, useMemo, useCallback 등을 활용할 수 있으며, Zustand와의 통합을 통해 상태 관리를 효율적으로 할 수 있습니다. 이러한 기법들을 설명하고, 코드 예시를 통해 구체적으로 보여주는 것이 중요합니다. 지원자는 이러한 부분에 대한 이해와 경험을 보완할 필요가 있습니다. 특히, 상태 관리 라이브러리와의 통합을 통해 성능을 어떻게 개선할 수 있는지에 대한 명확한 설명이 필요합니다.',
          interviewSessionId: 'wcj1wvytxxljcr6h6z2z2u7h',
          parentStepId: 'cmfkkxt410015kvdhm9wbwpvh',
        },
        {
          id: 'cmg697upt0010efedniq0ww3k',
          aiQuestionId: 'q2-fu2',
          type: 'TECHNICAL',
          question:
            'React에서 리스트 렌더링을 최적화할 때, Zustand와 통합하여 어떤 상태 관리 패턴을 사용했는지, 그리고 그로 인해 성능이 어떻게 개선되었는지 구체적인 코드 예시를 들어 설명해 주시겠어요?',
          answer: '',
          score: 1,
          createdAt: '2025-09-30T07:46:47.490Z',
          updatedAt: '2025-09-30T07:58:17.239Z',
          rationale:
            '지원자가 React와 Zustand를 사용한 리스트 렌더링 최적화에 대한 구체적인 코드 예시나 설명을 제공하지 않았으므로, 구체적인 코드 예시를 요구하여 지원자의 기술적 이해도를 평가하고자 합니다.',
          criteria: ['React', '성능 최적화'],
          skills: ['React', 'Zustand'],
          estimatedAnswerTimeSec: 45,
          answerDurationSec: 9,
          answerStartedAt: '2025-09-30T07:58:00.697Z',
          answerEndedAt: '2025-09-30T07:58:09.762Z',
          strengths: [],
          improvements: [],
          redFlags: ['지원자가 답변을 제공하지 않았습니다.'],
          feedback:
            '지원자는 React에서 리스트 렌더링을 최적화하는 방법에 대해 전혀 설명하지 않았습니다. Zustand와의 통합을 통한 상태 관리 패턴에 대한 구체적인 코드 예시나 설명도 없었습니다. 이는 지원자가 해당 주제에 대한 이해가 부족하거나 준비가 되지 않았음을 나타낼 수 있습니다. React와 Zustand를 사용한 성능 최적화는 웹 개발에서 중요한 주제이므로, 이에 대한 이해와 경험을 보여주는 것이 중요합니다. 다음 면접에서는 관련된 경험이나 지식을 구체적으로 설명할 수 있도록 준비하는 것이 좋겠습니다.',
          interviewSessionId: 'wcj1wvytxxljcr6h6z2z2u7h',
          parentStepId: 'cmfkkxt410015kvdhm9wbwpvh',
        },
      ],
    },
    {
      id: 'cmfkkxt410016kvdh6m310o3c',
      aiQuestionId: 'q3',
      type: 'TECHNICAL',
      question:
        'Lighthouse 접근성 점수를 68점에서 94점으로 개선한 구체적인 방법과 과정에 대해 설명해 주세요.',
      answer: '',
      score: 1,
      createdAt: '2025-09-15T03:43:58.370Z',
      updatedAt: '2025-09-30T07:44:06.905Z',
      rationale:
        '지원자는 Lighthouse 점수를 개선한 경험을 언급하며 접근성에 대한 강점을 강조했습니다. 접근성 개선 방법에 대한 기술적 이해를 평가하기 위해 질문을 구성했습니다.',
      criteria: ['프론트엔드 개발', '접근성 개선'],
      skills: ['Lighthouse', '접근성'],
      estimatedAnswerTimeSec: 90,
      answerDurationSec: 5,
      answerStartedAt: '2025-09-30T07:43:54.786Z',
      answerEndedAt: '2025-09-30T07:44:00.133Z',
      strengths: [],
      improvements: ['지원자가 구체적인 방법과 과정을 설명하지 않았습니다.'],
      redFlags: ['답변이 전혀 제공되지 않았습니다.'],
      feedback:
        '지원자는 Lighthouse 접근성 점수를 68점에서 94점으로 개선한 구체적인 방법과 과정을 설명하지 않았습니다. 이는 프론트엔드 개발 및 접근성 개선에 대한 이해도를 평가할 수 있는 중요한 질문이었으나, 답변이 전혀 제공되지 않아 평가가 불가능했습니다. 구체적인 사례나 방법론을 설명함으로써 지원자의 기술적 역량을 보여줄 수 있는 기회였으나, 이를 놓친 점이 아쉽습니다. 향후 면접에서는 질문에 대한 명확하고 구체적인 답변을 준비하는 것이 중요합니다. 특히, 접근성 개선과 관련된 기술적 접근 방법이나 도구 활용 사례를 설명하여 지원자의 전문성을 어필할 필요가 있습니다.',
      interviewSessionId: 'wcj1wvytxxljcr6h6z2z2u7h',
      parentStepId: null,
      tailSteps: [
        {
          id: 'cmg694hdd000oefed921arppc',
          aiQuestionId: 'q3-fu1',
          type: 'TECHNICAL',
          question:
            'Lighthouse 접근성 점수를 개선하기 위해 사용한 구체적인 기술이나 도구는 무엇이었으며, 그것들이 어떻게 점수 향상에 기여했는지 설명해 주세요.',
          answer: '',
          score: 1,
          createdAt: '2025-09-30T07:44:10.225Z',
          updatedAt: '2025-09-30T07:44:42.430Z',
          rationale:
            '지원자가 구체적인 방법과 과정을 설명하지 않았으므로, 개선 과정에서 사용한 구체적인 기술이나 도구에 대한 설명을 요구하여 지원자의 실제 경험과 지식을 평가하고자 합니다.',
          criteria: ['프론트엔드 개발', '접근성 개선'],
          skills: ['Lighthouse', '접근성'],
          estimatedAnswerTimeSec: 45,
          answerDurationSec: 6,
          answerStartedAt: '2025-09-30T07:44:24.319Z',
          answerEndedAt: '2025-09-30T07:44:30.443Z',
          strengths: [],
          improvements: [],
          redFlags: ['지원자가 답변을 제공하지 않았습니다.'],
          feedback:
            '지원자는 Lighthouse 접근성 점수를 개선하기 위해 사용한 구체적인 기술이나 도구에 대해 답변하지 않았습니다. 이는 지원자의 접근성 개선 역량을 평가할 수 없게 만듭니다. 접근성은 웹 개발에서 중요한 요소이며, 이를 개선하기 위한 구체적인 경험이나 지식을 공유하는 것은 매우 중요합니다. 다음 면접에서는 관련 경험이나 지식을 구체적으로 설명할 수 있도록 준비하는 것이 좋습니다. 예를 들어, ARIA 태그 사용, 색상 대비 조정, 키보드 내비게이션 개선 등의 구체적인 사례를 들어 설명하면 좋습니다. 또한, Lighthouse와 같은 도구를 사용하여 접근성 점수를 어떻게 측정하고 개선했는지에 대한 구체적인 설명이 필요합니다.',
          interviewSessionId: 'wcj1wvytxxljcr6h6z2z2u7h',
          parentStepId: 'cmfkkxt410016kvdh6m310o3c',
        },
      ],
    },
    {
      id: 'cmfkkxt410017kvdh4b00elea',
      aiQuestionId: 'q4',
      type: 'TAILORED',
      question:
        'FitPlanner 프로젝트에서 공통 UI 컴포넌트 설계와 상태 관리 구조를 재정립하여 개발 속도를 향상시킨 방법을 설명해 주세요.',
      answer: '',
      score: null,
      createdAt: '2025-09-15T03:43:58.370Z',
      updatedAt: '2025-09-30T07:58:54.414Z',
      rationale:
        '지원자는 FitPlanner 프로젝트에서 프론트엔드 리드로서 개발 속도를 향상시킨 경험을 강조했습니다. 이를 통해 리더십과 기술적 역량을 평가하기 위해 질문을 구성했습니다.',
      criteria: ['프론트엔드 리드 경험', '개발 속도 향상'],
      skills: ['UI 컴포넌트 설계', '상태 관리'],
      estimatedAnswerTimeSec: 90,
      answerDurationSec: 6,
      answerStartedAt: '2025-09-30T07:58:30.079Z',
      answerEndedAt: '2025-09-30T07:58:36.313Z',
      strengths: [],
      improvements: [],
      redFlags: [],
      feedback: null,
      interviewSessionId: 'wcj1wvytxxljcr6h6z2z2u7h',
      parentStepId: null,
      tailSteps: [],
    },
  ]
}
