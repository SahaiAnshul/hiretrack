import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function CandidateProfilePage() {
  const session = await auth();

  if (!session || session.user.role !== "CANDIDATE") {
    redirect("/login");
  }

  // 1. Fetch user detail
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      candidateProfile: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const profile = user.candidateProfile;

  // 2. Format values for initial data
  const initialData = {
    name: user.name || "",
    phone: profile?.phone || "",
    summary: profile?.summary || "",
    experience: profile?.experience || "",
    education: profile?.education || "",
    skills: profile?.skills ? profile.skills.join(", ") : "",
    linkedin: profile?.linkedin || "",
    portfolio: profile?.portfolio || "",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Professional Profile</h1>
        <p className="mt-2 text-sm text-gray-600">
          Create and manage your professional profile so recruiters can easily review your credentials and contact details.
        </p>
      </div>

      <ProfileForm initialData={initialData} />
    </div>
  );
}
