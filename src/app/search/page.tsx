"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [skill, setSkill] = useState("");
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState("");
  const [mode, setMode] = useState<"findInstructors" | "matchStudents">("findInstructors");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [friendMessage, setFriendMessage] = useState("");

  async function runSearch(nextSkill: string, nextMode: "findInstructors" | "matchStudents") {
    setLoading(true);
    setError("");
    setFriendMessage("");
    setResults([]);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill: nextSkill, location, radius, mode: nextMode }),
      });
      if (!res.ok) {
        setError(nextMode === "matchStudents" ? "No students found" : "No instructors found");
      } else {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch {
      setError("Search failed");
    }
    setLoading(false);
  }

  useEffect(() => {
    async function detectDefaultMode() {
      try {
        const modeParam = searchParams.get("mode");
        const skillParam = searchParams.get("skill");
        if (modeParam === "findInstructors" || modeParam === "matchStudents") {
          setMode(modeParam);
        }
        if (skillParam) {
          setSkill(skillParam);
          await runSearch(
            skillParam,
            modeParam === "matchStudents" ? "matchStudents" : "findInstructors"
          );
          return;
        }

        const res = await fetch("/api/profile");
        const data = await res.json();
        if (res.ok && Array.isArray(data.teachSkills) && data.teachSkills.length > 0) {
          setMode("matchStudents");
        }
      } catch {
        // keep default mode
      }
    }
    detectDefaultMode();
  }, [searchParams]);

  async function handleBookMeeting(instructorId: string) {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructorId }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setError(data?.error || "Could not start payment");
      }
    } catch {
      setError("Could not start payment");
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    await runSearch(skill, mode);
  }

  async function handleSendFriendRequest(receiverId: string) {
    setError("");
    setFriendMessage("");
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Could not send friend request");
      } else {
        setFriendMessage(data?.message || "Friend request sent");
      }
    } catch {
      setError("Could not send friend request");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 p-8">
      <h1 className="text-4xl font-extrabold text-purple-700 mb-4">Search Matches</h1>
      <p className="text-lg text-gray-700 mb-8 text-center max-w-xl">
        Switch between finding instructors or matching with students based on your profile.
      </p>
      <form className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md flex flex-col gap-4 mb-8" onSubmit={handleSearch}>
        <select
          className="border rounded px-4 py-2"
          value={mode}
          onChange={(e) => setMode(e.target.value as "findInstructors" | "matchStudents")}
        >
          <option value="findInstructors">Find Instructor</option>
          <option value="matchStudents">Match with Student</option>
        </select>
        <input
          type="text"
          placeholder="Skill (e.g. piano)"
          className="border rounded px-4 py-2"
          value={skill}
          onChange={e => setSkill(e.target.value)}
          required
        />
          <input
            type="text"
            placeholder="Location (city or address, optional)"
            className="border rounded px-4 py-2"
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
          <input
            type="number"
            min={1}
            max={100}
            placeholder="Radius (km, optional)"
            className="border rounded px-4 py-2"
            value={radius}
            onChange={e => setRadius(e.target.value)}
          />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition-colors"
          disabled={loading}
        >
          {loading ? "Searching..." : mode === "matchStudents" ? "Match Students" : "Search Instructors"}
        </button>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        {friendMessage && <p className="text-green-600 text-sm mt-2">{friendMessage}</p>}
      </form>
      {results.length > 0 && (
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 text-purple-700">
            {mode === "matchStudents" ? "Matching Students" : "Matching Instructors"}
          </h3>
          <ul className="flex flex-col gap-4">
            {results.map((inst, idx) => (
              <li key={inst.id || idx} className="border rounded p-4 flex flex-col">
                <span className="font-semibold text-lg">{inst.name}</span>
                <span className="text-gray-600">Skill: {inst.skill}</span>
                <span className="text-gray-600">Location: {inst.location}</span>
                <span className="text-gray-600">Distance: {inst.distance} km</span>
                <a href={`/profile/${inst.id}`} className="mt-2 text-blue-600 hover:underline">View Profile</a>
                {mode === "findInstructors" && (
                  <button
                    type="button"
                    className="mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
                    onClick={() => handleBookMeeting(inst.id)}
                  >
                    Book Meeting ($10)
                  </button>
                )}
                <button
                  type="button"
                  className="mt-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded"
                  onClick={() => handleSendFriendRequest(inst.id)}
                >
                  Send Friend Request
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
