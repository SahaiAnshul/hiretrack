"use server";

import { db } from "@/lib/db";
import { jobSchema, JobInput } from "@/types/job";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createJob(data: JobInput) {
  try {
    const session = await auth();
    
    // 1. Authenticate & Authorize
    if (!session?.user || session.user.role !== "RECRUITER") {
      return { error: "Unauthorized. Recruiter access required." };
    }

    // 2. Validate Input
    const validatedData = jobSchema.safeParse(data);
    if (!validatedData.success) {
      return { error: "Invalid data provided. Please check the form." };
    }

    const { title, department, location, employmentType, salaryRange, description, requiredSkills, status } = validatedData.data;

    // 3. Mutate
    const job = await db.job.create({
      data: {
        title,
        department,
        location,
        employmentType,
        salaryRange,
        description,
        requiredSkills: requiredSkills.split(",").map((s) => s.trim()).filter(Boolean),
        status,
        recruiterId: session.user.id,
      },
    });

    // 4. Revalidate & Return
    revalidatePath("/dashboard/jobs");
    return { success: "Job posted successfully.", jobId: job.id };
  } catch (error) {
    console.error("Create Job Error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function archiveJob(jobId: string) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "RECRUITER") {
      return { error: "Unauthorized." };
    }

    // Fetch job to verify ownership
    const job = await db.job.findUnique({
      where: { id: jobId },
      select: { recruiterId: true },
    });

    if (!job || job.recruiterId !== session.user.id) {
      return { error: "Job not found or unauthorized to archive." };
    }

    await db.job.update({
      where: { id: jobId },
      data: { status: "ARCHIVED" },
    });

    revalidatePath("/dashboard/jobs");
    return { success: "Job archived successfully." };
  } catch (error) {
    console.error("Archive Job Error:", error);
    return { error: "Failed to archive job." };
  }
}