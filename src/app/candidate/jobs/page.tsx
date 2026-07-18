import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ApplyButton } from "./ApplyButton";
import { JobMemoPanel } from "@/components/features/jobs/JobMemoPanel";
import { Briefcase, MapPin, DollarSign, Calendar, Tag, Clock, Award } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CandidateJobsPage() {
  const session = await auth();

  if (!session || session.user.role !== "CANDIDATE") {
    redirect("/login");
  }

  // 1. Fetch all open jobs
  const jobs = await db.job.findMany({
    where: {
      status: "OPEN",
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  // 2. Fetch user's candidate profile
  const profile = await db.candidateProfile.findUnique({
    where: { userId: session.user.id },
  });

  // 2. Fetch user's job notes/memos
  const jobNotes = await db.jobNote.findMany({
    where: { userId: session.user.id },
  });

  // 3. Get list of job IDs the candidate has already applied to
  const appliedJobIds = profile
    ? (
        await db.application.findMany({
          where: { candidateId: profile.id },
          select: { jobId: true },
        })
      ).map((app) => app.jobId)
    : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Explore Job Openings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Discover active postings and apply with one click.
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm">
          <Briefcase className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No open jobs</h3>
          <p className="max-w-sm mt-2 text-sm text-gray-500">
            There are currently no active job postings. Please check back later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => {
            const isApplied = appliedJobIds.includes(job.id);
            const candidateSkills = profile?.skills || [];
            const required = job.requiredSkills || [];
            const matchingSkills = required.filter((skill) =>
              candidateSkills.some((s) => s.toLowerCase().trim() === skill.toLowerCase().trim())
            );
            const matchPercentage = required.length > 0
              ? Math.round((matchingSkills.length / required.length) * 100)
              : 100;
            const memo = jobNotes.find((n) => n.jobId === job.id)?.content || "";
            
            return (
              <div
                key={job.id}
                className="overflow-hidden rounded-xl bg-white border border-gray-200/80 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-gray-300 transition-all p-6"
              >
                <div>
                  {/* Job Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 hover:text-[#C97C5D] transition-colors">
                        {job.title}
                      </h2>
                      <p className="text-sm font-medium text-gray-500 mt-0.5">
                        {job.companyName || "Company"} • {job.department}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-[#2F5D50]/10 px-2.5 py-1 text-xs font-medium text-[#2F5D50]">
                      {job.employmentType}
                    </span>
                  </div>

                  {/* Metadata info */}
                  <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {job.location}
                    </div>
                    {job.salaryRange && (
                      <div className="flex items-center gap-0.5">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        {job.salaryRange}
                      </div>
                    )}
                    {job.workingHours && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>Hours: {job.workingHours}</span>
                      </div>
                    )}
                    {job.workingDays && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>Schedule: {job.workingDays}</span>
                      </div>
                    )}
                    {job.experienceLevel && (
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4 text-gray-400" />
                        <span>Exp: {job.experienceLevel}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Skills Match Indicator */}
                  <div className="mb-4 bg-gray-50 border border-gray-150 p-3 rounded-lg text-xs space-y-2">
                    <div className="flex justify-between items-center font-semibold text-gray-700">
                      <span>Skills Match Score</span>
                      <span className={`${
                        matchPercentage >= 75 
                          ? "text-emerald-600 font-bold" 
                          : matchPercentage >= 40 
                          ? "text-amber-600 font-bold" 
                          : "text-gray-500"
                      }`}>
                        {matchPercentage}% Match
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          matchPercentage >= 75 
                            ? "bg-emerald-500" 
                            : matchPercentage >= 40 
                            ? "bg-amber-500" 
                            : "bg-gray-450"
                        }`}
                        style={{ width: `${matchPercentage}%` }}
                      ></div>
                    </div>
                    {required.length > 0 && (
                      <div className="text-[10px] text-gray-400 mt-1 leading-normal">
                        Matching: <span className="font-semibold text-slate-800">{matchingSkills.length}</span> of {required.length} required skills
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-3 mb-5 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Skills tags */}
                  {job.requiredSkills && job.requiredSkills.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-1 text-xs font-medium text-gray-400 mb-2">
                        <Tag className="h-3 w-3" />
                        Key Skills Required:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {job.requiredSkills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center rounded-md bg-gray-50 border border-gray-150 px-2 py-0.5 text-xs font-medium text-gray-600"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Personal Memos (Hidden for others, visible only to themselves) */}
                  <JobMemoPanel jobId={job.id} initialContent={memo} themeColor="candidate" />
                </div>

                {/* Apply Button */}
                <div className="mt-auto pt-4 border-t border-gray-100">
                  <ApplyButton jobId={job.id} jobTitle={job.title} isApplied={isApplied} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
