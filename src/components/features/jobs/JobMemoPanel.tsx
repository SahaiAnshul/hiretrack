"use client";

import { useState, useTransition } from "react";
import { saveJobMemo } from "@/server/actions/settings";
import { toast } from "sonner";
import { StickyNote, Save } from "lucide-react";

interface JobMemoPanelProps {
  jobId: string;
  initialContent: string;
  themeColor: "candidate" | "recruiter";
}

export function JobMemoPanel({ jobId, initialContent, themeColor }: JobMemoPanelProps) {
  const [content, setContent] = useState(initialContent);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const response = await saveJobMemo(jobId, content);

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success(response.success || "Personal memo saved successfully.");
        // If content is cleared, close drawer
        if (!content.trim()) {
          setIsOpen(false);
        }
      }
    });
  };

  const activeColor =
    themeColor === "candidate" ? "bg-[#C97C5D]/10 text-[#C97C5D]" : "bg-[#2F5D50]/10 text-[#2F5D50]";
  const btnColor = themeColor === "candidate" ? "bg-[#C97C5D] hover:bg-[#b06749]" : "bg-[#2F5D50] hover:bg-[#23473D]";
  const outlineColor =
    themeColor === "candidate"
      ? "border-[#C97C5D]/30 focus:ring-[#C97C5D]"
      : "border-[#2F5D50]/30 focus:ring-[#2F5D50]";

  return (
    <div className="mt-4 border-t pt-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-transparent hover:bg-gray-55 dark:hover:bg-slate-800 transition-colors ${
            content.trim() ? activeColor : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <StickyNote className="h-4 w-4" />
          <span>{content.trim() ? "Edit Personal Notes (Private)" : "Add Personal Note (Private)"}</span>
        </button>

        {content.trim() && !isOpen && <span className="text-[10px] italic text-gray-400">* Saved private note</span>}
      </div>

      {isOpen && (
        <div className="mt-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-150 rounded-xl p-3.5 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isPending}
            placeholder="Type your private notes here... (e.g. key qualifications to highlight, questions for the interview)"
            className={`w-full min-h-[70px] text-xs p-2.5 bg-white dark:bg-slate-950 border rounded-lg focus:outline-none focus:ring-1 focus:border-transparent leading-relaxed ${outlineColor}`}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setContent(initialContent);
                setIsOpen(false);
              }}
              disabled={isPending}
              className="px-2.5 py-1 text-[11px] font-semibold text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className={`text-white text-[11px] font-semibold px-3 py-1 rounded-md transition-colors flex items-center gap-1 shadow-sm ${btnColor}`}
            >
              <Save className="h-3 w-3" />
              <span>{isPending ? "Saving..." : "Save Notes"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Render note display if closed but populated */}
      {!isOpen && content.trim() && (
        <div className="mt-2 bg-[#FDFBF7] dark:bg-slate-800 border border-[#F5EBE1] dark:border-slate-750 rounded-lg p-2.5 text-xs text-gray-600 dark:text-gray-300 leading-normal italic">
          &ldquo;{content}&rdquo;
        </div>
      )}
    </div>
  );
}
