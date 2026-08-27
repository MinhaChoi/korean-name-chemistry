export const WORD_LIST = [
  "유비무환",
  "새옹지마",
  "온고지신",
  "자업자득",
  "결자해지",
  "십중팔구",
  "일석이조",
  "등하불명",
  "마이동풍",
  "오리무중",
  "임기응변",
  "자화자찬",
  "청출어람",
  "표리부동",
  "호시탐탐",
  "감언이설",
  "각주구검",
  "개과천선",
  "격세지감",
  "고진감래",
  "과유불급",
  "근묵자흑",
  "다다익선",
  "대기만성",
  "동상이몽",
  "사면초가",
  "설상가상",
  "심사숙고",
  "어부지리",
  "유유상종",
];

export function pickRandomWord(exclude: Set<string>): string {
  const available = WORD_LIST.filter((w) => !exclude.has(w));
  const pool = available.length > 0 ? available : WORD_LIST;
  return pool[Math.floor(Math.random() * pool.length)];
}
