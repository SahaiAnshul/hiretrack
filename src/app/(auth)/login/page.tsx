"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { loginSchema, LoginInput } from "@/types/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginInput) => {
    setError(null);
    startTransition(async () => {
      const response = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (response?.error) {
        setError("Invalid email or password.");
        toast.error("Authentication failed");
      } else {
        toast.success("Welcome back!");
        router.push("/dashboard"); 
        router.refresh();
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F5F2] px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Welcome to HireTrack
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your credentials to access your account.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            {form.formState.errors.password && <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>}
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">{error}</div>}

          <Button type="submit" className="w-full bg-[#2F5D50] hover:bg-[#23473D] text-white" disabled={isPending}>
            {isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-[#C97C5D] hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}