import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const db = prisma as any;

export async function GET() {
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const earnings = await db.payment.findMany({
      where: {
        instructorId: user.id,
        kind: "session",
        status: "paid",
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const totalEarned = earnings.reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);

    return NextResponse.json({ earnings, totalEarned });
  } catch (error) {
    console.error("Earnings GET error:", error);
    return NextResponse.json({ error: "Failed to load earnings" }, { status: 500 });
  }
}
