"use client";

import { X, CheckCircle2, AlertTriangle, Lightbulb, FileText } from "lucide-react";

interface AIScanModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export function AIScanModal({ isOpen, onClose, application, candidateProfile }: AIScanModalProps) {
  if (!isOpen) return null;

  // Local ATS analysis
  const profileSkills = candidateProfile.skills || [];
  const requiredSkills = application.job.requiredSkills || [];

  const matchedSkills = requiredSkills.filter((skill) =>
    profileSkills.some((s) => s.toLowerCase().trim() === skill.toLowerCase().trim())
  );

  const missingSkills = requiredSkills.filter(
    (skill) => !profileSkills.some((s) => s.toLowerCase().trim() === skill.toLowerCase().trim())
  );

  // Compute simulated ATS Score
  let atsScore = 30; // base score
  if (requiredSkills.length > 0) {
    atsScore += Math.round((matchedSkills.length / requiredSkills.length) * 45);
  } else {
    atsScore += 45;
  }
  if (candidateProfile.summary && candidateProfile.summary.length > 50) atsScore += 10;
  if (candidateProfile.experience && candidateProfile.experience.length > 80) atsScore += 10;
  if (candidateProfile.education && candidateProfile.education.length > 40) atsScore += 5;

  atsScore = Math.min(atsScore, 100);

  // Circular SVG ring math
  const strokeDashoffset = 251.2 - (251.2 * atsScore) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-gray-100 shadow-xl flex flex-col whitespace-normal text-left animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#C97C5D]/10 rounded-md text-[#C97C5D]">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">AI Resume Scanner</h3>
              <p className="text-xs text-gray-500 mt-0.5">Scanned against: {application.job.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-650 transition-colors p-1.5 rounded-lg hover:bg-gray-105"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Unified Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[65vh] break-words">
          
          {/* ATS Score Circular Meter */}
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-gray-50 border border-gray-150 p-5 rounded-2xl">
            <div className="relative flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="#E2E8F0" strokeWidth="8" fill="transparent" />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#C97C5D"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <span className="absolute text-xl font-extrabold text-slate-800">{atsScore}%</span>
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-sm font-bold text-slate-900">ATS Compatibility Report</h4>
              <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
                Your profile was parsed and compared against the job requirements. A compatibility score of <b>{atsScore}%</b> indicates a <b>{atsScore >= 75 ? "strong" : atsScore >= 50 ? "moderate" : "weak"}</b> keyword alignment.
              </p>
            </div>
          </div>

          {/* Strengths / Matches */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Keyword Matches ({matchedSkills.length})
            </h5>
            {matchedSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {matchedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic pl-6">No matching keywords found. Add required skills below.</p>
            )}
          </div>

          {/* Missing Keywords / Gaps */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Keyword Gaps ({missingSkills.length})
            </h5>
            {missingSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {missingSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-600 font-semibold pl-6">Zero keyword gaps! Your profile matching is excellent.</p>
            )}
          </div>

          {/* Action Checklist to 'Fix Resume' */}
          <div className="bg-amber-50/50 border border-amber-200/80 p-5 rounded-2xl space-y-3.5">
            <h5 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
              <Lightbulb className="h-5 w-5 text-amber-600 fill-amber-100" />
              AI Advice: How to Fix Your Resume
            </h5>
            <ul className="text-xs text-amber-800 space-y-2.5 pl-5 list-disc leading-relaxed">
              {missingSkills.length > 0 && (
                <li>
                  Go to <b>My Profile</b> and add these key skills to your skills inventory list: <b>{missingSkills.join(", ")}</b>.
                </li>
              )}
              {(!candidateProfile.summary || candidateProfile.summary.length < 50) && (
                <li>
                  Your <b>Profile Summary</b> is too brief. Expand it to at least 2 sentences highlighting your experience with <b>{requiredSkills.slice(0, 3).join(", ")}</b>.
                </li>
              )}
              {(!candidateProfile.experience || candidateProfile.experience.length < 100) && (
                <li>
                  Your listed <b>Work Experience</b> description is brief. Detail concrete projects or achievements highlighting your skills.
                </li>
              )}
              <li>
                Verify that your shared <b>Resume Link</b> permissions on Google Drive or Dropbox are set to &ldquo;Anyone with link can view&rdquo; so recruiters can access it.
              </li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#2F5D50] hover:bg-[#23473D] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-sm"
          >
            Got it, Fix Profile
          </button>
        </div>

      </div>
    </div>
  );
}
