import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { sendVerificationEmail } from "@/lib/mail"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  isInstructor: z.boolean().default(false),
  bio: z.string().optional(),
  location: z.string().optional(),
  hourlyRate: z.number().optional(),
  zoomLink: z.string().optional()
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
  const { email, password, name, isInstructor, bio, location, hourlyRate, zoomLink } = registerSchema.parse(body)
  const skill = body.skill;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        isInstructor,
        bio,
        location,
        hourlyRate,
        zoomLink,
      }
    })

    // Add skill to UserSkill table if provided
    if (skill && typeof skill === "string" && skill.length > 0) {
      // Find or create the skill
      let skillRecord = await prisma.skill.findUnique({ where: { name: skill } });
      if (!skillRecord) {
        skillRecord = await prisma.skill.create({ data: { name: skill, category: "General" } });
      }
      await prisma.userSkill.create({
        data: {
          userId: user.id,
          skillId: skillRecord.id,
          level: "beginner",
          yearsOfExperience: 0,
        }
      });
    }

    // Send welcome email
    try {
      await sendVerificationEmail(email, "");
    } catch (e) {
      console.error("Failed to send welcome email:", e);
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}