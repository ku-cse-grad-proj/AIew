import matplotlib.pyplot as plt
import pandas as pd
import json

# 한글 폰트 설정 (맑은 고딕 또는 AppleGothic)
plt.rcParams['font.family'] = 'Malgun Gothic'  # Windows
# plt.rcParams['font.family'] = 'AppleGothic'  # macOS
plt.rcParams['axes.unicode_minus'] = False     # 마이너스 기호 깨짐 방지

# 데이터 로드
result_dir = "C:/AIew/apps/ai-server/app/result"
file_path = f"{result_dir}/면접관에게 호감으로 보이는 면접 표정, 면접 말하기.mp4.json"

with open(file_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# DataFrame으로 변환
df = pd.DataFrame(data["results"])

# 감정 리스트
emotions = ["happy", "sad", "neutral", "angry", "fear", "surprise"]


# 그래프 그리기
plt.figure(figsize=(12, 6))

# 너무 많은 데이터 포인트는 시각적으로 복잡할 수 있으므로 일부만 샘플링
step = 5  # 매 5번째만 사용
df_sampled = df.iloc[::step]
for emotion in emotions:
    plt.plot(df_sampled["time"], df_sampled[emotion], label=emotion)

# 모든 데이터 포인트 시각화
# for emotion in emotions:
#     plt.plot(df["frame"], df[emotion], label=emotion)

plt.xlabel("시간 (초)")
plt.ylabel("감정 확률")
plt.title("시간에 따른 감정 변화 추이")
plt.legend()
plt.grid(True)
plt.tight_layout()
plt.show()
