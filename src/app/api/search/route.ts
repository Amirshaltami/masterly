import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const searchSchema = z.object({
  skill: z.string(),
  location: z.string(),
  radius: z.number().min(1).max(100)
});

// Dummy geocoding and distance calculation for demo
function getCoordinates(location: string) {
  // In production, use Google Maps API or similar
  // Here, return random coordinates for demo
  return {
    lat: 40 + Math.random(),
    lng: -74 + Math.random(),
  };
}
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  // Haversine formula
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const skill = typeof body.skill === "string" ? body.skill : "";
    if (!skill) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }
    // Find instructors with the skill only
    const instructors = await prisma.user.findMany({
      where: {
        isInstructor: true,
        skills: {
          some: {
            skill: {
              name: { contains: skill },
            },
          },
        },
      },
      include: {
        skills: { include: { skill: true } },
      },
    });
    const results = instructors.map((inst) => {
      const skillName = inst.skills.find(s => s.skill.name.toLowerCase().includes(skill.toLowerCase()))?.skill.name || skill;
      return {
        id: inst.id,
        name: inst.name,
        skill: skillName,
        location: inst.location,
      };
    });
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ results: [] }, { status: 200 });
  }
}
