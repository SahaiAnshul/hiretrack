"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { registerSchema, RegisterInput } from "@/types/auth";
import { registerUser } from "@/server/actions/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", role: "CANDIDATE" },
  });

  const onSubmit = (data: RegisterInput) => {
    setError(null);
    startTransition(async () => {
      const response = await registerUser(data);

      if (response?.error) {
        setError(response.error);
        toast.error("Registration failed");
      } else {
        toast.success(response?.success || "Account created");
        router.push("/login");
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F5F2] px-4 py-12">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create an Account</h1>
          <p className="mt-2 text-sm text-gray-600">Join HireTrack to start your journey.</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" placeholder="John Doe" disabled={isPending} {...form.register("name")} />
            {form.formState.errors.name && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="name@company.com" disabled={isPending} {...form.register("email")} />
            {form.formState.errors.email && <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                disabled={isPending}
                className="pr-10"
                {...form.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-650"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            {form.formState.errors.password && <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">I want to join as a</Label>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-gray-200 dark:border-slate-800">
              <button
                type="button"
                disabled={isPending}
                onClick={() => form.setValue("role", "CANDIDATE")}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  form.watch("role") === "CANDIDATE"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-gray-200 dark:border-slate-700"
                    : "text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 bg-transparent border border-transparent"
                }`}
              >
                Candidate
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => form.setValue("role", "RECRUITER")}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  form.watch("role") === "RECRUITER"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-gray-200 dark:border-slate-700"
                    : "text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 bg-transparent border border-transparent"
                }`}
              >
                Recruiter
              </button>
            </div>
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">{error}</div>}

          <Button type="submit" className="w-full bg-[#2F5D50] hover:bg-[#23473D] text-white" disabled={isPending}>
            {isPending ? "Creating account..." : "Register"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#C97C5D] hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}