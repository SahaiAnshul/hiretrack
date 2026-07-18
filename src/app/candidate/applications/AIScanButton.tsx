"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AIScanModal } from "./AIScanModal";

interface AIScanButtonProps {
  application: {
    id: string;
    job: {
      title: string;
      description: string;
      requiredSkills: string[];
    };
  };
  candidateProfile: {
    summary: string;
    experience: string;
    education: string;
    skills: string[];
    resumeUrl?: string;
  };
}

export function AIScanButton({ application, candidateProfile }: AIScanButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-[#C97C5D] hover:text-[#b06749] hover:bg-[#C97C5D]/5 border border-[#C97C5D]/30 flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-semibold bg-transparent transition-all shadow-sm"
      >
        <Sparkles className="h-3.5 w-3.5 fill-[#C97C5D]/10" />
        <span>AI Scan</span>
      </button>

      <AIScanModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        application={application}
        candidateProfile={candidateProfile}
      />
    </>
  );
}
