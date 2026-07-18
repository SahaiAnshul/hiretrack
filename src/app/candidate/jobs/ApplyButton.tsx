"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { applyForJob } from "@/server/actions/application";
import { toast } from "sonner";
import { Check, X, FileText, Send } from "lucide-react";

interface ApplyButtonProps {
  jobId: string;
  jobTitle: string;
  isApplied: boolean;
}

export function ApplyButton({ jobId, jobTitle, isApplied }: ApplyButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [resumeUrl, setResumeUrl] = useState("");
  const [coverLetter, setCoverLetter] = useState("");

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const response = await applyForJob(jobId, {
        resumeUrl: resumeUrl.trim() || undefined,
        coverLetter: coverLetter.trim() || undefined,
      });

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success(response.success || "Applied successfully!");
        setIsOpen(false);
        setResumeUrl("");
        setCoverLetter("");
        router.refresh();
      }
    });
  };

  if (isApplied) {
    return (
      <Button disabled className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 flex items-center justify-center gap-1">
        <Check className="h-4 w-4" />
        Applied
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full bg-[#C97C5D] hover:bg-[#b06749] text-white transition-all font-semibold"
      >
        Apply Now
      </Button>

      {/* Application Dialog Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2 text-[#C97C5D]">
                <FileText className="h-5 w-5" />
                <h3 className="text-lg font-bold text-slate-900">Job Application</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content Form */}
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">
                  Applying for <span className="font-semibold text-slate-800">{jobTitle}</span>
                </p>
              </div>

              {/* Resume URL */}
              <div className="space-y-1.5">
                <Label htmlFor="resumeUrl" className="text-gray-700 text-xs font-semibold">
                  Resume URL (Google Drive / Dropbox link)
                </Label>
                <Input
                  id="resumeUrl"
                  type="url"
                  required
                  placeholder="https://drive.google.com/file/d/..."
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  disabled={isPending}
                  className="text-sm"
                />
                <p className="text-[10px] text-gray-400">
                  Please ensure your resume link has sharing access enabled so recruiters can view it.
                </p>
              </div>

              {/* Cover Letter */}
              <div className="space-y-1.5">
                <Label htmlFor="coverLetter" className="text-gray-700 text-xs font-semibold">
                  Cover Letter / Note to Recruiter
                </Label>
                <Textarea
                  id="coverLetter"
                  rows={4}
                  placeholder="Introduce yourself and explain why you are a great fit for this role..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  disabled={isPending}
                  className="text-sm leading-relaxed resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-[#2F5D50] hover:bg-[#23473D] text-white flex items-center gap-1.5 text-xs px-5 h-9"
                >
                  <Send className="h-3.5 w-3.5" />
                  {isPending ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
