import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, Briefcase, ArrowRight, UserCheck } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // 1. Fetch live metrics from the database
  const activeJobsCount = await db.job.count({
    where: {
      recruiterId: session.user.id,
      status: "OPEN",
    },
  });

  const totalCandidatesCount = await db.application.count({
    where: {
      job: {
        recruiterId: session.user.id,
      },
    },
  });

  const successfulHiresCount = await db.application.count({
    where: {
      currentStage: "HIRED",
      job: {
        recruiterId: session.user.id,
      },
    },
  });

  // 2. Fetch candidate counts grouped by stage in a single query (pool-safe)
  const applications = await db.application.findMany({
    where: {
      job: {
        recruiterId: session.user.id,
      },
    },
    select: {
      currentStage: true,
    },
  });

  const stagesList = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"] as const;
  const stageCounts = stagesList.map((stage) => {
    const count = applications.filter((app) => app.currentStage === stage).length;
    return { stage, count };
  });

  return (
    <div className="bg-[#F7F5F2] min-h-[calc(100vh-4rem)]">
      {/* Main Dashboard Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Recruiter Overview
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your active job postings and candidate pipelines.
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <Link href="/dashboard/jobs/new">
              <Button className="bg-[#2F5D50] hover:bg-[#23473D] text-white flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Post New Job
              </Button>
            </Link>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Active Jobs Card */}
          <Link href="/dashboard/jobs" className="group block">
            <div className="overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 group-hover:shadow-md group-hover:ring-gray-300 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-[#2F5D50]/10 p-3">
                    <Briefcase className="h-6 w-6 text-[#2F5D50]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Active Jobs</p>
                    <p className="text-2xl font-semibold text-gray-900">{activeJobsCount}</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-[#2F5D50] transition-colors" />
              </div>
            </div>
          </Link>

          {/* Candidates Card */}
          <div className="overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-[#C97C5D]/10 p-3">
                <Users className="h-6 w-6 text-[#C97C5D]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Candidates</p>
                <p className="text-2xl font-semibold text-gray-900">{totalCandidatesCount}</p>
              </div>
            </div>
          </div>

          {/* Successful Hires Card */}
          <div className="overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-green-50 p-3">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Successful Hires</p>
                <p className="text-2xl font-semibold text-gray-900">{successfulHiresCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hiring Pipeline Funnel Breakdown */}
        <div className="mt-8 overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Pipeline Conversion Funnel</h3>
          {totalCandidatesCount === 0 ? (
            <p className="text-sm text-gray-400 italic">No candidates in your job pipelines yet.</p>
          ) : (
            <div className="space-y-4">
              {stageCounts.map(({ stage, count }) => {
                const percentage = totalCandidatesCount > 0 
                  ? Math.round((count / totalCandidatesCount) * 100) 
                  : 0;

                const colors: Record<string, string> = {
                  APPLIED: "bg-blue-500",
                  SCREENING: "bg-purple-500",
                  INTERVIEW: "bg-amber-500",
                  OFFER: "bg-indigo-500",
                  HIRED: "bg-emerald-500",
                  REJECTED: "bg-rose-500",
                };

                const labels: Record<string, string> = {
                  APPLIED: "Applied",
                  SCREENING: "Screening",
                  INTERVIEW: "Interview",
                  OFFER: "Offer",
                  HIRED: "Hired",
                  REJECTED: "Rejected",
                };

                return (
                  <div key={stage} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-gray-700">{labels[stage]}</span>
                      <span className="text-gray-500">
                        {count} candidate{count !== 1 ? "s" : ""} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${colors[stage]} transition-all duration-500`}
                        style={{ width: `${Math.max(percentage, count > 0 ? 3 : 0)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}