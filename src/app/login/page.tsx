"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      redirect: false,
      email: form.email,
      password: form.password,
    });
    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/search");
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 p-8">
      <h2 className="text-3xl font-bold text-purple-700 mb-6">Login to Masterly</h2>
      <form className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md flex flex-col gap-4" onSubmit={handleSubmit}>
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
        <button
          type="submit"
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition-colors"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </form>
      <p className="mt-4 text-gray-700">New to Masterly? <a href="/signup" className="text-blue-600 hover:underline">Sign up here</a></p>
    </div>
  );
}
