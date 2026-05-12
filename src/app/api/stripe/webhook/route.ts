import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const db = prisma as any;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2022-11-15",
});

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: any) {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export async function POST(req: Request) {
  const sig = (req.headers.get("stripe-signature") || "").toString();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  try {
    const buf = Buffer.from(await req.arrayBuffer());
    const event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const checkoutType = session.metadata?.checkoutType as string | undefined;
      const attendeeId = session.metadata?.attendeeId as string | undefined;
      const instructorId = session.metadata?.instructorId as string | undefined;
      const userId = (session.metadata?.userId as string | undefined) || attendeeId;

      await db.payment.updateMany({
        where: { stripeCheckoutSessionId: session.id },
        data: {
          status: "paid",
          amount: session.amount_total || 0,
          currency: session.currency || "usd",
          stripePaymentIntentId:
            typeof session.payment_intent === "string" ? session.payment_intent : undefined,
          stripeSubscriptionId:
            typeof session.subscription === "string" ? session.subscription : undefined,
          paymentMethodType: session.payment_method_types?.[0],
        },
      });

      if (checkoutType === "session" && attendeeId && instructorId) {
        const instructor = await db.user.findUnique({ where: { id: instructorId } });

        await db.meeting.create({
          data: {
            title: "Booked lesson",
            description: "Paid lesson via Stripe ($10)",
            startTime: new Date(),
            endTime: new Date(Date.now() + 60 * 60 * 1000),
            organizerId: instructorId,
            attendeeId,
            status: "scheduled",
            // Backward-compatible DB column name, now used for Google Meet links.
            zoomJoinUrl: instructor?.zoomLink || null,
          },
        });

        return NextResponse.json({ received: true });
      }

      if (checkoutType === "subscription" && userId) {
        let subscriptionEnd: Date | undefined;
        if (typeof session.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          subscriptionEnd = subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : undefined;
        }

        await db.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: "active",
            subscriptionEnd,
            stripeCustomerId: session.customer as string | undefined,
          },
        });
      }
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : undefined;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : undefined;

      const user = customerId
        ? await db.user.findFirst({ where: { stripeCustomerId: customerId } })
        : null;

      if (user) {
        await db.payment.create({
          data: {
            userId: user.id,
            kind: "subscription",
            status: "paid",
            amount: invoice.amount_paid || 0,
            currency: invoice.currency || "usd",
            stripeInvoiceId: invoice.id,
            stripeSubscriptionId: subscriptionId,
            stripePaymentIntentId:
              typeof invoice.payment_intent === "string" ? invoice.payment_intent : undefined,
          },
        });
      }
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const customer = invoice.customer as string | Stripe.Customer | undefined;
      if (typeof customer === "string") {
        const user = await db.user.findFirst({ where: { stripeCustomerId: customer } });
        await db.user.updateMany({ where: { stripeCustomerId: customer }, data: { subscriptionStatus: "past_due" } });
        if (user) {
          await db.payment.create({
            data: {
              userId: user.id,
              kind: "subscription",
              status: "failed",
              amount: invoice.amount_due || 0,
              currency: invoice.currency || "usd",
              stripeInvoiceId: invoice.id,
              stripeSubscriptionId:
                typeof invoice.subscription === "string" ? invoice.subscription : undefined,
            },
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err.message || err);
    return new NextResponse(`Webhook Error: ${err.message || err}`, { status: 400 });
  }
}
