import nodemailer from "nodemailer";

function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });
}

export async function sendVerificationEmail(email: string, _token: string) {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"Masterly" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Welcome to Masterly!",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Welcome to Masterly!</h2>
        <p>Your account has been created successfully. You can now sign in and start exploring instructors.</p>
        <a href="${process.env.NEXTAUTH_URL}/login"
           style="display:inline-block;padding:10px 20px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none">
          Go to Masterly
        </a>
        <p style="margin-top:16px;color:#6b7280;font-size:12px">
          If you didn't create this account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendWelcomeEmailGoogle(email: string, name?: string | null) {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"Masterly" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Welcome to Masterly!",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Welcome${name ? `, ${name}` : ""}!</h2>
        <p>You've successfully signed up for Masterly using your Google account.</p>
        <a href="${process.env.NEXTAUTH_URL}/search"
           style="display:inline-block;padding:10px 20px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none">
          Start Exploring
        </a>
        <p style="margin-top:16px;color:#6b7280;font-size:12px">
          If you didn't create this account, please contact support.
        </p>
      </div>
    `,
  });
}
