import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().optional().or(z.literal("")),
  summary: z.string().optional().or(z.literal("")),
  experience: z.string().optional().or(z.literal("")),
  education: z.string().optional().or(z.literal("")),
  skills: z.string().optional().or(z.literal("")),
  linkedin: z.string().optional().or(z.literal("")),
  portfolio: z.string().optional().or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;
