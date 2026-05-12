import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { receiverId } = await req.json();
    if (!receiverId || typeof receiverId !== "string") {
      return NextResponse.json({ error: "receiverId is required" }, { status: 400 });
    }

    const sender = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!sender) {
      return NextResponse.json({ error: "Sender not found" }, { status: 404 });
    }
    if (sender.id === receiverId) {
      return NextResponse.json({ error: "Cannot send request to yourself" }, { status: 400 });
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
    }

    const existing = await prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId: sender.id, receiverId } },
    });

    if (existing) {
      if (existing.status === "accepted") {
        return NextResponse.json({ message: "Already connected" });
      }

      await prisma.friendRequest.update({
        where: { id: existing.id },
        data: { status: "pending" },
      });
      return NextResponse.json({ message: "Friend request sent" });
    }

    await prisma.friendRequest.create({
      data: {
        senderId: sender.id,
        receiverId,
        status: "pending",
      },
    });

    return NextResponse.json({ message: "Friend request sent" });
  } catch (error) {
    console.error("Friend request error:", error);
    return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 });
  }
}
