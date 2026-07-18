"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { jobSchema, JobInput } from "@/types/job";
import { createJob } from "@/server/actions/job";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CreateJobPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<JobInput>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      companyName: "",
      department: "",
      location: "",
      employmentType: "Full-time",
      salaryRange: "",
      description: "",
      requiredSkills: "",
      status: "OPEN",
      expiresAt: "",
    },
  });

  const onSubmit = (data: JobInput) => {
    startTransition(async () => {
      const response = await createJob(data);

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success(response.success);
        router.push("/dashboard/jobs");
      }
    });
  };

  const generateDescriptionTemplate = () => {
    const title = form.getValues("title") || "Software Engineer";
    const department = form.getValues("department") || "Engineering";
    const skills = form.getValues("requiredSkills") || "React, TypeScript";

    const template = `### About the Role
We are looking for a skilled **${title}** to join our **${department}** team. In this role, you will be responsible for building high-quality features, collaborating with cross-functional teams, and ensuring the technical feasibility of designs.

### Key Responsibilities
- Design, build, and maintain efficient, reusable, and reliable code.
- Collaborate with product managers, UX designers, and other engineers.
- Identify bottlenecks, bug reports, and implement solutions/fixes.
- Participate in code reviews and advocate for engineering best practices.

### Requirements & Skills
- Proven experience as a ${title} or similar engineering role.
- Strong proficiency in: **${skills}**.
- Excellent problem-solving abilities and communication skills.
- Ability to work effectively in a fast-paced environment.

### What We Offer
- Competitive salary and benefits package.
- Flexible work hours and remote-friendly policies.
- Opportunities for career growth and professional development.
- Inclusive, supportive company culture.`;

    form.setValue("description", template);
    toast.success("Job description template generated!");
  };

  return (
    <div className="mx-auto max-w-3xl p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create New Job</h1>
        <p className="text-sm text-gray-500">Provide the details for the new open position.</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 rounded-xl border bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Job Title</Label>
            <Input id="title" disabled={isPending} placeholder="e.g. Senior Frontend Engineer" {...form.register("title")} />
            {form.formState.errors.title && <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" disabled={isPending} placeholder="e.g. Google" {...form.register("companyName")} />
            {form.formState.errors.companyName && <p className="text-sm text-red-500">{form.formState.errors.companyName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input id="department" disabled={isPending} placeholder="e.g. Engineering" {...form.register("department")} />
            {form.formState.errors.department && <p className="text-sm text-red-500">{form.formState.errors.department.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" disabled={isPending} placeholder="e.g. Remote, San Francisco" {...form.register("location")} />
            {form.formState.errors.location && <p className="text-sm text-red-500">{form.formState.errors.location.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresAt">Visibility Expiry Date</Label>
            <Input id="expiresAt" type="date" disabled={isPending} {...form.register("expiresAt")} />
            {form.formState.errors.expiresAt && <p className="text-sm text-red-500">{form.formState.errors.expiresAt.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Employment Type</Label>
            <Select 
              disabled={isPending} 
              onValueChange={(val) => form.setValue("employmentType", val || "")} 
              defaultValue={form.getValues("employmentType")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Full-time">Full-time</SelectItem>
                <SelectItem value="Part-time">Part-time</SelectItem>
                <SelectItem value="Contract">Contract</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.employmentType && <p className="text-sm text-red-500">{form.formState.errors.employmentType.message}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="requiredSkills">Required Skills (comma separated)</Label>
            <Input id="requiredSkills" disabled={isPending} placeholder="React, TypeScript, Node.js" {...form.register("requiredSkills")} />
            {form.formState.errors.requiredSkills && <p className="text-sm text-red-500">{form.formState.errors.requiredSkills.message}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="description">Job Description</Label>
              <button
                type="button"
                onClick={generateDescriptionTemplate}
                className="text-xs text-[#2F5D50] hover:text-[#23473D] font-semibold hover:underline flex items-center gap-1"
              >
                ✨ Generate Template
              </button>
            </div>
            <Textarea id="description" disabled={isPending} className="min-h-[180px] leading-relaxed" placeholder="Detailed description of the role..." {...form.register("description")} />
            {form.formState.errors.description && <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-4 border-t pt-6">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" className="bg-[#2F5D50] hover:bg-[#23473D] text-white" disabled={isPending}>
            {isPending ? "Creating..." : "Publish Job"}
          </Button>
        </div>
      </form>
    </div>
  );
}