
import React, { useState, useEffect } from 'react';

interface CountdownProps {
  targetDate: string;
  onExpire?: () => void;
}

const Countdown: React.FC<CountdownProps> = ({ targetDate, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState<{h: number, m: number, s: number} | null>(null);

  useEffect(() => {
    const calculate = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference <= 0) {
        onExpire?.();
        return null;
      }
      return {
        h: Math.floor(difference / (1000 * 60 * 60)),
        m: Math.floor((difference / 1000 / 60) % 60),
        s: Math.floor((difference / 1000) % 60)
      };
    };

    setTimeLeft(calculate());
    const timer = setInterval(() => setTimeLeft(calculate()), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return <span className="text-[10px] font-black uppercase text-red-500">Expired</span>;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-1.5">
      <div className="bg-[#1A1A1A] text-white px-1.5 py-1 rounded-md text-[10px] font-black min-w-[24px] text-center">{pad(timeLeft.h)}</div>
      <span className="text-gray-900 font-black text-[10px]">:</span>
      <div className="bg-[#1A1A1A] text-white px-1.5 py-1 rounded-md text-[10px] font-black min-w-[24px] text-center">{pad(timeLeft.m)}</div>
      <span className="text-gray-900 font-black text-[10px]">:</span>
      <div className="bg-[#1A1A1A] text-white px-1.5 py-1 rounded-md text-[10px] font-black min-w-[24px] text-center">{pad(timeLeft.s)}</div>
    </div>
  );
};

export default Countdown;
