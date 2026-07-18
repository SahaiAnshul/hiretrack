"use client";

import { useEffect, useState, useTransition } from "react";
import { changePassword, updateUsernameAndDetails } from "@/server/actions/settings";
import { deleteUserAccount } from "@/server/actions/profile";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Trash2,
  AlertTriangle,
  KeyRound,
  Monitor,
  Clock,
  UserCheck,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";

interface RecruiterSettingsFormProps {
  initialData: {
    name: string;
    username: string;
    email: string;
  };
  loginHistory: { id: string; timestamp: Date }[];
}

export function RecruiterSettingsForm({ initialData, loginHistory }: RecruiterSettingsFormProps) {
  const { update } = useSession();
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();
  const [usernamePending, startUsernameTransition] = useTransition();
  const [passwordPending, startPasswordTransition] = useTransition();

  // Local configurations
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
    toast.success(`Font size adjusted to ${size}`);
  };

  const handleDensityChange = (dens: string) => {
    setDensity(dens);
    localStorage.setItem("hiretrack-density", dens);
    document.documentElement.setAttribute("data-density", dens);
    toast.success(`Density adjusted to ${dens}`);
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
        // Update client session instantly
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
        toast.success(response.success || "Password updated successfully!");
        setPasswordForm({ oldPass: "", newPass: "", confirmPass: "" });
      }
    });
  };

  const handleDeleteAccount = () => {
    if (
      !confirm(
        "Are you sure you want to permanently delete your recruiter account? This will close all open job postings, clear application pipelines, and delete all metrics scorecards. This action is irreversible."
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
    <div className="space-y-8">
      
      {/* 1. Account Settings Card (Username & Name) */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="border-b pb-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-[#2F5D50]" />
            Account Management
          </h2>
          <p className="text-xs text-gray-500">Update your recruiter user profile name and handle.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="rec-username" className="text-xs font-semibold text-gray-700">Username (Unique handle)</Label>
            <Input
              id="rec-username"
              value={usernameVal}
              onChange={(e) => setUsernameVal(e.target.value)}
              placeholder="e.g. recruit_john"
              disabled={usernamePending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rec-name" className="text-xs font-semibold text-gray-700">Recruiter Display Name</Label>
            <Input
              id="rec-name"
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

      {/* 2. Change Password Form */}
      <form onSubmit={handlePasswordChange} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="border-b pb-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-[#2F5D50]" />
            Security & Password
          </h2>
          <p className="text-xs text-gray-500">Change your password to keep your account secure.</p>
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

      {/* 3. Display settings Card */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="border-b pb-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Monitor className="h-5 w-5 text-[#2F5D50]" />
            Page Settings & Display
          </h2>
          <p className="text-xs text-gray-500">Configure page text sizes and paddings density spacing levels.</p>
        </div>

        <div className="space-y-4">
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
                      ? "bg-[#2F5D50] text-white border-[#2F5D50]"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
            <div>
              <span className="text-sm font-semibold text-slate-800">Spacing Density</span>
              <p className="text-[11px] text-gray-400">Toggle page margins and padding spacing configurations.</p>
            </div>
            <div className="flex items-center gap-1.5">
              {["compact", "comfortable"].map((dens) => (
                <button
                  key={dens}
                  type="button"
                  onClick={() => handleDensityChange(dens)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border uppercase transition-all ${
                    density === dens
                      ? "bg-[#2F5D50] text-white border-[#2F5D50]"
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
                      ? "bg-[#2F5D50] text-white border-[#2F5D50]"
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

      {/* 4. Login History Audit Table */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="border-b pb-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#2F5D50]" />
            Recent Login History
          </h2>
          <p className="text-xs text-gray-500">Monitor your past system authentication logs.</p>
        </div>

        {loginHistory.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No records found.</p>
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

      {/* 5. Danger Zone Card */}
      <div className="bg-red-50/50 border border-red-200 p-6 rounded-xl space-y-4 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-red-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-650" />
            Danger Zone
          </h2>
          <p className="text-xs text-red-700 mt-1">
            Permanently delete your recruiter account. This will instantly close all open jobs, archive active pipelines, and remove all candidate database records. This action is irreversible.
          </p>
        </div>

        <div className="pt-4 border-t border-red-150 flex justify-end">
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
