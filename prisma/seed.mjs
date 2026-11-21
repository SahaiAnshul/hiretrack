import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding MongoDB Atlas database...");

  const passwordHash = await bcrypt.hash("Password123!", 12);

  // 1. Recruiter user
  let recruiter = await prisma.user.findUnique({
    where: { email: "recruiter@hiretrack.com" },
  });

  if (!recruiter) {
    recruiter = await prisma.user.create({
      data: {
        name: "Alex Rivers",
        email: "recruiter@hiretrack.com",
        passwordHash,
        role: "RECRUITER",
      },
    });
    console.log("✓ Created recruiter account: recruiter@hiretrack.com");
  }

  // 2. Candidate user
  let candidate = await prisma.user.findUnique({
    where: { email: "candidate@hiretrack.com" },
  });

  if (!candidate) {
    candidate = await prisma.user.create({
      data: {
        name: "Jordan Taylor",
        email: "candidate@hiretrack.com",
        passwordHash,
        role: "CANDIDATE",
      },
    });
    console.log("✓ Created candidate account: candidate@hiretrack.com");
  }

  // 3. Candidate profile
  let candidateProfile = await prisma.candidateProfile.findUnique({
    where: { userId: candidate.id },
  });

  if (!candidateProfile) {
    candidateProfile = await prisma.candidateProfile.create({
      data: {
        userId: candidate.id,
        phone: "+1 (555) 234-5678",
        experience: "5+ years developing full-stack web applications with React, Node.js, and TypeScript.",
        education: "B.S. in Computer Science",
        skills: ["React", "Next.js", "TypeScript", "Node.js", "MongoDB", "TailwindCSS"],
        linkedin: "https://linkedin.com",
        portfolio: "https://github.com",
        summary: "Passionate full-stack developer experienced in building scalable, modern web apps.",
      },
    });
    console.log("✓ Created candidate profile for Jordan Taylor");
  }

  // 4. Sample Jobs
  const existingJobs = await prisma.job.findMany({
    where: { recruiterId: recruiter.id },
  });

  let sampleJobId;

  if (existingJobs.length === 0) {
    const job1 = await prisma.job.create({
      data: {
        title: "Senior Full Stack Engineer",
        companyName: "Acme Corp",
        department: "Engineering",
        location: "Remote",
        employmentType: "Full-time",
        salaryRange: "$140,000 - $170,000",
        workingHours: "40 hrs/week",
        workingDays: "Mon - Fri",
        experienceLevel: "Senior",
        description:
          "We are seeking an experienced Senior Full Stack Engineer to build and scale modern web applications using Next.js, TypeScript, and cloud-native databases.",
        requiredSkills: ["React", "Next.js", "TypeScript", "Node.js", "MongoDB"],
        status: "OPEN",
        recruiterId: recruiter.id,
      },
    });

    await prisma.job.create({
      data: {
        title: "Lead Product Designer",
        companyName: "Acme Corp",
        department: "Design",
        location: "San Francisco, CA (Hybrid)",
        employmentType: "Full-time",
        salaryRange: "$130,000 - $160,000",
        workingHours: "40 hrs/week",
        workingDays: "Mon - Fri",
        experienceLevel: "Lead",
        description:
          "Lead end-to-end product design across our SaaS dashboard, candidate portal, and design system.",
        requiredSkills: ["Figma", "UI/UX", "User Research", "Design Systems"],
        status: "OPEN",
        recruiterId: recruiter.id,
      },
    });

    await prisma.job.create({
      data: {
        title: "DevOps & Cloud Engineer",
        companyName: "Acme Corp",
        department: "Infrastructure",
        location: "Remote",
        employmentType: "Full-time",
        salaryRange: "$135,000 - $165,000",
        workingHours: "40 hrs/week",
        workingDays: "Mon - Fri",
        experienceLevel: "Mid-Senior",
        description:
          "Manage and optimize CI/CD pipelines, container orchestration, and cloud infrastructure.",
        requiredSkills: ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform"],
        status: "OPEN",
        recruiterId: recruiter.id,
      },
    });

    sampleJobId = job1.id;
    console.log("✓ Created 3 sample jobs");
  } else {
    sampleJobId = existingJobs[0].id;
  }

  // 5. Sample Application
  if (sampleJobId && candidateProfile) {
    const existingApp = await prisma.application.findFirst({
      where: { jobId: sampleJobId, candidateId: candidateProfile.id },
    });

    if (!existingApp) {
      await prisma.application.create({
        data: {
          jobId: sampleJobId,
          candidateId: candidateProfile.id,
          currentStage: "INTERVIEW",
          resumeUrl: "https://example.com/resume.pdf",
          coverLetter: "Excited about this opportunity to contribute to Acme Corp!",
        },
      });
      console.log("✓ Created sample application in INTERVIEW stage");
    }
  }

  console.log("✨ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
