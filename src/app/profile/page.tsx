"use client";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [zoomLink, setZoomLink] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // In a real app, fetch the logged-in instructor's profile from the backend
    // Here, just show a placeholder
    setTimeout(() => {
      setProfile({
        name: "Your Name",
        location: "Your Location",
        skill: "Skill you teach",
        zoomLink: "https://zoom.us/my/yourlink"
      });
      setZoomLink("https://zoom.us/my/yourlink");
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 p-8">
      <h1 className="text-4xl font-extrabold text-purple-700 mb-4">Instructor Profile</h1>
      {loading ? (
        <p className="text-lg text-gray-700">Loading your profile...</p>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md flex flex-col gap-4">
          <div>
            <span className="font-semibold">Name:</span> {profile.name}
          </div>
          <div>
            <span className="font-semibold">Location:</span> {profile.location}
          </div>
          <div>
            <span className="font-semibold">Skill you teach:</span> {profile.skill}
          </div>
          <div>
            <span className="font-semibold">Zoom Link:</span>
            <input
              type="text"
              className="border rounded px-2 py-1 ml-2 w-full"
              value={zoomLink}
              onChange={e => setZoomLink(e.target.value)}
              placeholder="Enter your Zoom link"
            />
            <button
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-4 rounded shadow"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                const res = await fetch("/api/profile/zoomlink", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ zoomLink }),
                });
                if (res.ok) {
                  setProfile({ ...profile, zoomLink });
                }
                setSaving(false);
              }}
            >{saving ? "Saving..." : "Save Zoom Link"}</button>
          </div>
          <p className="mt-4 text-gray-700">You can update your profile and add more details here.</p>
        </div>
      )}
    </div>
  );
}
