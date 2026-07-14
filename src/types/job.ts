import { z } from "zod";
import { JobStatus } from "@prisma/client";

export const jobSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  department: z.string().min(2, "Department is required."),
  location: z.string().min(2, "Location is required."),
  employmentType: z.string().min(2, "Employment type is required."),
  salaryRange: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters."),
  requiredSkills: z.string().min(2, "Please enter at least one skill."),
  status: z.nativeEnum(JobStatus).default("DRAFT"),
});

export type JobInput = z.infer<typeof jobSchema>;