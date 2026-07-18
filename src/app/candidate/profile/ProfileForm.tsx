"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, ProfileInput } from "@/types/profile";
import { updateCandidateProfile, deleteUserAccount } from "@/server/actions/profile";
import { changePassword, updateUsernameAndDetails } from "@/server/actions/settings";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  User,
  Phone,
  Briefcase,
  Link2,
  Save,
  Trash2,
  AlertTriangle,
  KeyRound,
  Monitor,
  Clock,
  UserCheck,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";

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
    username: string;
    phone: string;
    summary: string;
    experience: string;
    education: string;
    skills: string;
    linkedin: string;
    portfolio: string;
  };
  loginHistory: { id: string; timestamp: Date }[];
}

export function ProfileForm({ initialData, loginHistory }: ProfileFormProps) {
  const { update } = useSession();
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();
  const [usernamePending, startUsernameTransition] = useTransition();
  const [passwordPending, startPasswordTransition] = useTransition();

  // Local settings states
  const [usernameVal, setUsernameVal] = useState(initialData.username);
  const [nameVal, setNameVal] = useState(initialData.name);
  const [passwordForm, setPasswordForm] = useState({ oldPass: "", newPass: "", confirmPass: "" });
  const [fontSize, setFontSize] = useState("medium");
  const [density, setDensity] = useState("comfortable");

  // Read display preferences on client mount
  useEffect(() => {
    const fs = localStorage.getItem("hiretrack-font-size") || "medium";
    const dens = localStorage.getItem("hiretrack-density") || "comfortable";
    setFontSize(fs);
    setDensity(dens);
  }, []);

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    localStorage.setItem("hiretrack-font-size", size);
    document.documentElement.setAttribute("data-font-size", size);
    toast.success(`Font size set to ${size}`);
  };

  const handleDensityChange = (dens: string) => {
    setDensity(dens);
    localStorage.setItem("hiretrack-density", dens);
    document.documentElement.setAttribute("data-density", dens);
    toast.success(`Layout density set to ${dens}`);
  };

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialData,
  });

  const onSubmitProfile = (data: ProfileInput) => {
    startTransition(async () => {
      const response = await updateCandidateProfile(data);
      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success(response.success || "Profile updated!");
        // Update client-side session name instantly
        await update({ name: data.name });
      }
    });
  };

  const handleUpdateUsername = () => {
    if (!nameVal.trim()) {
      toast.error("Name field cannot be empty.");
      return;
    }

    startUsernameTransition(async () => {
      const response = await updateUsernameAndDetails({
        username: usernameVal,
        name: nameVal,
      });

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success(response.success || "Account details updated!");
        // Update client-side session name instantly
        await update({ name: nameVal });
      }
    });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.oldPass || !passwordForm.newPass) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (passwordForm.newPass !== passwordForm.confirmPass) {
      toast.error("New passwords do not match.");
      return;
    }
    if (passwordForm.newPass.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }

    startPasswordTransition(async () => {
      const response = await changePassword({
        oldPass: passwordForm.oldPass,
        newPass: passwordForm.newPass,
      });

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success(response.success || "Password changed successfully!");
        setPasswordForm({ oldPass: "", newPass: "", confirmPass: "" });
      }
    });
  };

  const handleDeleteAccount = () => {
    if (
      !confirm(
        "Are you sure you want to permanently delete your account? All applications, resume links, and profile history will be lost forever."
      )
    ) {
      return;
    }
    if (!confirm("WARNING: This is your final confirmation. Click OK to confirm account deletion.")) {
      return;
    }

    startTransition(async () => {
      const response = await deleteUserAccount();

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success("Account successfully deleted.");
        await signOut({ callbackUrl: "/register" });
      }
    });
  };

  return (
    <div className="space-y-8 max-w-3xl">
      
      {/* 1. Account Settings Card (Username & Name) */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="border-b pb-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-[#C97C5D]" />
            Account Management
          </h2>
          <p className="text-xs text-gray-500">Update your custom login username and full display name.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="username-input" className="text-xs font-semibold text-gray-700">Username (Unique handle)</Label>
            <Input
              id="username-input"
              value={usernameVal}
              onChange={(e) => setUsernameVal(e.target.value)}
              placeholder="e.g. johndoe12"
              disabled={usernamePending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name-input" className="text-xs font-semibold text-gray-700">Display Name</Label>
            <Input
              id="name-input"
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              placeholder="Full Name"
              disabled={usernamePending}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleUpdateUsername}
            disabled={usernamePending}
            className="bg-[#2F5D50] hover:bg-[#23473D] text-white text-xs px-4 h-9 font-semibold"
          >
            {usernamePending ? "Updating..." : "Save Details"}
          </Button>
        </div>
      </div>

      {/* 2. Personal Profile Form */}
      <form onSubmit={form.handleSubmit(onSubmitProfile)} className="space-y-8 bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
        <div className="border-b pb-4 mb-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <User className="h-5 w-5 text-[#C97C5D]" />
            Personal & Contact Info
          </h2>
          <p className="text-xs text-gray-500 mt-1">Provide your primary details and contact links.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <div className="space-y-2 col-span-1 md:col-span-2">
            <Label htmlFor="portfolio" className="flex items-center gap-1.5 text-gray-700">
              <Link2 className="h-4 w-4 text-gray-400" />
              Portfolio Website URL
            </Label>
            <Input id="portfolio" disabled={isPending} {...form.register("portfolio")} placeholder="https://yourportfolio.com" />
            {form.formState.errors.portfolio && <p className="text-sm text-red-500">{form.formState.errors.portfolio.message}</p>}
          </div>
        </div>

        <div className="border-b pb-4 my-6 pt-2">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-[#C97C5D]" />
            Professional Profile
          </h2>
          <p className="text-xs text-gray-500 mt-1">Briefly outline your expertise, education, and career experience.</p>
        </div>

        <div className="space-y-6">
          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary" className="text-gray-700 font-semibold text-xs">About Me / Summary</Label>
            <Textarea
              id="summary"
              disabled={isPending}
              className="min-h-[100px] leading-relaxed text-sm"
              placeholder="A brief summary describing your career, expertise, and goals..."
              {...form.register("summary")}
            />
            {form.formState.errors.summary && <p className="text-sm text-red-500">{form.formState.errors.summary.message}</p>}
          </div>

          {/* Experience */}
          <div className="space-y-2">
            <Label htmlFor="experience" className="flex items-center gap-1.5 text-gray-700 font-semibold text-xs">
              Work Experience
            </Label>
            <Textarea
              id="experience"
              disabled={isPending}
              className="min-h-[120px] leading-relaxed text-sm"
              placeholder="Describe your previous work roles, projects, and accomplishments..."
              {...form.register("experience")}
            />
            {form.formState.errors.experience && <p className="text-sm text-red-500">{form.formState.errors.experience.message}</p>}
          </div>

          {/* Education */}
          <div className="space-y-2">
            <Label htmlFor="education" className="flex items-center gap-1.5 text-gray-700 font-semibold text-xs">
              Education
            </Label>
            <Textarea
              id="education"
              disabled={isPending}
              className="min-h-[100px] leading-relaxed text-sm"
              placeholder="Detail your academic background, degrees, certifications, and institutes..."
              {...form.register("education")}
            />
            {form.formState.errors.education && <p className="text-sm text-red-500">{form.formState.errors.education.message}</p>}
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label htmlFor="skills" className="text-gray-700 font-semibold text-xs">Skills (comma separated)</Label>
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

      {/* 3. Change Password Card */}
      <form onSubmit={handlePasswordChange} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="border-b pb-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-[#C97C5D]" />
            Security & Password
          </h2>
          <p className="text-xs text-gray-500">Change your account password securely.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="old-pass" className="text-xs font-semibold text-gray-700">Current Password</Label>
            <Input
              id="old-pass"
              type="password"
              placeholder="••••••••"
              value={passwordForm.oldPass}
              onChange={(e) => setPasswordForm({ ...passwordForm, oldPass: e.target.value })}
              disabled={passwordPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-pass" className="text-xs font-semibold text-gray-700">New Password</Label>
            <Input
              id="new-pass"
              type="password"
              placeholder="••••••••"
              value={passwordForm.newPass}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
              disabled={passwordPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-pass" className="text-xs font-semibold text-gray-700">Confirm Password</Label>
            <Input
              id="confirm-pass"
              type="password"
              placeholder="••••••••"
              value={passwordForm.confirmPass}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPass: e.target.value })}
              disabled={passwordPending}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={passwordPending}
            className="bg-[#2F5D50] hover:bg-[#23473D] text-white text-xs px-4 h-9 font-semibold"
          >
            {passwordPending ? "Updating Password..." : "Update Password"}
          </Button>
        </div>
      </form>

      {/* 4. Display Settings Card */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="border-b pb-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Monitor className="h-5 w-5 text-[#C97C5D]" />
            Page Settings & Display
          </h2>
          <p className="text-xs text-gray-500">Configure page layout settings, font scales, and theme modes.</p>
        </div>

        <div className="space-y-4">
          {/* Font scale options */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
            <div>
              <span className="text-sm font-semibold text-slate-800">Global Font Size</span>
              <p className="text-[11px] text-gray-400">Scale the base typography sizes across the page.</p>
            </div>
            <div className="flex items-center gap-1.5">
              {["small", "medium", "large"].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleFontSizeChange(size)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border uppercase transition-all ${
                    fontSize === size
                      ? "bg-[#C97C5D] text-white border-[#C97C5D]"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Density options */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
            <div>
              <span className="text-sm font-semibold text-slate-800">Spacing Density</span>
              <p className="text-[11px] text-gray-400">Toggle layout padding density spacing levels.</p>
            </div>
            <div className="flex items-center gap-1.5">
              {["compact", "comfortable"].map((dens) => (
                <button
                  key={dens}
                  type="button"
                  onClick={() => handleDensityChange(dens)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border uppercase transition-all ${
                    density === dens
                      ? "bg-[#C97C5D] text-white border-[#C97C5D]"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200"
                  }`}
                >
                  {dens}
                </button>
              ))}
            </div>
          </div>

          {/* Theme mode options */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-sm font-semibold text-slate-800">Visual Theme Mode</span>
              <p className="text-[11px] text-gray-400">Select Light, Dark, or System color themes.</p>
            </div>
            <div className="flex items-center gap-1.5">
              {["light", "dark", "system"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTheme(t);
                    toast.success(`${t.charAt(0).toUpperCase() + t.slice(1)} theme enabled`);
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border uppercase transition-all ${
                    theme === t
                      ? "bg-[#C97C5D] text-white border-[#C97C5D]"
                      : "bg-gray-55 hover:bg-gray-100 text-gray-600 border-gray-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Login History Audit Table */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="border-b pb-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#C97C5D]" />
            Recent Login History
          </h2>
          <p className="text-xs text-gray-500">Review your past logins and activity audits.</p>
        </div>

        {loginHistory.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No login records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-150 text-xs">
              <thead>
                <tr className="text-left font-bold text-gray-450 uppercase">
                  <th className="py-2.5 px-3">Session ID</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-slate-700">
                {loginHistory.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-3 font-mono text-[10px] text-gray-450">{log.id}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                        SUCCESS_LOGIN
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-550">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Danger Zone (Delete Account) */}
      <div className="bg-red-50/50 border border-red-200/80 p-6 rounded-xl space-y-4 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-red-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-650" />
            Danger Zone
          </h2>
          <p className="text-xs text-red-700 mt-1">
            Permanently delete your account and all associated applications. This action is irreversible.
          </p>
        </div>

        <div className="pt-4 border-t border-red-100 flex justify-end">
          <Button
            type="button"
            onClick={handleDeleteAccount}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 px-5 h-10 text-xs font-semibold"
          >
            <Trash2 className="h-4 w-4" />
            {isPending ? "Deleting account..." : "Delete Account"}
          </Button>
        </div>
      </div>
    </div>
  );
}
