import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();

  // If already logged in, route them to their respective dashboards
  if (session?.user) {
    if (session.user.role === "RECRUITER") {
      redirect("/dashboard/jobs");
    } else {
      redirect("/candidate/jobs");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      {/* Navigation */}
      <header className="flex items-center justify-between px-6 py-4 lg:px-12 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#2F5D50] flex items-center justify-center">
            <span className="text-white font-bold text-xl">H</span>
          </div>
          <span className="text-xl font-semibold tracking-tight text-slate-900">HireTrack</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Sign in
          </Link>
          <Link href="/register">
            <Button className="bg-[#2F5D50] hover:bg-[#23473D] text-white">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 mt-20 mb-32">
        <div className="inline-flex items-center rounded-full border border-[#C97C5D]/30 bg-[#C97C5D]/10 px-3 py-1 text-sm font-medium text-[#C97C5D] mb-8">
          The new standard in recruitment
        </div>
        
        <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
          Applicant pipeline with scorecards and interview scheduling.
        </h1>
        
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
          A streamlined, professional ATS that reduces recruiter effort through intelligent Kanban workflows, structured scorecards, and high-performance UI.
        </p>
        
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link href="/register">
            <Button size="lg" className="bg-[#2F5D50] hover:bg-[#23473D] text-white px-8 h-12 text-base">
              Start Hiring
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}