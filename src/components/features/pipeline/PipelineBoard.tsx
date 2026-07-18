"use client";

import { useState, useTransition } from "react";
import { ApplicationStage } from "@prisma/client";
import { moveCandidate } from "@/server/actions/application";
import { scheduleInterview, submitScorecard } from "@/server/actions/interview";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { formatDistanceToNow } from "date-fns";
import {
  Mail,
  Phone,
  Globe,
  X,
  ExternalLink,
  GraduationCap,
  Briefcase,
  User,
  Calendar,
  PlusCircle,
  FileText,
  Star,
  CheckCircle,
  Clock,
  Video
} from "lucide-react";

// Types
type Scorecard = {
  id: string;
  technical: number;
  communication: number;
  problemSolving: number;
  behaviour: number;
  cultureFit: number;
  overallScore: number;
  recommendation: string;
  feedback: string;
};

type Interview = {
  id: string;
  interviewType: string;
  scheduledAt: Date | string;
  meetingLink: string;
  status: string;
  notes: string;
  scorecard: Scorecard | null;
};

type Application = {
  id: string;
  candidateName: string;
  stage: ApplicationStage;
  appliedAt: Date;
  candidateEmail: string;
  resumeUrl: string;
  coverLetter: string;
  candidateProfile: {
    phone: string;
    summary: string;
    experience: string;
    education: string;
    skills: string[];
    linkedin: string;
    portfolio: string;
  };
  interviews: Interview[];
};

const STAGES: ApplicationStage[] = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
];

const STAGE_LABELS: Record<ApplicationStage, string> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Rejected",
};

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export function PipelineBoard({ initialApplications, jobId }: { initialApplications: Application[]; jobId: string }) {
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isPending, startTransition] = useTransition();

  // Drawer Tabs State
  const [activeTab, setActiveTab] = useState<"profile" | "interviews" | "scorecards">("profile");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<"invite" | "offer" | "rejection">("invite");

  // Interview Schedule Form State
  const [schedType, setSchedType] = useState("Technical Round");
  const [schedTime, setSchedTime] = useState("");
  const [schedLink, setSchedLink] = useState("");
  const [schedNotes, setSchedNotes] = useState("");

  // Scorecard Submission Form State
  const [scoringInterviewId, setScoringInterviewId] = useState<string | null>(null);
  const [scoreTechnical, setScoreTechnical] = useState(4);
  const [scoreCommunication, setScoreCommunication] = useState(4);
  const [scoreProblemSolving, setScoreProblemSolving] = useState(4);
  const [scoreBehaviour, setScoreBehaviour] = useState(4);
  const [scoreCultureFit, setScoreCultureFit] = useState(4);
  const [scoreRec, setScoreRec] = useState("Hire");
  const [scoreFeedback, setScoreFeedback] = useState("");

  const getEmailTemplateContent = (template: "invite" | "offer" | "rejection", candidateName: string) => {
    const subjects = {
      invite: "Interview Invitation: next steps for your application",
      offer: "Job Offer: Congratulations! Joining our team",
      rejection: "Application Status Update: thank you for your interest",
    };
    
    const bodies = {
      invite: `Hi ${candidateName},

Thank you for applying. We reviewed your profile and would love to schedule a round of interviews to discuss your background. 

Please let us know your availability for a 30-minute introductory call next week.

Best regards,
Hiring Team`,
      offer: `Hi ${candidateName},

We are thrilled to extend a formal offer of employment to join our team! We were extremely impressed by your interviews and believe your skills align perfectly.

We will share the comprehensive offer letter details shortly.

Best regards,
Hiring Team`,
      rejection: `Hi ${candidateName},

Thank you for taking the time to apply and speak with us. Unfortunately, we have decided to move forward with other candidates whose profiles more closely align with the requirements at this time.

We will keep your details in our database for future opportunities.

Best regards,
Hiring Team`,
    };

    return {
      subject: subjects[template],
      body: bodies[template],
    };
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const applicationId = active.id as string;
    const newStage = over.id as ApplicationStage;

    const application = applications.find((a) => a.id === applicationId);
    if (!application || application.stage === newStage) return;

    const previousStage = application.stage;

    // 1. Optimistic UI Update
    setApplications((prev) =>
      prev.map((app) => (app.id === applicationId ? { ...app, stage: newStage } : app))
    );

    // 2. Server Action
    startTransition(async () => {
      const response = await moveCandidate(applicationId, newStage);
      if (response.error) {
        // Rollback
        setApplications((prev) =>
          prev.map((app) => (app.id === applicationId ? { ...app, stage: previousStage } : app))
        );
        toast.error(response.error);
      } else {
        toast.success("Stage updated");
      }
    });
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    startTransition(async () => {
      const result = await scheduleInterview({
        applicationId: selectedApp.id,
        scheduledAt: schedTime,
        meetingLink: schedLink,
        interviewType: schedType,
        notes: schedNotes,
        jobId,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success || "Interview scheduled!");
        
        // Optimistic refresh local state: append a mock/temp interview
        const newInterview: Interview = {
          id: Math.random().toString(),
          interviewType: schedType,
          scheduledAt: new Date(schedTime),
          meetingLink: schedLink,
          status: "SCHEDULED",
          notes: schedNotes,
          scorecard: null,
        };

        setApplications((prev) =>
          prev.map((app) =>
            app.id === selectedApp.id
              ? { ...app, interviews: [...app.interviews, newInterview] }
              : app
          )
        );
        setSelectedApp((prev) =>
          prev ? { ...prev, interviews: [...prev.interviews, newInterview] } : null
        );

        // Reset fields
        setSchedTime("");
        setSchedLink("");
        setSchedNotes("");
        setActiveTab("interviews");
      }
    });
  };

  const handleScorecardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !scoringInterviewId) return;

    startTransition(async () => {
      const result = await submitScorecard({
        interviewId: scoringInterviewId,
        technical: scoreTechnical,
        communication: scoreCommunication,
        problemSolving: scoreProblemSolving,
        behaviour: scoreBehaviour,
        cultureFit: scoreCultureFit,
        recommendation: scoreRec,
        feedback: scoreFeedback,
        jobId,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success || "Scorecard submitted!");

        // Optimistically update local application status
        setApplications((prev) =>
          prev.map((app) => {
            if (app.id !== selectedApp.id) return app;
            return {
              ...app,
              interviews: app.interviews.map((i) =>
                i.id === scoringInterviewId
                  ? {
                      ...i,
                      status: "COMPLETED",
                      scorecard: {
                        id: Math.random().toString(),
                        technical: scoreTechnical,
                        communication: scoreCommunication,
                        problemSolving: scoreProblemSolving,
                        behaviour: scoreBehaviour,
                        cultureFit: scoreCultureFit,
                        overallScore:
                          (scoreTechnical +
                            scoreCommunication +
                            scoreProblemSolving +
                            scoreBehaviour +
                            scoreCultureFit) /
                          5,
                        recommendation: scoreRec,
                        feedback: scoreFeedback,
                      },
                    }
                  : i
              ),
            };
          })
        );

        setSelectedApp((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            interviews: prev.interviews.map((i) =>
              i.id === scoringInterviewId
                ? {
                    ...i,
                    status: "COMPLETED",
                    scorecard: {
                      id: Math.random().toString(),
                      technical: scoreTechnical,
                      communication: scoreCommunication,
                      problemSolving: scoreProblemSolving,
                      behaviour: scoreBehaviour,
                      cultureFit: scoreCultureFit,
                      overallScore:
                        (scoreTechnical +
                          scoreCommunication +
                          scoreProblemSolving +
                          scoreBehaviour +
                          scoreCultureFit) /
                        5,
                      recommendation: scoreRec,
                      feedback: scoreFeedback,
                    },
                  }
                : i
            ),
          };
        });

        // Reset
        setScoringInterviewId(null);
        setScoreFeedback("");
        setActiveTab("scorecards");
      }
    });
  };

  const activeApp = applications.find((app) => app.id === activeId);

  const filteredApps = applications.filter((app) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase().trim();
    
    const matchName = app.candidateName.toLowerCase().includes(query);
    const matchEmail = app.candidateEmail.toLowerCase().includes(query);
    const matchSkill = app.candidateProfile.skills.some((s) => 
      s.toLowerCase().includes(query)
    );
    
    return matchName || matchEmail || matchSkill;
  });

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCorners} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full gap-4 w-full">
        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm max-w-sm">
          <input
            type="text"
            placeholder="Filter by name, email, or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm border-none focus:outline-none focus:ring-0 placeholder-gray-400 text-slate-800"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="text-gray-400 hover:text-gray-650"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex h-full gap-6 pb-4 overflow-x-auto items-start">
          {STAGES.map((stage) => (
            <Column 
              key={stage} 
              id={stage} 
              title={STAGE_LABELS[stage]} 
              applications={filteredApps.filter((a) => a.stage === stage)} 
              onViewProfile={(app) => {
                setSelectedApp(app);
                setActiveTab("profile");
                setScoringInterviewId(null);
              }}
            />
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeApp ? <CandidateCard application={activeApp} isOverlay /> : null}
      </DragOverlay>

      {/* Candidate Profile Drawer (Sliding from Right with Premium Backdrop blur) */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300 ease-out border-l border-gray-100">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className="bg-[#2F5D50]/10 p-1.5 rounded-md text-[#2F5D50]">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedApp.candidateName}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Applied {formatDistanceToNow(new Date(selectedApp.appliedAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedApp(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Premium Navigation Tabs */}
            <div className="flex border-b border-gray-200 px-6 bg-white gap-6">
              <button
                onClick={() => { setActiveTab("profile"); setScoringInterviewId(null); }}
                className={`py-3.5 text-sm font-semibold tracking-wide border-b-2 transition-all relative ${
                  activeTab === "profile" 
                    ? "border-[#2F5D50] text-[#2F5D50]" 
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  Profile
                </div>
              </button>
              <button
                onClick={() => { setActiveTab("interviews"); setScoringInterviewId(null); }}
                className={`py-3.5 text-sm font-semibold tracking-wide border-b-2 transition-all relative ${
                  activeTab === "interviews" 
                    ? "border-[#2F5D50] text-[#2F5D50]" 
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Interviews ({selectedApp.interviews.length})
                </div>
              </button>
              <button
                onClick={() => { setActiveTab("scorecards"); setScoringInterviewId(null); }}
                className={`py-3.5 text-sm font-semibold tracking-wide border-b-2 transition-all relative ${
                  activeTab === "scorecards" 
                    ? "border-[#2F5D50] text-[#2F5D50]" 
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  Reviews & Scorecards
                </div>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* TAB 1: PROFILE */}
              {activeTab === "profile" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Contact Buttons */}
                  <div className="bg-gray-50 border border-gray-150 p-5 rounded-xl space-y-4">
                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Direct Actions</h5>
                    <div className="flex flex-wrap gap-2.5">
                      <a 
                        href={`mailto:${selectedApp.candidateEmail}`} 
                        className="inline-flex items-center gap-1.5 bg-[#2F5D50] hover:bg-[#23473D] text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-sm transition-all"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        Email Candidate
                      </a>

                      {selectedApp.candidateProfile.phone && (
                        <a 
                          href={`tel:${selectedApp.candidateProfile.phone}`} 
                          className="inline-flex items-center gap-1.5 bg-white border border-gray-300 text-slate-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg text-xs font-semibold shadow-sm transition-all"
                        >
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          Call Candidate
                        </a>
                      )}

                      {selectedApp.candidateProfile.linkedin && (
                        <a 
                          href={selectedApp.candidateProfile.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-[#0077B5] hover:bg-[#005e8f] text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-sm transition-all"
                        >
                          <LinkedinIcon className="h-3.5 w-3.5" />
                          LinkedIn Profile
                        </a>
                      )}

                      {selectedApp.candidateProfile.portfolio && (
                        <a 
                          href={selectedApp.candidateProfile.portfolio} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-white border border-gray-300 text-slate-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg text-xs font-semibold shadow-sm transition-all"
                        >
                          <Globe className="h-3.5 w-3.5 text-gray-400" />
                          Portfolio Website
                          <ExternalLink className="h-3 w-3 text-gray-400 ml-0.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Application Documents (Resume & Cover Letter) */}
                  {(selectedApp.resumeUrl || selectedApp.coverLetter) && (
                    <div className="bg-gray-50 border border-gray-150 p-5 rounded-xl space-y-4">
                      <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Application Documents</h5>
                      
                      {/* Resume button link */}
                      {selectedApp.resumeUrl && (
                        <div>
                          <a 
                            href={selectedApp.resumeUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-white border border-gray-300 text-slate-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg text-xs font-semibold shadow-sm transition-all"
                          >
                            <FileText className="h-3.5 w-3.5 text-gray-400" />
                            View Candidate Resume
                            <ExternalLink className="h-3 w-3 text-gray-450 ml-0.5" />
                          </a>
                        </div>
                      )}

                      {/* Cover Letter */}
                      {selectedApp.coverLetter && (
                        <div className="space-y-1.5 pt-3 border-t border-gray-200">
                          <span className="text-xs font-semibold text-slate-800">Cover Letter / Note:</span>
                          <div className="text-sm text-gray-600 bg-white border border-gray-100 p-3 rounded-lg leading-relaxed whitespace-pre-line shadow-inner">
                            {selectedApp.coverLetter}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick Email Template Composer */}
                  <div className="bg-gray-50 border border-gray-150 p-5 rounded-xl space-y-4">
                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-[#2F5D50]" />
                      Quick Email Templates
                    </h5>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Select Template</label>
                        <select
                          value={selectedEmailTemplate}
                          onChange={(e) => setSelectedEmailTemplate(e.target.value as "invite" | "offer" | "rejection")}
                          className="w-full text-xs rounded-lg border border-gray-300 p-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#2F5D50]"
                        >
                          <option value="invite">Interview Invitation</option>
                          <option value="offer">Job Offer Letter</option>
                          <option value="rejection">Rejection / Closure</option>
                        </select>
                      </div>

                      {(() => {
                        const { subject, body } = getEmailTemplateContent(selectedEmailTemplate, selectedApp.candidateName);
                        const mailtoHref = `mailto:${selectedApp.candidateEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                        
                        return (
                          <div className="space-y-2.5">
                            <div className="text-[11px] text-gray-600 bg-white border border-gray-100 p-3 rounded-lg leading-relaxed shadow-inner space-y-1">
                              <div><b>Subject:</b> {subject}</div>
                              <div className="border-t pt-1.5 mt-1.5 whitespace-pre-line text-gray-500">{body}</div>
                            </div>
                            
                            <a 
                              href={mailtoHref}
                              className="inline-flex w-full justify-center items-center gap-1.5 bg-[#2F5D50] hover:bg-[#23473D] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all"
                            >
                              <Mail className="h-3.5 w-3.5" />
                              Open Email Draft in Client
                            </a>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* About Summary */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-800">Summary</h4>
                    <div className="text-sm text-gray-600 leading-relaxed bg-white border border-gray-100 p-4 rounded-xl shadow-inner min-h-[80px]">
                      {selectedApp.candidateProfile.summary || <span className="text-gray-400 italic">No summary provided.</span>}
                    </div>
                  </div>

                  {/* Work Experience */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      Work Experience
                    </h4>
                    <div className="text-sm text-gray-600 leading-relaxed bg-white border border-gray-100 p-4 rounded-xl shadow-inner whitespace-pre-line min-h-[100px]">
                      {selectedApp.candidateProfile.experience || <span className="text-gray-400 italic">No experience details listed.</span>}
                    </div>
                  </div>

                  {/* Education */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 text-gray-400" />
                      Education
                    </h4>
                    <div className="text-sm text-gray-600 leading-relaxed bg-white border border-gray-100 p-4 rounded-xl shadow-inner whitespace-pre-line min-h-[100px]">
                      {selectedApp.candidateProfile.education || <span className="text-gray-400 italic">No education details listed.</span>}
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-800">Skills</h4>
                    {selectedApp.candidateProfile.skills && selectedApp.candidateProfile.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedApp.candidateProfile.skills.map((skill) => (
                          <span 
                            key={skill}
                            className="inline-flex items-center rounded-md bg-gray-50 border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No skills listed.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: SCHEDULE INTERVIEW */}
              {activeTab === "interviews" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Schedule New Interview Form */}
                  <form onSubmit={handleScheduleSubmit} className="space-y-4 border border-gray-150 p-5 rounded-xl bg-gray-50/50">
                    <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <PlusCircle className="h-5 w-5 text-[#2F5D50]" />
                      Schedule New Round
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Round Name / Type</label>
                        <select 
                          value={schedType} 
                          onChange={(e) => setSchedType(e.target.value)}
                          className="w-full text-sm rounded-lg border border-gray-300 p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#2F5D50]"
                        >
                          <option value="Technical Round">Technical Round</option>
                          <option value="HR Screening">HR Screening</option>
                          <option value="Managerial Round">Managerial Round</option>
                          <option value="System Design Round">System Design Round</option>
                          <option value="Culture Fit Round">Culture Fit Round</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date & Time</label>
                        <input 
                          type="datetime-local" 
                          required
                          value={schedTime}
                          onChange={(e) => setSchedTime(e.target.value)}
                          className="w-full text-sm rounded-lg border border-gray-300 p-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#2F5D50]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Meeting Link (optional)</label>
                      <input 
                        type="url" 
                        placeholder="https://meet.google.com/abc-defg-hij"
                        value={schedLink}
                        onChange={(e) => setSchedLink(e.target.value)}
                        className="w-full text-sm rounded-lg border border-gray-300 p-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#2F5D50]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Coordinator Notes</label>
                      <textarea 
                        rows={3}
                        placeholder="Detail any specifics that the candidate or interviewer needs to prepare..."
                        value={schedNotes}
                        onChange={(e) => setSchedNotes(e.target.value)}
                        className="w-full text-sm rounded-lg border border-gray-300 p-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#2F5D50] leading-relaxed resize-none"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isPending}
                        className="bg-[#2F5D50] hover:bg-[#23473D] text-white text-sm px-5 py-2.5 rounded-lg font-semibold shadow-sm transition-all"
                      >
                        {isPending ? "Scheduling..." : "Schedule Interview"}
                      </button>
                    </div>
                  </form>

                  {/* Scheduled Interviews History */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-800">Interview History & Pipeline Calendar</h4>
                    {selectedApp.interviews.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No interviews scheduled yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedApp.interviews.map((item) => (
                          <div key={item.id} className="border border-gray-150 rounded-xl p-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-800 text-sm">{item.interviewType}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  item.status === "COMPLETED" 
                                    ? "bg-emerald-100 text-emerald-800" 
                                    : item.status === "SCHEDULED" 
                                    ? "bg-blue-100 text-blue-800" 
                                    : "bg-gray-100 text-gray-800"
                                }`}>
                                  {item.status}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                                {new Date(item.scheduledAt).toLocaleString()}
                              </p>
                              {item.meetingLink && (
                                <a 
                                  href={item.meetingLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-xs text-[#2F5D50] hover:underline flex items-center gap-1 mt-1 font-medium"
                                >
                                  <Video className="h-3.5 w-3.5" />
                                  Join Video Meeting
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: REVIEWS & SCORECARDS */}
              {activeTab === "scorecards" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Scorecard Submission Section */}
                  {scoringInterviewId && (
                    <form onSubmit={handleScorecardSubmit} className="space-y-4 border border-gray-150 p-5 rounded-xl bg-gray-50/50">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                          Fill Out Review Scorecard
                        </h4>
                        <button 
                          type="button" 
                          onClick={() => setScoringInterviewId(null)}
                          className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Ratings */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { label: "Technical Ability", val: scoreTechnical, set: setScoreTechnical },
                          { label: "Communication Skills", val: scoreCommunication, set: setScoreCommunication },
                          { label: "Problem Solving", val: scoreProblemSolving, set: setScoreProblemSolving },
                          { label: "Cultural Alignment", val: scoreCultureFit, set: setScoreCultureFit },
                          { label: "Behavioral / Values", val: scoreBehaviour, set: setScoreBehaviour },
                        ].map((rating, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-white border border-gray-200 p-2.5 rounded-lg">
                            <span className="text-xs font-semibold text-gray-700">{rating.label}</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  type="button"
                                  key={star}
                                  onClick={() => rating.set(star)}
                                  className="focus:outline-none"
                                >
                                  <Star className={`h-4.5 w-4.5 ${star <= rating.val ? "text-amber-500 fill-amber-500" : "text-gray-200"}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Recommendation */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Hiring Recommendation</label>
                        <select
                          value={scoreRec}
                          onChange={(e) => setScoreRec(e.target.value)}
                          className="w-full text-sm rounded-lg border border-gray-300 p-2.5 bg-white focus:outline-none"
                        >
                          <option value="Strong Hire">Strong Hire (Must Have)</option>
                          <option value="Hire">Hire</option>
                          <option value="No Hire">No Hire</option>
                          <option value="Strong No Hire">Strong No Hire</option>
                        </select>
                      </div>

                      {/* Written Feedback */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Written Evaluation & Feedback</label>
                        <textarea
                          rows={4}
                          required
                          placeholder="Provide concrete details about their strengths, red flags, and alignment with roles..."
                          value={scoreFeedback}
                          onChange={(e) => setScoreFeedback(e.target.value)}
                          className="w-full text-sm rounded-lg border border-gray-300 p-2 bg-white focus:outline-none leading-relaxed resize-none"
                        />
                      </div>

                      <div className="flex justify-end gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => setScoringInterviewId(null)}
                          className="bg-white border border-gray-300 text-slate-700 text-sm px-4 py-2 rounded-lg font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isPending}
                          className="bg-[#2F5D50] hover:bg-[#23473D] text-white text-sm px-5 py-2 rounded-lg font-semibold shadow-sm"
                        >
                          {isPending ? "Submitting..." : "Submit Scorecard"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* List of scorecards */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-800">Evaluations History</h4>
                    {selectedApp.interviews.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No evaluations listed.</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedApp.interviews.map((item) => {
                          const sc = item.scorecard;
                          return (
                            <div key={item.id} className="border border-gray-150 rounded-xl p-4 bg-white space-y-3">
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <span className="font-semibold text-slate-900 text-sm">{item.interviewType}</span>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    Date: {new Date(item.scheduledAt).toLocaleDateString()}
                                  </p>
                                </div>
                                {sc ? (
                                  <div className="text-right space-y-1">
                                    <span className="inline-flex items-center rounded-md bg-[#2F5D50]/10 px-2 py-1 text-xs font-bold text-[#2F5D50]">
                                      Score: {sc.overallScore.toFixed(1)} / 5.0
                                    </span>
                                    <div className={`text-[10px] font-bold uppercase tracking-wide block ${
                                      sc.recommendation.includes("Strong Hire") 
                                        ? "text-emerald-600" 
                                        : sc.recommendation.includes("No Hire") 
                                        ? "text-rose-600" 
                                        : "text-blue-600"
                                    }`}>
                                      {sc.recommendation}
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setScoringInterviewId(item.id)}
                                    className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs px-3 py-1.5 rounded-lg font-semibold shadow-sm transition-all"
                                  >
                                    Submit Scorecard
                                  </button>
                                )}
                              </div>

                              {sc && (
                                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 space-y-2">
                                  {/* Evaluation Scores Breakdown */}
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border-b pb-2 mb-2 text-xs text-gray-500">
                                    <div>Tech: <span className="font-bold text-slate-800">{sc.technical}/5</span></div>
                                    <div>Comm: <span className="font-bold text-slate-800">{sc.communication}/5</span></div>
                                    <div>Logic: <span className="font-bold text-slate-800">{sc.problemSolving}/5</span></div>
                                    <div>Values: <span className="font-bold text-slate-800">{sc.behaviour}/5</span></div>
                                    <div>Culture: <span className="font-bold text-slate-800">{sc.cultureFit}/5</span></div>
                                  </div>
                                  <div className="italic leading-relaxed whitespace-pre-line">
                                    &ldquo;{sc.feedback}&rdquo;
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Drawer Footer */}
            <div className="border-t px-6 py-4 bg-gray-50/50 flex justify-end">
              <button 
                onClick={() => setSelectedApp(null)}
                className="bg-white border border-gray-300 text-slate-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all"
              >
                Close Drawer
              </button>
            </div>

          </div>
        </div>
      )}
    </DndContext>
  );
}

// --- Subcomponents ---

function Column({ 
  id, 
  title, 
  applications, 
  onViewProfile 
}: { 
  id: ApplicationStage; 
  title: string; 
  applications: Application[]; 
  onViewProfile: (app: Application) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex h-full w-80 shrink-0 flex-col rounded-xl bg-gray-100/50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium text-slate-900">{title}</h3>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
          {applications.length}
        </span>
      </div>
      
      <div 
        ref={setNodeRef} 
        className={`flex flex-1 flex-col gap-3 rounded-lg border-2 border-transparent transition-colors overflow-y-auto ${isOver ? 'border-[#2F5D50]/30 bg-[#2F5D50]/5' : ''}`}
      >
        {applications.map((app) => (
          <CandidateCard key={app.id} application={app} onViewProfile={onViewProfile} />
        ))}
      </div>
    </div>
  );
}

function CandidateCard({ 
  application, 
  isOverlay, 
  onViewProfile 
}: { 
  application: Application; 
  isOverlay?: boolean; 
  onViewProfile?: (app: Application) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  if (isDragging && !isOverlay) {
    return <div className="h-28 rounded-xl border-2 border-dashed border-[#2F5D50]/40 bg-[#2F5D50]/5" />;
  }

  // Calculate Overall Average Score if scorecards exist
  const scorecards = application.interviews.map(i => i.scorecard).filter(Boolean) as Scorecard[];
  const avgScore = scorecards.length > 0
    ? scorecards.reduce((sum, sc) => sum + sc.overallScore, 0) / scorecards.length
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`group relative cursor-grab rounded-xl border bg-white p-4 shadow-sm transition-all hover:border-[#2F5D50]/40 hover:shadow-md active:cursor-grabbing ${isOverlay ? 'rotate-2 scale-105 cursor-grabbing shadow-lg' : ''}`}
    >
      <div className="flex justify-between items-start gap-2">
        <p className="font-semibold text-slate-900 text-sm">{application.candidateName}</p>
        {avgScore !== null && (
          <span className="inline-flex items-center rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
            ★ {avgScore.toFixed(1)}
          </span>
        )}
      </div>

      <p className="mt-1 text-[11px] text-gray-400">
        Applied {formatDistanceToNow(new Date(application.appliedAt), { addSuffix: true })}
      </p>

      {/* Reviews Summary indicators */}
      {application.interviews.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            <span>{application.interviews.length} Round{application.interviews.length > 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-1">
            {application.interviews.some(i => i.status === "COMPLETED") ? (
              <span className="flex items-center gap-0.5 text-emerald-600 font-semibold">
                <CheckCircle className="h-3 w-3" /> Reviewed
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-blue-500">
                <Clock className="h-3 w-3" /> Scheduled
              </span>
            )}
          </div>
        </div>
      )}

      {/* View Profile Action Link (Stops drag listener propagation) */}
      {!isOverlay && onViewProfile && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewProfile(application);
          }}
          className="mt-3 text-xs text-[#2F5D50] hover:text-[#23473D] hover:underline font-semibold pointer-events-auto block transition-colors w-full text-left pt-2 border-t border-gray-50"
        >
          View Profile & Scorecards
        </button>
      )}
    </div>
  );
}