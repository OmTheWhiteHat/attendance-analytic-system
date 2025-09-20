import { useState, useEffect } from "react";
import { useSession } from "next-auth/react"; // NextAuth
import { useAuth } from "@clerk/nextjs"; // Clerk

export default function OnboardingPage() {
  const { session } = useSession(); // NextAuth session
  const { userId: clerkId } = useAuth(); // Clerk auth

  const [rollNo, setRollNo] = useState("");
  const [registrationNo, setRegistrationNo] = useState("");
  const [section, setSection] = useState("");
  const [branch, setBranch] = useState("");
  const [faceDescriptor, setFaceDescriptor] = useState("");
  const [loading, setLoading] = useState(true);

  const userEmailOrId = session?.user?.email || clerkId;

  useEffect(() => {
    if (!userEmailOrId) return;
    setLoading(false);
  }, [userEmailOrId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userEmailOrId) {
      alert("You must be signed in to complete onboarding.");
      return;
    }

    try {
      const res = await fetch("/api/student/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rollNo,
          registrationNo,
          section,
          branch,
          faceDescriptor,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Onboarding failed");
      }

      alert(data.message);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Student Onboarding</h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: "500px" }}>
        <label>
          Roll Number:
          <input
            type="text"
            value={rollNo}
            onChange={(e) => setRollNo(e.target.value)}
            style={{ display: "block", margin: "0.5rem 0" }}
          />
        </label>

        <label>
          Registration Number:
          <input
            type="text"
            value={registrationNo}
            onChange={(e) => setRegistrationNo(e.target.value)}
            style={{ display: "block", margin: "0.5rem 0" }}
          />
        </label>

        <label>
          Section:
          <input
            type="text"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            style={{ display: "block", margin: "0.5rem 0" }}
          />
        </label>

        <label>
          Branch:
          <input
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            style={{ display: "block", margin: "0.5rem 0" }}
          />
        </label>

        <label>
          Face Descriptor (optional):
          <input
            type="text"
            value={faceDescriptor}
            onChange={(e) => setFaceDescriptor(e.target.value)}
            style={{ display: "block", margin: "0.5rem 0" }}
          />
        </label>

        <button type="submit" style={{ marginTop: "1rem" }}>
          Complete Onboarding
        </button>
      </form>
    </div>
  );
}
