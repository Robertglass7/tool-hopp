/**
 * MobileSelect — renders as a native bottom-sheet drawer on small screens,
 * falls back to the shadcn Select on desktop.
 */
import React, { useState } from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Check, ChevronDown } from "lucide-react";

function useIsMobile() {
  return typeof window !== "undefined" && window.innerWidth < 1024;
}

export default function MobileSelect({ value, onValueChange, options, placeholder, triggerClassName }) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const selected = options.find(o => o.value === value);

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center justify-between w-full px-3 h-10 rounded-md border text-sm ${triggerClassName || "bg-green-900/50 text-white border-green-700"}`}
      >
        <span className={selected ? "text-white" : "text-green-400"}>{selected?.label || placeholder}</span>
        <ChevronDown className="w-4 h-4 text-green-400 ml-2 flex-shrink-0" />
      </button>

      {/* Drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex flex-col justify-end"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          {/* Sheet */}
          <div className="relative bg-green-950 border-t border-green-700 rounded-t-2xl z-10 max-h-[70vh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-green-700" />
            </div>
            {placeholder && (
              <p className="text-green-400 text-xs font-medium px-5 py-2 uppercase tracking-wide">
                {placeholder}
              </p>
            )}
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`flex items-center justify-between w-full px-5 py-4 text-left min-h-[52px] transition-colors border-b border-green-800/50 last:border-0 ${
                  opt.value === value ? "text-orange-400 bg-orange-500/10" : "text-white hover:bg-green-900/50"
                }`}
                onClick={() => { onValueChange(opt.value); setOpen(false); }}
              >
                <span className="text-base">{opt.label}</span>
                {opt.value === value && <Check className="w-5 h-5 text-orange-400" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}