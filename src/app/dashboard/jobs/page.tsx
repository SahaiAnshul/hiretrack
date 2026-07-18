import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { archiveJob } from "@/server/actions/job";
import { JobMemoPanel } from "@/components/features/jobs/JobMemoPanel";

export const dynamic = "force-dynamic";

export default async function JobsDashboardPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "RECRUITER") {
    redirect("/login");
  }

  const jobs = await db.job.findMany({
    where: { recruiterId: session.user.id, status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { applications: true },
      },
      jobNotes: {
        where: { userId: session.user.id },
      },
    },
  });

  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Jobs</h1>
          <p className="text-sm text-gray-500">Manage your open positions and applications.</p>
        </div>
        <Link href="/dashboard/jobs/new">
          <Button className="bg-[#2F5D50] hover:bg-[#23473D] text-white">
            Create Job
          </Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <h3 className="mb-2 text-lg font-medium text-gray-900">No jobs posted</h3>
          <p className="mb-6 max-w-sm text-sm text-gray-500">
            You haven&apos;t posted any jobs yet. Create your first job posting to start receiving applications.
          </p>
          <Link href="/dashboard/jobs/new">
            <Button className="bg-[#2F5D50] hover:bg-[#23473D] text-white">
              Create your first Job
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applicants</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => {
                const memo = job.jobNotes?.[0]?.content || "";
                return (
                  <TableRow key={job.id} className="hover:bg-gray-50/40">
                    <TableCell className="font-medium text-slate-900">
                      <div className="flex flex-col">
                        <Link href={`/dashboard/jobs/${job.id}/pipeline`} className="hover:text-[#C97C5D] font-semibold transition-colors">
                          {job.title}
                        </Link>
                        <span className="text-xs font-normal text-gray-500">{(job.companyName || "Company")} • {job.department} • {job.location}</span>
                        {/* Recruiter Memo panel */}
                        <JobMemoPanel jobId={job.id} initialContent={memo} themeColor="recruiter" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${job.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {job.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-600">{job._count.applications}</TableCell>
                    <TableCell className="text-gray-500">
                      {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-3">
                        <Link href={`/dashboard/jobs/${job.id}/pipeline`} className="text-[#2F5D50] hover:text-[#23473D] hover:underline font-semibold text-sm">
                          View Pipeline
                        </Link>
                        <span className="text-gray-300">|</span>
                        <form action={async () => {
                          "use server";
                          await archiveJob(job.id);
                        }}>
                          <button type="submit" className="text-rose-600 hover:text-rose-800 hover:underline font-semibold text-sm">
                            Remove
                          </button>
                        </form>
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