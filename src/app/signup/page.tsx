"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { PASSWORD_POLICY, validatePassword } from "@/lib/passwordPolicy";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const isGoogleConfigured =
  Boolean(process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED) ||
  (Boolean(googleClientId) && !googleClientId?.startsWith("your_"));

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  isInstructor: false,
  location: "",
  skill: "",
  googleMeetLink: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    const localPasswordErrors = validatePassword(form.password, form.email);
    setPasswordErrors(localPasswordErrors);
    if (localPasswordErrors.length > 0) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        if (Array.isArray(data.errors)) {
          setPasswordErrors(data.errors);
        }
        setError(data.error || "Signup failed");
      } else {
        setSuccess(true);
        setRedirecting(true);
        setTimeout(() => {
          if (form.isInstructor) {
            router.push("/profile");
          } else {
            router.push("/search");
          }
        }, 2000);
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  async function handleGoogleSignup() {
    if (!isGoogleConfigured) {
      setError("Google sign-up is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local.");
      return;
    }
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/onboarding/role" });
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 p-8">
      <h2 className="text-3xl font-bold text-purple-700 mb-6">Sign Up for Masterly</h2>
      <form className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md flex flex-col gap-4" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          className="border rounded px-4 py-2"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="border rounded px-4 py-2"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="border rounded px-4 py-2"
          value={form.password}
          onChange={e => {
            const password = e.target.value;
            setForm({ ...form, password });
            setPasswordErrors(validatePassword(password, form.email));
          }}
          required
        />
        <div className="text-xs text-gray-600 bg-gray-50 border rounded p-3">
          <p className="font-semibold mb-1">Password rules:</p>
          <ul className="list-disc list-inside space-y-1">
            {PASSWORD_POLICY.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
        <input
          type="text"
          placeholder="Google Meet link (instructors only)"
          className="border rounded px-4 py-2"
          value={form.googleMeetLink}
          onChange={e => setForm({ ...form, googleMeetLink: e.target.value })}
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isInstructor}
            onChange={e => setForm({ ...form, isInstructor: e.target.checked })}
          />
          I am an instructor
        </label>
        {form.isInstructor && (
          <>
            <input
              type="text"
              placeholder="Location (city or address)"
              className="border rounded px-4 py-2"
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Skill you teach (e.g. Piano, Arabic)"
              className="border rounded px-4 py-2"
              value={form.skill}
              onChange={e => setForm({ ...form, skill: e.target.value })}
              required
            />
          </>
        )}
        <button
          type="submit"
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition-colors"
          disabled={loading}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>
        <button
          type="button"
          onClick={handleGoogleSignup}
          className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold py-2 px-6 rounded-lg shadow-sm transition-colors disabled:opacity-70"
          disabled={googleLoading}
        >
          {googleLoading ? "Redirecting to Google..." : "Sign up with Google"}
        </button>
        {!isGoogleConfigured && (
          <p className="text-amber-700 text-xs mt-1">
            Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local to enable this.
          </p>
        )}
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        {passwordErrors.length > 0 && (
          <div className="text-red-600 text-sm mt-2">
            {passwordErrors.map((msg) => (
              <p key={msg}>{msg}</p>
            ))}
          </div>
        )}
        {success && form.isInstructor && (
          <p className="text-green-600 text-sm mt-2">Signup successful! Redirecting you to your profile page.</p>
        )}
        {success && !form.isInstructor && (
          <p className="text-green-600 text-sm mt-2">Signup successful! Redirecting you to the search page where you can find a tutor for your skill.</p>
        )}
        {redirecting && (
          <p className="text-blue-600 text-sm mt-2">Redirecting...</p>
        )}
      </form>
    </div>
  );
}
