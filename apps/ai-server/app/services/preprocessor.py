import re


def preprocess_text(text: str) -> str:
    """
    문장 병합 및 정제
    - 문장 중간에서 끊긴 줄은 이어 붙이고, 의미 있는 개행은 유지
    - 조사/종결어미/동사 등으로 끝나는 줄은 다음 줄과 이어 붙일 가능성 높음
    """
    lines = text.splitlines()
    processed_text = ""
    i = 0

    while i < len(lines):
        line = lines[i].strip()

        # 빈 줄은 문단 구분 기호로 치환
        if not line:
            processed_text += "\n"
            i += 1
            continue

        # 다음 줄 존재 여부 확인
        next_line = lines[i + 1].strip() if i + 1 < len(lines) else ""

        # 조건1: 종결 부호로 끝나지 않음 (문장 중간)
        cond1 = not re.search(r"[.?!…]$", line)

        # 조건2: 조사/동사/전치사/부사 등 문맥상 이어질 가능성
        cond2 = re.search(
            r"(은|는|이|가|을|를|고|도|지만|하며|하고|되어|한다|했다|있다|같은|되며|및|하거나|위한|에서|으로|으로서|수|때문)$",
            line,
        )

        # 조건3: 다음 줄이 자연스럽게 이어질 수 있는 시작어
        cond3 = re.match(r"^[a-zA-Z가-힣0-9]", next_line) and not re.match(
            r"^[ㄱ-ㅎㅏ-ㅣ]", next_line
        )

        # 이어 붙이기
        if next_line and (cond1 or cond2 or cond3):
            processed_text += line + " "
            i += 1  # 다음 줄은 이어졌으므로 건너뜀
        else:
            processed_text += line
            i += 1

    return processed_text.strip()
