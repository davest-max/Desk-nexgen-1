import { useEffect, useRef, useState } from "react";
import { getEscalationStart } from "@/lib/escalation-timers";

// Escalation live timer
export function EscalationTimer({ customerId }: { customerId?: string }) {
  const startRef = useRef(customerId ? getEscalationStart(customerId) : Date.now());
  const [elapsed, setElapsed] = useState(() => Math.floor((Date.now() - startRef.current) / 1000));
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const chip = elapsed >= 60
    ? "border-[#E32926] text-[#E32926]"
    : elapsed >= 30
    ? "border-[#FFB800] text-[#FFB800]"
    : "border-[#98A2B3] text-[#98A2B3]";
  return <span className={`rounded border bg-white px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums ${chip}`}>{mm}:{ss}</span>;
}
