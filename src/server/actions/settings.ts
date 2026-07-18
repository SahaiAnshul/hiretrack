"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function changePassword(data: { oldPass: string; newPass: string }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Unauthorized." };
    }

    const userId = session.user.id;

    // Fetch user hash
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return { error: "User password hash not found." };
    }

    // Verify old password
    const match = await bcrypt.compare(data.oldPass, user.passwordHash);
    if (!match) {
      return { error: "Incorrect current password." };
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.newPass, salt);

    await db.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: "Password updated successfully!" };
  } catch (error) {
    console.error("Change Password Action Error:", error);
    return { error: "Failed to update password." };
  }
}

export async function updateUsernameAndDetails(data: { username: string; name: string }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Unauthorized." };
    }

    const userId = session.user.id;
    const cleanUsername = data.username.trim().toLowerCase();

    // If username is provided, check uniqueness
    if (cleanUsername) {
      // Validate format: alphanumeric, dashes, underscores, between 3 and 20 chars
      const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
      if (!usernameRegex.test(cleanUsername)) {
        return { error: "Username must be 3-20 characters long and contain only letters, numbers, hyphens, or underscores." };
      }

      const existing = await db.user.findUnique({
        where: { username: cleanUsername },
        select: { id: true },
      });

      if (existing && existing.id !== userId) {
        return { error: "Username is already taken by another user." };
      }
    }

    // Update
    await db.user.update({
      where: { id: userId },
      data: {
        username: cleanUsername || null,
        name: data.name.trim() || null,
      },
    });

    if (session.user.role === "CANDIDATE") {
      revalidatePath("/candidate/profile");
    } else {
      revalidatePath("/dashboard/settings");
    }

    return { success: "Details saved successfully!" };
  } catch (error) {
    console.error("Update Username Action Error:", error);
    return { error: "Failed to update details." };
  }
}

export async function saveJobMemo(jobId: string, content: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Unauthorized." };
    }

    const userId = session.user.id;
    const cleanContent = content.trim();

    if (!cleanContent) {
      // If content is empty, delete note
      try {
        await db.jobNote.delete({
          where: {
            jobId_userId: { jobId, userId },
          },
        });
      } catch {}
    } else {
      // Upsert note
      await db.jobNote.upsert({
        where: {
          jobId_userId: { jobId, userId },
        },
        update: { content: cleanContent },
        create: { jobId, userId, content: cleanContent },
      });
    }

    if (session.user.role === "CANDIDATE") {
      revalidatePath("/candidate/jobs");
    } else {
      revalidatePath("/dashboard/jobs");
    }

    return { success: "Memo saved!" };
  } catch (error) {
    console.error("Save Job Memo Error:", error);
    return { error: "Failed to save memo notes." };
  }
}

export async function getLoginHistory() {
  try {
    const session = await auth();
    if (!session?.user) {
      return [];
    }

    const logs = await db.auditLog.findMany({
      where: {
        userId: session.user.id,
        action: "LOGIN",
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 10,
      select: {
        id: true,
        timestamp: true,
      },
    });

    return logs;
  } catch (error) {
    console.error("Fetch Login History Error:", error);
    return [];
  }
}
