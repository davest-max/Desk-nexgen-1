import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

type ConnectionOption = "phone-number" | "station-id" | "integrated-softphone";

const imgNiceSmiley = "https://www.figma.com/api/mcp/asset/f7bad6c3-aade-454e-be5d-94c5663dae6d";

export default function LoginPage() {
  const navigate = useNavigate();
  const [connection, setConnection] = useState<ConnectionOption>("phone-number");
  const [inputValue, setInputValue] = useState("");
  const [savePrefs, setSavePrefs] = useState(false);

  useEffect(() => {
    setInputValue("");
  }, [connection]);

  const handleLaunch = () => {
    navigate("/control-center");
  };

  const lastLogin = (() => {
    const d = new Date();
    return d.toLocaleString("en-US", {
      weekday: "short",
      month:   "short",
      day:     "numeric",
      hour:    "numeric",
      minute:  "2-digit",
    });
  })();

  const inputPlaceholder =
    connection === "phone-number" ? "Enter phone number" :
    connection === "station-id"   ? "Enter station ID"   : "";

  const showInput = connection !== "integrated-softphone";

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#F2F4F7]">
      <div className="w-[379px] rounded-[12px] border border-[rgba(0,0,0,0.16)] bg-white shadow-[0px_12px_24px_0px_rgba(0,0,0,0.08)] overflow-clip">

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[rgba(0,0,0,0.1)] px-6 py-6">
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden="true">
            <ellipse cx="17" cy="17" rx="17" ry="17" fill="#2196F3"/>
          </svg>
          <span className="text-[20px] font-semibold leading-6 tracking-[-0.3px] text-[rgba(0,0,0,0.8)]">
            Agent Workspace
          </span>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-5 px-10 py-7">

          {/* Welcome / last login */}
          <div className="relative rounded-[6px] border-b border-[rgba(0,0,0,0.1)] pb-[16px]">
            <div className="absolute inset-0 rounded-[6px] bg-[#fbfcfe]" style={{ zIndex: 0 }} />
            <div className="relative">
              <p className="text-[16px] font-semibold leading-6 text-[rgba(0,0,0,0.8)]">
                Welcome back, Jeff Comstock
              </p>
              <p className="text-[12px] leading-4 tracking-[0.2px] text-[rgba(0,0,0,0.6)]">
                Last login {lastLogin}
              </p>
            </div>
          </div>

          {/* Choose connection */}
          <div className="flex flex-col gap-3">
            <p className="text-[16px] leading-6 tracking-[-0.16px] text-[rgba(0,0,0,0.8)]">
              Choose connection
            </p>
            <RadioGroup
              value={connection}
              onValueChange={(v) => setConnection(v as ConnectionOption)}
              className="gap-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="phone-number" id="conn-phone" />
                <label htmlFor="conn-phone" className="cursor-pointer text-[14px] leading-5 text-[rgba(0,0,0,0.8)]">
                  Phone number
                </label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="station-id" id="conn-station" />
                <label htmlFor="conn-station" className="cursor-pointer text-[14px] leading-5 text-[rgba(0,0,0,0.8)]">
                  Station ID
                </label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="integrated-softphone" id="conn-softphone" />
                <label htmlFor="conn-softphone" className="cursor-pointer text-[14px] leading-5 text-[rgba(0,0,0,0.8)]">
                  Integrated softphone
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Conditional input */}
          <div className={cn(
            "overflow-hidden transition-all duration-300 ease-out",
            showInput ? "max-h-[60px] opacity-100" : "max-h-0 opacity-0",
          )}>
            <Input
              placeholder={inputPlaceholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 px-6 pb-6">
          <Button
            variant="default"
            className="w-full"
            onClick={handleLaunch}
          >
            Launch Agent Workspace
          </Button>

          <div className="flex items-center gap-2">
            <Checkbox
              id="save-prefs"
              checked={savePrefs}
              onCheckedChange={(v) => setSavePrefs(Boolean(v))}
            />
            <label htmlFor="save-prefs" className="cursor-pointer text-[14px] leading-5 text-[rgba(0,0,0,0.8)]">
              Save preferences
            </label>
          </div>
        </div>

      </div>
    </div>
  );
}
