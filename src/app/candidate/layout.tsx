import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Briefcase, FileText, LogOut, User } from "lucide-react";

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // 1. Authenticate and authorize candidate
  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "CANDIDATE") {
    redirect("/dashboard/jobs");
  }

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/candidate/jobs" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#C97C5D] flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                HireTrack <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded ml-1">Candidate</span>
              </span>
            </Link>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/candidate/jobs"
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-slate-950 transition-colors"
              >
                <Briefcase className="h-4 w-4" />
                Find Jobs
              </Link>
              <Link
                href="/candidate/applications"
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-slate-950 transition-colors"
              >
                <FileText className="h-4 w-4" />
                My Applications
              </Link>
              <Link
                href="/candidate/profile"
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-slate-950 transition-colors"
              >
                <User className="h-4 w-4" />
                My Profile
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 hidden sm:inline">
              {session.user.name}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                className="text-gray-600 hover:text-red-600 flex items-center gap-1.5"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Sign out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Mobile navigation bar */}
      <div className="md:hidden bg-white border-b border-gray-100 px-4 py-2.5 flex justify-around text-center shadow-sm">
        <Link
          href="/candidate/jobs"
          className="flex flex-col items-center gap-1 text-xs font-medium text-gray-600 hover:text-[#C97C5D]"
        >
          <Briefcase className="h-4 w-4" />
          Jobs
        </Link>
        <Link
          href="/candidate/applications"
          className="flex flex-col items-center gap-1 text-xs font-medium text-gray-600 hover:text-[#C97C5D]"
        >
          <FileText className="h-4 w-4" />
          Applications
        </Link>
        <Link
          href="/candidate/profile"
          className="flex flex-col items-center gap-1 text-xs font-medium text-gray-600 hover:text-[#C97C5D]"
        >
          <User className="h-4 w-4" />
          Profile
        </Link>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
