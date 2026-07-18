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
