import { useEffect, useState } from "react";
import { getTimeLeft, isEndingSoonCheck } from "../utils/timer";

interface Props {
  endsAt: number;
  isEnded: boolean;
}

export const AuctionCountdownBadge = ({ endsAt, isEnded }: Props) => {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(endsAt));
  const [isEndingSoon, setIsEndingSoon] = useState(() => isEndingSoonCheck(endsAt, isEnded));

  useEffect(() => {
    if (isEnded || endsAt <= Date.now()) {
      setTimeLeft("00:00");
      setIsEndingSoon(false);
      return;
    }

    const interval = setInterval(() => {
      const currentLabel = getTimeLeft(endsAt);
      const currentEndingSoon = isEndingSoonCheck(endsAt, isEnded);

      setTimeLeft(currentLabel);
      setIsEndingSoon(currentEndingSoon);

      if (currentLabel === "00:00") {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endsAt, isEnded]);

  return (
    <div 
      className={`p-3 badge mb-3 ${isEndingSoon ? "bg-danger" : "bg-success"}`}
      style={{ fontSize: '0.9rem', transition: 'background-color 0.3s ease' }}
    >
      {isEnded ? "Ended" : `🕒 ${timeLeft}` }
    </div>
  );
};