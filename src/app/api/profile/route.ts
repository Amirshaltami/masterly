import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  googleMeetLink: z.string().optional(),
  teachSkills: z.array(z.string()).optional(),
  learnSkills: z.array(z.string()).optional(),
});

function normalizeSkills(input?: string[]) {
  if (!input) return [];
  return [...new Set(input.map((s) => s.trim()).filter(Boolean))];
}

export async function GET() {
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { skills: { include: { skill: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const teachSkills = user.skills
      .filter((s) => s.role === "teach" || s.role === "both")
      .map((s) => s.skill.name);
    const learnSkills = user.skills
      .filter((s) => s.role === "learn" || s.role === "both")
      .map((s) => s.skill.name);

    return NextResponse.json({
      id: user.id,
      name: user.name || "",
      email: user.email,
      bio: user.bio || "",
      location: user.location || "",
      googleMeetLink: user.zoomLink || "",
      teachSkills,
      learnSkills,
    });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = updateProfileSchema.parse(await req.json());
    const teachSkills = normalizeSkills(body.teachSkills);
    const learnSkills = normalizeSkills(body.learnSkills);

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: body.name,
        bio: body.bio,
        location: body.location,
        zoomLink: body.googleMeetLink,
        isInstructor: teachSkills.length > 0,
      },
    });

    const roleBySkill = new Map<string, "teach" | "learn" | "both">();
    for (const skill of teachSkills) roleBySkill.set(skill.toLowerCase(), "teach");
    for (const skill of learnSkills) {
      const key = skill.toLowerCase();
      const existing = roleBySkill.get(key);
      roleBySkill.set(key, existing === "teach" ? "both" : "learn");
    }

    await prisma.userSkill.deleteMany({ where: { userId: user.id } });

    for (const [skillLower, role] of roleBySkill) {
      const originalName =
        teachSkills.find((s) => s.toLowerCase() === skillLower) ||
        learnSkills.find((s) => s.toLowerCase() === skillLower) ||
        skillLower;

      let skill = (await prisma.skill.findMany()).find(
        (s) => s.name.toLowerCase() === originalName.toLowerCase()
      );
      if (!skill) {
        skill = await prisma.skill.create({ data: { name: originalName, category: "General" } });
      }

      await prisma.userSkill.create({
        data: {
          userId: user.id,
          skillId: skill.id,
          role,
          level: "beginner",
          yearsOfExperience: 0,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile PUT error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues?.[0]?.message || "Invalid profile data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
