"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

interface ScheduleInterviewInput {
  applicationId: string;
  scheduledAt: string; // ISO string from datetime-local input
  meetingLink?: string;
  interviewType: string;
  notes?: string;
  jobId: string; // Passed to revalidate page
}

export async function scheduleInterview(data: ScheduleInterviewInput) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "RECRUITER") {
      return { error: "Unauthorized. Recruiter access required." };
    }

    const { applicationId, scheduledAt, meetingLink, interviewType, notes, jobId } = data;

    if (!applicationId || !scheduledAt || !interviewType) {
      return { error: "Please fill in all required fields." };
    }

    await db.interview.create({
      data: {
        applicationId,
        interviewerId: session.user.id,
        scheduledAt: new Date(scheduledAt),
        meetingLink: meetingLink || null,
        interviewType,
        notes: notes || null,
        status: "SCHEDULED",
      },
    });

    revalidatePath(`/dashboard/jobs/${jobId}/pipeline`);
    return { success: "Interview scheduled successfully!" };
  } catch (error) {
    console.error("Schedule Interview Error:", error);
    return { error: "Failed to schedule interview." };
  }
}

interface SubmitScorecardInput {
  interviewId: string;
  technical: number;
  communication: number;
  problemSolving: number;
  behaviour: number;
  cultureFit: number;
  recommendation: string;
  feedback: string;
  jobId: string; // Passed to revalidate page
}

export async function submitScorecard(data: SubmitScorecardInput) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "RECRUITER") {
      return { error: "Unauthorized. Recruiter access required." };
    }

    const {
      interviewId,
      technical,
      communication,
      problemSolving,
      behaviour,
      cultureFit,
      recommendation,
      feedback,
      jobId,
    } = data;

    if (!interviewId || !recommendation || !feedback) {
      return { error: "Please provide a recommendation and written feedback." };
    }

    const overallScore = (technical + communication + problemSolving + behaviour + cultureFit) / 5;

    // 1. Create/Update Scorecard
    await db.scorecard.upsert({
      where: { interviewId },
      update: {
        technical,
        communication,
        problemSolving,
        behaviour,
        cultureFit,
        overallScore,
        recommendation,
        feedback,
      },
      create: {
        interviewId,
        technical,
        communication,
        problemSolving,
        behaviour,
        cultureFit,
        overallScore,
        recommendation,
        feedback,
      },
    });

    // 2. Set Interview Status to COMPLETED
    await db.interview.update({
      where: { id: interviewId },
      data: { status: "COMPLETED" },
    });

    revalidatePath(`/dashboard/jobs/${jobId}/pipeline`);
    return { success: "Scorecard submitted successfully!" };
  } catch (error) {
    console.error("Submit Scorecard Error:", error);
    return { error: "Failed to submit scorecard." };
  }
}
