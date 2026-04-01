/**
 * @param endsAt - Timestamp 
 */
export const getTimeLeft = (endsAt: number): string => {
  const diff = endsAt - Date.now();

  if (diff <= 0) return "00:00";

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)));

  const parts = [
    hours > 0 ? hours : null,
    minutes,
    seconds
  ]
    .filter((part) => part !== null)
    .map((part) => String(part).padStart(2, "0"));

  return parts.join(":");
};


export const isEndingSoonCheck = (endsAt: number, isEnded: boolean): boolean => {
  if (isEnded) return false;
  const diff = endsAt - Date.now();
  return diff > 0 && diff < 30000;
};