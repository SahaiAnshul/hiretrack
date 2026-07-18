import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { PipelineBoard } from "@/components/features/pipeline/PipelineBoard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ jobId: string }>;
}

export default async function PipelinePage({ params }: PageProps) {
  const { jobId } = await params;
  const session = await auth();

  if (!session?.user || session.user.role !== "RECRUITER") {
    redirect("/login");
  }

  const job = await db.job.findUnique({
    where: { id: jobId, recruiterId: session.user.id },
    include: {
      applications: {
        include: {
          candidate: {
            include: { user: true },
          },
          interviews: {
            include: {
              scorecard: true,
            },
            orderBy: { scheduledAt: "asc" },
          },
        },
        orderBy: { appliedAt: "desc" },
      },
    },
  });

  if (!job) {
    notFound();
  }

  // Format data for the client component
  const applications = job.applications.map((app) => ({
    id: app.id,
    candidateName: app.candidate.user.name || "Unknown Candidate",
    stage: app.currentStage,
    appliedAt: app.appliedAt,
    candidateEmail: app.candidate.user.email || "",
    resumeUrl: app.resumeUrl || "",
    coverLetter: app.coverLetter || "",
    candidateProfile: {
      phone: app.candidate.phone || "",
      summary: app.candidate.summary || "",
      experience: app.candidate.experience || "",
      education: app.candidate.education || "",
      skills: app.candidate.skills || [],
      linkedin: app.candidate.linkedin || "",
      portfolio: app.candidate.portfolio || "",
    },
    interviews: app.interviews.map((i) => ({
      id: i.id,
      interviewType: i.interviewType,
      scheduledAt: i.scheduledAt,
      meetingLink: i.meetingLink || "",
      status: i.status,
      notes: i.notes || "",
      scorecard: i.scorecard
        ? {
            id: i.scorecard.id,
            technical: i.scorecard.technical,
            communication: i.scorecard.communication,
            problemSolving: i.scorecard.problemSolving,
            behaviour: i.scorecard.behaviour,
            cultureFit: i.scorecard.cultureFit,
            overallScore: i.scorecard.overallScore,
            recommendation: i.scorecard.recommendation,
            feedback: i.scorecard.feedback,
          }
        : null,
    })),
  }));

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-[#F7F5F2]">
      <div className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/dashboard/jobs" className="hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span>Back to Jobs</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900">{job.title} Pipeline at {job.companyName || "Company"}</h1>
        </div>
      </div>
      
      {/* Scrollable Container for Kanban */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <PipelineBoard initialApplications={applications} jobId={job.id} />
      </div>
    </div>
  );
}