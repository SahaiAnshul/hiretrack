import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

// Initialize NextAuth strictly with the Edge-compatible config
const { auth } = NextAuth(authConfig);

const recruiterRoutes = ["/dashboard", "/pipeline", "/jobs", "/interviews"];
const candidateRoutes = ["/candidate", "/applications"];
const publicRoutes = ["/", "/login", "/register"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

  const isRecruiterRoute = recruiterRoutes.some((route) => nextUrl.pathname.startsWith(route));
  const isCandidateRoute = candidateRoutes.some((route) => nextUrl.pathname.startsWith(route));

  // Allow Auth API routes to pass through
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // Redirect authenticated users away from public auth pages
  if (isPublicRoute && isLoggedIn) {
    if (userRole === "RECRUITER") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.redirect(new URL("/candidate/applications", nextUrl));
  }

  // Require authentication for non-public routes
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Enforce Role-Based Access Control
  if (isLoggedIn) {
    if (isRecruiterRoute && userRole !== "RECRUITER") {
      return NextResponse.redirect(new URL("/candidate/applications", nextUrl)); 
    }

    if (isCandidateRoute && userRole !== "CANDIDATE") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl)); 
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};