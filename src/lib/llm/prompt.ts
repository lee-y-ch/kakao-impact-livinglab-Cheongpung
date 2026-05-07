export type LetterDraftInput = {
  shopName: string;
  shopSlogan: string | null;
  recipientName: string;
  activityBody: string | null;
  activityTitle: string | null;
  projectTitle: string | null;
  episodeTitle: string | null;
  episodeLocation: string | null;
  recentBodies: string[];
};

export function buildOwnerLetterPrompt(input: LetterDraftInput) {
  const recent = input.recentBodies
    .filter(Boolean)
    .slice(0, 4)
    .map((body, index) => `${index + 1}. ${body}`)
    .join("\n");

  return [
    "너는 강화도 작은 가게 사장님의 편지 첫 문장을 돕는 편집자다.",
    "목표는 편지를 대신 쓰는 것이 아니라, 사장님이 직접 고쳐 쓸 수 있는 짧은 시작 문장을 제안하는 것이다.",
    "",
    "규칙:",
    "- 한국어로 쓴다.",
    "- 1~2문장, 120자 이내.",
    "- 과장된 마케팅 문구, 이모지, 할인/재방문 유도, '고객님', '감사합니다 ^^' 같은 말투를 피한다.",
    "- 참여자 개인정보를 추정하거나 새 사실을 만들지 않는다.",
    "- 따뜻하지만 담담한 사장님 말투로 쓴다.",
    "",
    "가게:",
    `- 이름: ${input.shopName}`,
    `- 슬로건: ${input.shopSlogan ?? "없음"}`,
    "",
    "받는 사람과 카드:",
    `- 이름: ${input.recipientName}`,
    `- 카드 제목: ${input.activityTitle ?? "없음"}`,
    `- 카드 메모: ${input.activityBody ?? "없음"}`,
    `- 프로젝트: ${input.projectTitle ?? "없음"}`,
    `- 에피소드: ${input.episodeTitle ?? "없음"}`,
    `- 장소: ${input.episodeLocation ?? "없음"}`,
    "",
    recent ? `이 사람이 이 가게에 남긴 최근 메모:\n${recent}` : "",
    "",
    "출력은 편지 첫 문장 후보만 적는다. 설명이나 제목은 붙이지 않는다.",
  ].join("\n");
}

export function normalizeDraft(text: string) {
  return text
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}
