import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { googleMeetLink } = await req.json();
    await prisma.user.update({
      where: { email: session.user.email },
      // Backward-compatible DB column name storing meeting link.
      data: { zoomLink: googleMeetLink },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update Google Meet link" }, { status: 500 });
  }
}
