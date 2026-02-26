/**
 * Date를 로컬 타임존 기준 YYYY-MM-DD 문자열로 변환합니다.
 * toISOString()은 UTC 기준이라 KST 등에서 하루 차이가 발생할 수 있으므로
 * 이 함수를 사용해야 합니다.
 */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
