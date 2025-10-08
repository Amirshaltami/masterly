"use client";
import { useState } from "react";

export default function SearchPage() {
  const [skill, setSkill] = useState("");
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill, location, radius }),
      });
      if (!res.ok) {
        setError("No instructors found");
      } else {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch {
      setError("Search failed");
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 p-8">
      <h1 className="text-4xl font-extrabold text-purple-700 mb-4">Find an Instructor</h1>
      <p className="text-lg text-gray-700 mb-8 text-center max-w-xl">
        Search for tutors and instructors by skill, location, and radius. Connect and start learning today!
      </p>
      <form className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md flex flex-col gap-4 mb-8" onSubmit={handleSearch}>
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
          {loading ? "Searching..." : "Search Instructors"}
        </button>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </form>
      {results.length > 0 && (
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 text-purple-700">Matching Instructors</h3>
          <ul className="flex flex-col gap-4">
            {results.map((inst, idx) => (
              <li key={inst.id || idx} className="border rounded p-4 flex flex-col">
                <span className="font-semibold text-lg">{inst.name}</span>
                <span className="text-gray-600">Skill: {inst.skill}</span>
                <span className="text-gray-600">Location: {inst.location}</span>
                <span className="text-gray-600">Distance: {inst.distance} km</span>
                <a href={`/profile/${inst.id}`} className="mt-2 text-blue-600 hover:underline">View Profile</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
