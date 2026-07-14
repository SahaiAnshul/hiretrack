"use server";

import { db } from "@/lib/db";
import { registerSchema, RegisterInput } from "@/types/auth";
import bcrypt from "bcryptjs";

export async function registerUser(data: RegisterInput) {
  try {
    const validatedData = registerSchema.safeParse(data);
    
    if (!validatedData.success) {
      return { error: "Invalid fields provided." };
    }

    const { name, email, password, role } = validatedData.data;

    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return { error: "Email is already in use." };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
      }
    });

    return { success: "Account created successfully! You can now log in." };
  } catch (error) {
    console.error("Registration Error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}