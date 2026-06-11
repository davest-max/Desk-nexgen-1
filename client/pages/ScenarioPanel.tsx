import { useLayoutContext } from "@/components/layout-context";

type CaseKey = "jordan" | "sofia" | "marcus" | "terry" | "diana";
type CaseStatus = "idle" | "active" | "resolved";

type CaseConfig = {
  key: CaseKey;
  initials: string;
  name: string;
  customerId: string;
  channel: string;
  channelIcon: string;
  issue: string;
  bot: string;
  botColor: string;
};

const CASES: CaseConfig[] = [
  {
    key: "jordan",
    initials: "JD",
    name: "Jordan Davis",
    customerId: "CST-11621",
    channel: "Chat",
    channelIcon: "💬",
    issue: "Router dropping all connections — port forwarding config blocking factory reset",
    bot: "Aria",
    botColor: "bg-blue-100 text-blue-700",
  },
  {
    key: "sofia",
    initials: "SM",
    name: "Sofia Martinez",
    customerId: "CST-12045",
    channel: "Chat",
    channelIcon: "💬",
    issue: "Proactive fraud alert — 2 unauthorized transactions totaling $2,159",
    bot: "Jacob",
    botColor: "bg-green-100 text-green-700",

  },
  {
    key: "marcus",
    initials: "MW",
    name: "Marcus Webb",
    customerId: "CST-13317",
    channel: "Chat",
    channelIcon: "💬",
    issue: "Order shipped to wrong address — request for human agent",
    bot: "Emily",
    botColor: "bg-purple-100 text-purple-700",

  },
  {
    key: "terry",
    initials: "TW",
    name: "Terry Williams",
    customerId: "CST-14201",
    channel: "Voice",
    channelIcon: "📞",
    issue: "Inbound callback — VP of Ops at Nexus Freight evaluating TMS replacement for 200-person team",
    bot: "Aria",
    botColor: "bg-blue-100 text-blue-700",

  },
  {
    key: "diana",
    initials: "DC",
    name: "Diana Chen",
    customerId: "CST-15872",
    channel: "Voice",
    channelIcon: "📞",
    issue: "Billing dispute — charged $147 for cancelled subscription. Transferred from 2 prior agents with full summary & context.",
    bot: "2nd Transfer",
    botColor: "bg-orange-100 text-orange-700",
  },
];

function StatusPill({ status }: { status: CaseStatus }) {
  const styles: Record<CaseStatus, string> = {
    idle:     "border-gray-200 bg-gray-50 text-gray-400",
    active:   "border-green-200 bg-green-50 text-green-700",
    resolved: "border-gray-200 bg-gray-50 text-gray-400",
  };
  const dot: Record<CaseStatus, string> = {
    idle:     "bg-gray-300",
    active:   "bg-green-500 animate-pulse",
    resolved: "bg-gray-300",
  };
  const label: Record<CaseStatus, string> = {
    idle: "Idle", active: "Active", resolved: "Resolved",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${styles[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot[status]}`} />
      {label[status]}
    </span>
  );
}

function CaseCard({ config, status, onTrigger }: {
  config: CaseConfig;
  status: CaseStatus;
  onTrigger: () => void;
}) {
  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C5DEF5] text-[13px] font-bold text-[#1260B0]">
            {config.initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[14px] font-semibold text-gray-900">{config.name}</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${config.botColor}`}>
                {config.bot}
              </span>
              <span className="text-[11px] text-gray-400">{config.channelIcon} {config.channel}</span>
            </div>
            <p className="text-[11px] text-gray-400">{config.customerId}</p>
          </div>
        </div>
        <StatusPill status={status} />
      </div>

      <p className="px-5 pb-4 text-[12px] leading-relaxed text-gray-500">{config.issue}</p>

      <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onTrigger}
          className="rounded-lg bg-[#166CCA] px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1260B0] transition-colors"
        >
          Trigger
        </button>
      </div>
    </div>
  );
}

export default function ScenarioPanel() {
  const { triggerScenario, scenarioCaseStatuses } = useLayoutContext();

  return (
    <div className="flex h-full flex-col bg-[#F4F6F8]">
      <div className="border-b border-gray-200 bg-white px-8 py-5">
        <h1 className="text-[18px] font-semibold text-gray-900">Scenario Controller</h1>
        <p className="mt-0.5 text-[13px] text-gray-500">Trigger incoming escalations and lead scenarios to demo the agent workspace.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {CASES.map((config) => (
            <CaseCard
              key={config.key}
              config={config}
              status={scenarioCaseStatuses[config.key]}
              onTrigger={() => triggerScenario(config.key)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
