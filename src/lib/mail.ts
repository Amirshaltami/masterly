import nodemailer from "nodemailer";

export async function sendVerificationEmail(email: string, token: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify?token=${token}`;

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: email,
    subject: "Verify your Masterly account",
    html: `<p>Welcome to Masterly!</p><p>Please verify your email by clicking <a href='${verificationUrl}'>here</a>.</p>`
  });
}
