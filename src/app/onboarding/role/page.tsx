"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RoleOnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function chooseRole(role: "instructor" | "student") {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/profile/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not save your role");
        setLoading(false);
        return;
      }

      router.push("/profile");
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200 p-8">
      <div className="w-full max-w-xl rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-3xl font-bold text-purple-700">Choose your role</h1>
        <p className="mb-6 text-gray-700">How do you want to use Masterly?</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => chooseRole("student")}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-6 py-4 text-left shadow-sm transition hover:bg-gray-50 disabled:opacity-70"
          >
            <span className="block text-lg font-semibold text-gray-900">I am a Student</span>
            <span className="mt-1 block text-sm text-gray-600">Find instructors and book lessons</span>
          </button>

          <button
            type="button"
            onClick={() => chooseRole("instructor")}
            disabled={loading}
            className="rounded-lg bg-purple-600 px-6 py-4 text-left text-white shadow-sm transition hover:bg-purple-700 disabled:opacity-70"
          >
            <span className="block text-lg font-semibold">I am an Instructor</span>
            <span className="mt-1 block text-sm text-purple-100">Create your profile and start teaching</span>
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
