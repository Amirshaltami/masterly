"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [payments, setPayments] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState("inactive");
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [googleMeetLink, setGoogleMeetLink] = useState("");
  const [teachSkillsText, setTeachSkillsText] = useState("");
  const [learnSkillsText, setLearnSkillsText] = useState("");

  function parseSkills(input: string) {
    return input
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function goToSearch(mode: "findInstructors" | "matchStudents", skillSeed: string) {
    const params = new URLSearchParams();
    params.set("mode", mode);
    params.set("skill", skillSeed);
    router.push(`/search?${params.toString()}`);
  }

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError("");
      try {
        const [profileRes, paymentsRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/payments"),
          fetch("/api/payments/earnings"),
        ]);

        const data = await profileRes.json();
        const paymentsData = await paymentsRes.json().catch(() => null);
        const earningsData = await (await fetch("/api/payments/earnings")).json().catch(() => null);
        if (!profileRes.ok) {
          setError(data?.error || "Failed to load profile");
          setLoading(false);
          return;
        }
        setProfile(data);
        setName(data.name || "");
        setBio(data.bio || "");
        setLocation(data.location || "");
        setGoogleMeetLink(data.googleMeetLink || "");
        setTeachSkillsText((data.teachSkills || []).join(", "));
        setLearnSkillsText((data.learnSkills || []).join(", "));
        if (paymentsRes.ok && paymentsData) {
          setPayments(paymentsData.payments || []);
          setSubscriptionStatus(paymentsData.subscriptionStatus || "inactive");
          setSubscriptionEnd(paymentsData.subscriptionEnd || null);
        }
        if (earningsData) {
          setEarnings(earningsData.earnings || []);
          setTotalEarned(earningsData.totalEarned || 0);
        }
      } catch {
        setError("Failed to load profile");
      }
      setLoading(false);
    }

    loadProfile();
  }, []);

  useEffect(() => {
    const payment = searchParams.get("payment");
    const type = searchParams.get("type");
    if (payment === "success") {
      setSuccess(type === "subscription" ? "Subscription payment started successfully." : "Payment completed successfully.");
    }
    if (payment === "cancelled") {
      setError(type === "subscription" ? "Subscription checkout was cancelled." : "Payment was cancelled.");
    }
  }, [searchParams]);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          bio,
          location,
          googleMeetLink,
          teachSkills: parseSkills(teachSkillsText),
          learnSkills: parseSkills(learnSkillsText),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to save profile");
      } else {
        setSuccess("Profile updated.");
        setProfile((prev: any) => ({
          ...prev,
          name,
          bio,
          location,
          googleMeetLink,
          teachSkills: parseSkills(teachSkillsText),
          learnSkills: parseSkills(learnSkillsText),
        }));
      }
    } catch {
      setError("Failed to save profile");
    }
    setSaving(false);
  }

  async function handleStartSubscription() {
    setSubscriptionLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutType: "subscription" }),
      });
      const data = await res.json();
      if (!res.ok || !data?.url) {
        setError(data?.error || "Could not start subscription checkout");
      } else {
        window.location.href = data.url;
      }
    } catch {
      setError("Could not start subscription checkout");
    }
    setSubscriptionLoading(false);
  }

  function formatAmount(cents?: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format((cents || 0) / 100);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 p-8">
      <h1 className="text-4xl font-extrabold text-purple-700 mb-4">Your Profile</h1>
      {loading ? (
        <p className="text-lg text-gray-700">Loading your profile...</p>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl flex flex-col gap-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}
          <div>
            <span className="font-semibold">Email:</span> {profile?.email}
          </div>
          <div>
            <label className="font-semibold">Name</label>
            <input
              type="text"
              className="border rounded px-3 py-2 mt-1 w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="font-semibold">Location</label>
            <input
              type="text"
              className="border rounded px-3 py-2 mt-1 w-full"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City or area"
            />
          </div>
          <div>
            <label className="font-semibold">Bio</label>
            <textarea
              className="border rounded px-3 py-2 mt-1 w-full"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people about yourself"
            />
          </div>
          <div>
            <label className="font-semibold">Google Meet Link</label>
            <input
              type="text"
              className="border rounded px-3 py-2 mt-1 w-full"
              value={googleMeetLink}
              onChange={(e) => setGoogleMeetLink(e.target.value)}
              placeholder="Enter your Google Meet link"
            />
          </div>
          <div>
            <label className="font-semibold">Skills I Teach</label>
            <input
              type="text"
              className="border rounded px-3 py-2 mt-1 w-full"
              value={teachSkillsText}
              onChange={(e) => setTeachSkillsText(e.target.value)}
              placeholder="Piano, Math, Arabic"
            />
            <p className="text-xs text-gray-500 mt-1">Comma-separated. You can teach these and get booked for them.</p>
          </div>
          <div>
            <label className="font-semibold">Skills I Want to Learn</label>
            <input
              type="text"
              className="border rounded px-3 py-2 mt-1 w-full"
              value={learnSkillsText}
              onChange={(e) => setLearnSkillsText(e.target.value)}
              placeholder="Public speaking, Cooking"
            />
            <p className="text-xs text-gray-500 mt-1">Comma-separated. This makes you a student for these skills.</p>
          </div>
          <div className="pt-2">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded shadow"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <h3 className="text-lg font-bold text-emerald-800">Subscription & Payments</h3>
            <p className="text-sm text-emerald-700 mt-1">
              Status: <span className="font-semibold capitalize">{subscriptionStatus}</span>
              {subscriptionEnd ? ` until ${new Date(subscriptionEnd).toLocaleDateString()}` : ""}
            </p>
            <button
              type="button"
              className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded"
              disabled={subscriptionLoading}
              onClick={handleStartSubscription}
            >
              {subscriptionLoading ? "Starting checkout..." : "Start Subscription"}
            </button>
            <div className="mt-4">
              <h4 className="font-semibold text-emerald-900">Recent Payments</h4>
              {payments.length === 0 ? (
                <p className="text-sm text-emerald-700 mt-1">No payments recorded yet.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {payments.map((payment) => (
                    <div key={payment.id} className="rounded border border-emerald-100 bg-white px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium capitalize">{payment.kind}</span>
                        <span>{formatAmount(payment.amount)}</span>
                      </div>
                      <div className="text-gray-600 capitalize">{payment.status} {payment.paymentMethodType ? `• ${payment.paymentMethodType.replaceAll("_", " ")}` : ""}</div>
                      <div className="text-gray-500">{new Date(payment.createdAt).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h3 className="text-lg font-bold text-blue-800">Instructor Earnings</h3>
            <p className="text-sm text-blue-700 mt-1">Total earned from sessions: <span className="font-semibold">{formatAmount(totalEarned)}</span></p>
            {earnings.length === 0 ? (
              <p className="text-sm text-blue-700 mt-2">No paid teaching sessions yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {earnings.map((payment) => (
                  <div key={payment.id} className="rounded border border-blue-100 bg-white px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">Session payment</span>
                      <span>{formatAmount(payment.amount)}</span>
                    </div>
                    <div className="text-gray-600 capitalize">{payment.status}</div>
                    <div className="text-gray-500">{new Date(payment.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-4">
            <h3 className="text-lg font-bold text-purple-800">Ready to connect?</h3>
            <p className="text-sm text-purple-700 mt-1">
              Jump straight into matching based on your profile skills.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {parseSkills(learnSkillsText).length > 0 && (
                <button
                  type="button"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
                  onClick={() => goToSearch("findInstructors", parseSkills(learnSkillsText)[0])}
                >
                  Find an Instructor
                </button>
              )}
              {parseSkills(teachSkillsText).length > 0 && (
                <button
                  type="button"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded"
                  onClick={() => goToSearch("matchStudents", parseSkills(teachSkillsText)[0])}
                >
                  Match with a Student
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600">You can be both student and instructor at the same time, depending on each skill.</p>
        </div>
      )}
    </div>
  );
}
