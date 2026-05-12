import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const db = prisma as any;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2022-11-15",
});

export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const checkoutType = body.checkoutType === "subscription" ? "subscription" : "session";
    const instructorId = typeof body.instructorId === "string" ? body.instructorId : "";

    if (checkoutType === "session" && !instructorId) {
      return NextResponse.json({ error: "Instructor is required" }, { status: 400 });
    }

    let instructor: any = null;
    if (checkoutType === "session") {
      instructor = await db.user.findUnique({ where: { id: instructorId }, include: { skills: true } });

      const canTeach =
        !!instructor &&
        Array.isArray(instructor.skills) &&
        instructor.skills.some((s: any) => {
          const role = (s as any).role as string | undefined;
          return role === "teach" || role === "both";
        });

      if (!canTeach) {
        return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
      }
    }

    // Create or reuse a Stripe customer
    let customerId = user.stripeCustomerId || undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

    const commonConfig = {
      customer: customerId,
      payment_method_types: ["card", "us_bank_account"] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
      billing_address_collection: "auto" as const,
      success_url: `${baseUrl}/profile?payment=success&type=${checkoutType}`,
      cancel_url: `${baseUrl}/profile?payment=cancelled&type=${checkoutType}`,
    };

    const checkoutSession =
      checkoutType === "subscription"
        ? await stripe.checkout.sessions.create({
            ...commonConfig,
            mode: "subscription",
            line_items: [{ price: process.env.STRIPE_SUBSCRIPTION_PRICE_ID || "", quantity: 1 }],
            metadata: { userId: user.id, checkoutType },
          })
        : await stripe.checkout.sessions.create({
            ...commonConfig,
            mode: "payment",
            line_items: [
              {
                price_data: {
                  currency: "usd",
                  unit_amount: 1000,
                  product_data: {
                    name: `1:1 Lesson with ${instructor?.name || "Instructor"}`,
                    description: "Single teaching session via Google Meet",
                  },
                },
                quantity: 1,
              },
            ],
            metadata: { attendeeId: user.id, instructorId: instructor?.id || "", checkoutType },
          });

    await db.payment.create({
      data: {
        userId: user.id,
        instructorId: checkoutType === "session" ? instructor?.id : null,
        kind: checkoutType,
        status: "pending",
        amount: checkoutType === "subscription" ? 0 : 1000,
        currency: "usd",
        stripeCheckoutSessionId: checkoutSession.id,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
