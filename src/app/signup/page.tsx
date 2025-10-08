"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  isInstructor: false,
  location: "",
  skill: "",
  zoomLink: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
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
    } catch (err) {
      setError("Network error");
    }
    setLoading(false);
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
          onChange={e => setForm({ ...form, password: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Zoom link (instructors only)"
          className="border rounded px-4 py-2"
          value={form.zoomLink}
          onChange={e => setForm({ ...form, zoomLink: e.target.value })}
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
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
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
