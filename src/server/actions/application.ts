"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { ApplicationStage } from "@prisma/client";
import { updateStageSchema } from "@/types/application";

export async function applyForJob(
  jobId: string,
  data?: { resumeUrl?: string; coverLetter?: string }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "CANDIDATE") {
      return { error: "Only candidates can apply for jobs." };
    }

    const { resumeUrl, coverLetter } = data || {};

    if (resumeUrl && !resumeUrl.startsWith("http://") && !resumeUrl.startsWith("https://")) {
      return { error: "Please enter a valid resume URL starting with http:// or https://" };
    }

    // Ensure candidate profile exists
    let profile = await db.candidateProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      profile = await db.candidateProfile.create({
        data: { userId: session.user.id },
      });
    }

    // Check if already applied
    const existing = await db.application.findFirst({
      where: { jobId, candidateId: profile.id },
    });

    if (existing) {
      return { error: "You have already applied for this job." };
    }

    await db.application.create({
      data: {
        jobId,
        candidateId: profile.id,
        currentStage: "APPLIED",
        resumeUrl: resumeUrl || null,
        coverLetter: coverLetter || null,
      },
    });

    revalidatePath("/candidate/jobs");
    return { success: "Application submitted successfully." };
  } catch (error) {
    console.error("Apply error:", error);
    return { error: "Failed to submit application." };
  }
}

export async function moveCandidate(applicationId: string, newStage: ApplicationStage) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "RECRUITER") {
      return { error: "Unauthorized." };
    }

    const parsed = updateStageSchema.safeParse({ applicationId, newStage });
    if (!parsed.success) {
      return { error: "Invalid stage data." };
    }

    // Verify ownership of the job this application belongs to
    const application = await db.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });

    if (!application || application.job.recruiterId !== session.user.id) {
      return { error: "Unauthorized to modify this application." };
    }

    await db.application.update({
      where: { id: applicationId },
      data: { currentStage: newStage },
    });

    // Revalidate the pipeline page
    revalidatePath(`/dashboard/jobs/${application.jobId}/pipeline`);
    return { success: "Candidate moved successfully." };
  } catch (error) {
    console.error("Move candidate error:", error);
    return { error: "Failed to move candidate." };
  }
}

export async function withdrawApplication(applicationId: string) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "CANDIDATE") {
      return { error: "Unauthorized." };
    }

    const profile = await db.candidateProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return { error: "Candidate profile not found." };
    }

    // Verify ownership
    const application = await db.application.findUnique({
      where: { id: applicationId },
      select: { candidateId: true },
    });

    if (!application || application.candidateId !== profile.id) {
      return { error: "Application not found or unauthorized." };
    }

    await db.application.delete({
      where: { id: applicationId },
    });

    revalidatePath("/candidate/applications");
    revalidatePath("/candidate/jobs");
    return { success: "Application withdrawn successfully." };
  } catch (error) {
    console.error("Withdraw application error:", error);
    return { error: "Failed to withdraw application." };
  }
}