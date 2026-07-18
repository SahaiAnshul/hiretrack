import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { RecruiterSettingsForm } from "./RecruiterSettingsForm";
import { Settings } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RecruiterSettingsPage() {
  const session = await auth();

  if (!session || session.user.role !== "RECRUITER") {
    redirect("/login");
  }

  // 1. Fetch user detail & logs
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      auditLogs: {
        where: { action: "LOGIN" },
        orderBy: { timestamp: "desc" },
        take: 10,
        select: {
          id: true,
          timestamp: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const initialData = {
    name: user.name || "",
    username: user.username || "",
    email: user.email || "",
  };

  return (
    <div className="mx-auto max-w-3xl p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-2">
        <span className="p-1.5 bg-[#2F5D50]/10 rounded-md text-[#2F5D50]">
          <Settings className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your recruiter preferences and account controls.</p>
        </div>
      </div>

      <RecruiterSettingsForm initialData={initialData} loginHistory={user.auditLogs} />
    </div>
  );
}
