import { z } from "zod";
import { ApplicationStage } from "@prisma/client";

export const updateStageSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
  newStage: z.nativeEnum(ApplicationStage),
});

export type UpdateStageInput = z.infer<typeof updateStageSchema>;