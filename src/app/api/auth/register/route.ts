import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { sendVerificationEmail } from "@/lib/mail"
import { increment, isBlocked } from "@/lib/rateLimiter"
import { validatePassword } from "@/lib/passwordPolicy"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  name: z.string().min(1),
  isInstructor: z.boolean().default(false),
  bio: z.string().optional(),
  location: z.string().optional(),
  hourlyRate: z.number().optional(),
  googleMeetLink: z.string().optional()
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    // block IP if too many attempts
    if (isBlocked(ip, 20)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }
    const { email, password, name, isInstructor, bio, location, hourlyRate, googleMeetLink } = registerSchema.parse(body)
    const skill = body.skill;

    const passwordErrors = validatePassword(password, email)
    if (passwordErrors.length > 0) {
      return NextResponse.json(
        { error: passwordErrors[0], errors: passwordErrors },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      // increment attempt counter for IP to slow down repeated attempts
      increment(ip)
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
        zoomLink: googleMeetLink,
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
          role: isInstructor ? "teach" : "learn",
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
    const userWithoutPassword = { ...user }
    delete (userWithoutPassword as { password?: string | null }).password

    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error: unknown) {
    console.error("Registration error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues?.[0]?.message || "Invalid input" },
        { status: 400 }
      )
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      return NextResponse.json(
        { error: "Database is not initialized. Run: npx prisma db push" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}