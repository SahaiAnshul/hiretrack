import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Briefcase, Calendar, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { WithdrawButton } from "./WithdrawButton";
import { AIScanButton } from "./AIScanButton";

export const dynamic = "force-dynamic";

const stageColors: Record<string, { bg: string; text: string; label: string }> = {
  APPLIED: { bg: "bg-blue-50 border border-blue-100", text: "text-blue-700", label: "Applied" },
  SCREENING: { bg: "bg-purple-50 border border-purple-100", text: "text-purple-700", label: "Screening" },
  INTERVIEW: { bg: "bg-amber-50 border border-amber-100", text: "text-amber-700", label: "Interviewing" },
  OFFER: { bg: "bg-indigo-50 border border-indigo-100", text: "text-indigo-700", label: "Offer Extended" },
  HIRED: { bg: "bg-emerald-50 border border-emerald-100", text: "text-emerald-700", label: "Hired!" },
  REJECTED: { bg: "bg-rose-50 border border-rose-100", text: "text-rose-700", label: "Closed" },
};

export default async function CandidateApplicationsPage() {
  const session = await auth();

  if (!session || session.user.role !== "CANDIDATE") {
    redirect("/login");
  }

  // 1. Fetch user's candidate profile
  const profile = await db.candidateProfile.findUnique({
    where: { userId: session.user.id },
  });

  // 2. Fetch the applications with job details
  const applications = profile
    ? await db.application.findMany({
        where: {
          candidateId: profile.id,
        },
        include: {
          job: true,
        },
        orderBy: {
          appliedAt: "desc",
        },
      })
    : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Applications</h1>
        <p className="mt-2 text-sm text-gray-600">
          Track the status of your applications in the recruitment pipeline.
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No applications yet</h3>
          <p className="max-w-sm mt-2 text-sm text-gray-500 mb-6">
            You haven&apos;t applied to any job listings yet. Start your journey by exploring open roles.
          </p>
          <Link
            href="/candidate/jobs"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2F5D50] hover:bg-[#23473D] text-white px-4 py-2 text-sm font-medium shadow-sm transition-all"
          >
            Browse Open Jobs
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="w-[300px]">Role / Company</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Applied On</TableHead>
                <TableHead>Pipeline Stage</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => {
                const stage = stageColors[app.currentStage] || {
                  bg: "bg-gray-50",
                  text: "text-gray-700",
                  label: app.currentStage,
                };
                return (
                  <TableRow key={app.id} className="hover:bg-gray-50/40">
                    <TableCell className="font-medium">
                      <div>
                        <div className="text-base font-semibold text-slate-900">
                          {app.job.title} <span className="text-sm font-normal text-gray-500">at {app.job.companyName || "Company"}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{app.job.department}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{app.job.location}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {new Date(app.appliedAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${stage.bg} ${stage.text}`}
                      >
                        {app.currentStage !== "HIRED" && app.currentStage !== "REJECTED" && (
                          <Loader2 className="h-3 w-3 animate-spin mr-0.5" />
                        )}
                        {stage.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        {profile && (
                          <AIScanButton 
                            application={{
                              id: app.id,
                              job: {
                                title: app.job.title,
                                description: app.job.description,
                                requiredSkills: app.job.requiredSkills,
                              }
                            }}
                            candidateProfile={{
                              summary: profile.summary || "",
                              experience: profile.experience || "",
                              education: profile.education || "",
                              skills: profile.skills || [],
                            }}
                          />
                        )}
                        <WithdrawButton applicationId={app.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
