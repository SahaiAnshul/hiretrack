"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { profileSchema, ProfileInput } from "@/types/profile";
import { revalidatePath } from "next/cache";

export async function updateCandidateProfile(data: ProfileInput) {
  try {
    const session = await auth();

    // 1. Authenticate & Authorize
    if (!session?.user || session.user.role !== "CANDIDATE") {
      return { error: "Unauthorized. Candidate access required." };
    }

    // 2. Validate Payload
    const parsed = profileSchema.safeParse(data);
    if (!parsed.success) {
      return { error: "Invalid input fields." };
    }

    const {
      name,
      phone,
      summary,
      experience,
      education,
      skills,
      linkedin,
      portfolio,
    } = parsed.data;

    // 3. Update User details (like full name)
    await db.user.update({
      where: { id: session.user.id },
      data: { name },
    });

    // Parse skills from comma-separated string to string array
    const skillsArray = skills
      ? skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    // 4. Upsert CandidateProfile
    await db.candidateProfile.upsert({
      where: { userId: session.user.id },
      update: {
        phone: phone || null,
        summary: summary || null,
        experience: experience || null,
        education: education || null,
        skills: skillsArray,
        linkedin: linkedin || null,
        portfolio: portfolio || null,
      },
      create: {
        userId: session.user.id,
        phone: phone || null,
        summary: summary || null,
        experience: experience || null,
        education: education || null,
        skills: skillsArray,
        linkedin: linkedin || null,
        portfolio: portfolio || null,
      },
    });

    // 5. Revalidate
    revalidatePath("/candidate/profile");
    return { success: "Profile updated successfully!" };
  } catch (error) {
    console.error("Profile Update Error:", error);
    return { error: "An unexpected error occurred while saving your profile." };
  }
}

export async function deleteUserAccount() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Unauthorized." };
    }

    const userId = session.user.id;

    if (session.user.role === "CANDIDATE") {
      // 1. Fetch Candidate Profile
      const profile = await db.candidateProfile.findUnique({
        where: { userId },
      });

      if (profile) {
        // Delete all applications (Prisma onDelete: Cascade handles application interviews and scorecards)
        await db.application.deleteMany({
          where: { candidateId: profile.id },
        });

        // Delete candidate profile
        await db.candidateProfile.delete({
          where: { id: profile.id },
        });
      }
    } else if (session.user.role === "RECRUITER") {
      // 1. Fetch recruiter jobs
      const jobs = await db.job.findMany({
        where: { recruiterId: userId },
        select: { id: true },
      });

      const jobIds = jobs.map((j) => j.id);

      if (jobIds.length > 0) {
        // Delete all applications to these jobs (Cascades to interviews and scorecards)
        await db.application.deleteMany({
          where: { jobId: { in: jobIds } },
        });

        // Delete recruiter jobs
        await db.job.deleteMany({
          where: { recruiterId: userId },
        });
      }

      // 2. Delete interviews where this recruiter was interviewer
      await db.interview.deleteMany({
        where: { interviewerId: userId },
      });
    }

    // 2. Delete User account
    await db.user.delete({
      where: { id: userId },
    });

    return { success: "Account deleted successfully." };
  } catch (error) {
    console.error("Delete Account Error:", error);
    return { error: "Failed to delete account. Please try again." };
  }
}
