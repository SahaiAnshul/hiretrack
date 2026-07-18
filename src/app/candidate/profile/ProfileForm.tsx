"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, ProfileInput } from "@/types/profile";
import { updateCandidateProfile } from "@/server/actions/profile";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Phone, Briefcase, GraduationCap, Link2, Save } from "lucide-react";

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

interface ProfileFormProps {
  initialData: {
    name: string;
    phone: string;
    summary: string;
    experience: string;
    education: string;
    skills: string;
    linkedin: string;
    portfolio: string;
  };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialData,
  });

  const onSubmit = (data: ProfileInput) => {
    startTransition(async () => {
      const response = await updateCandidateProfile(data);

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success(response.success || "Profile updated!");
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 bg-white p-8 rounded-xl border border-gray-200 shadow-sm max-w-3xl">
      <div className="border-b pb-4 mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Personal & Contact Info</h2>
        <p className="text-sm text-gray-500 mt-1">Provide your primary details and contact links.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-1.5 text-gray-700">
            <User className="h-4 w-4 text-gray-400" />
            Full Name
          </Label>
          <Input id="name" disabled={isPending} {...form.register("name")} placeholder="Your Name" />
          {form.formState.errors.name && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-1.5 text-gray-700">
            <Phone className="h-4 w-4 text-gray-400" />
            Phone Number
          </Label>
          <Input id="phone" disabled={isPending} {...form.register("phone")} placeholder="e.g. +1 555-0199" />
          {form.formState.errors.phone && <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>}
        </div>

        {/* LinkedIn */}
        <div className="space-y-2">
          <Label htmlFor="linkedin" className="flex items-center gap-1.5 text-gray-700">
            <LinkedinIcon className="h-4 w-4 text-gray-400" />
            LinkedIn Profile URL
          </Label>
          <Input id="linkedin" disabled={isPending} {...form.register("linkedin")} placeholder="https://linkedin.com/in/username" />
          {form.formState.errors.linkedin && <p className="text-sm text-red-500">{form.formState.errors.linkedin.message}</p>}
        </div>

        {/* Portfolio */}
        <div className="space-y-2">
          <Label htmlFor="portfolio" className="flex items-center gap-1.5 text-gray-700">
            <Link2 className="h-4 w-4 text-gray-400" />
            Portfolio Website URL
          </Label>
          <Input id="portfolio" disabled={isPending} {...form.register("portfolio")} placeholder="https://yourportfolio.com" />
          {form.formState.errors.portfolio && <p className="text-sm text-red-500">{form.formState.errors.portfolio.message}</p>}
        </div>
      </div>

      <div className="border-b pb-4 my-6 pt-2">
        <h2 className="text-xl font-semibold text-slate-900">Professional Profile</h2>
        <p className="text-sm text-gray-500 mt-1">Briefly outline your expertise, education, and career experience.</p>
      </div>

      <div className="space-y-6">
        {/* Summary */}
        <div className="space-y-2">
          <Label htmlFor="summary" className="text-gray-700">About Me / Summary</Label>
          <Textarea
            id="summary"
            disabled={isPending}
            className="min-h-[100px] leading-relaxed"
            placeholder="A brief summary describing your career, expertise, and goals..."
            {...form.register("summary")}
          />
          {form.formState.errors.summary && <p className="text-sm text-red-500">{form.formState.errors.summary.message}</p>}
        </div>

        {/* Experience */}
        <div className="space-y-2">
          <Label htmlFor="experience" className="flex items-center gap-1.5 text-gray-700">
            <Briefcase className="h-4 w-4 text-gray-400" />
            Work Experience
          </Label>
          <Textarea
            id="experience"
            disabled={isPending}
            className="min-h-[120px] leading-relaxed"
            placeholder="Describe your previous work roles, projects, and accomplishments..."
            {...form.register("experience")}
          />
          {form.formState.errors.experience && <p className="text-sm text-red-500">{form.formState.errors.experience.message}</p>}
        </div>

        {/* Education */}
        <div className="space-y-2">
          <Label htmlFor="education" className="flex items-center gap-1.5 text-gray-700">
            <GraduationCap className="h-4 w-4 text-gray-400" />
            Education
          </Label>
          <Textarea
            id="education"
            disabled={isPending}
            className="min-h-[100px] leading-relaxed"
            placeholder="Detail your academic background, degrees, certifications, and institutes..."
            {...form.register("education")}
          />
          {form.formState.errors.education && <p className="text-sm text-red-500">{form.formState.errors.education.message}</p>}
        </div>

        {/* Skills */}
        <div className="space-y-2">
          <Label htmlFor="skills" className="text-gray-700">Skills (comma separated)</Label>
          <Input id="skills" disabled={isPending} placeholder="React, TypeScript, Node.js, REST APIs" {...form.register("skills")} />
          {form.formState.errors.skills && <p className="text-sm text-red-500">{form.formState.errors.skills.message}</p>}
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-[#C97C5D] hover:bg-[#b06749] text-white flex items-center gap-2 px-6 h-11"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Saving changes..." : "Save Profile"}
        </Button>
      </div>
    </form>
  );
}
