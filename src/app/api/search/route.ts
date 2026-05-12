import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { bestSkillMatchScore } from "@/lib/skillSimilarity";

export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    const body = await req.json();
    const skill = typeof body.skill === "string" ? body.skill : "";
    const mode = body.mode === "matchStudents" ? "matchStudents" : "findInstructors";

    if (!skill) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    const targetRoles = mode === "matchStudents" ? ["learn", "both"] : ["teach", "both"];
    const users = (await prisma.user.findMany({
      where: {
        email: session?.user?.email ? { not: session.user.email } : undefined,
      },
      include: {
        skills: { include: { skill: true } },
      },
    })) as any[];

    const results = users
      .map((user) => {
        const candidateSkills = user.skills
          .filter((s: any) => {
            const role = (s as any).role as string | undefined;
            return targetRoles.includes(role || "");
          })
          .map((s: any) => s.skill.name);

        const { score, bestSkill } = bestSkillMatchScore(skill, candidateSkills);
        return {
          id: user.id,
          name: user.name,
          skill: bestSkill || skill,
          location: user.location,
          googleMeetLink: user.zoomLink,
          matchScore: score,
        };
      })
      .filter((u) => u.matchScore >= 0.2)
      .sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ results: [] }, { status: 200 });
  }
}
