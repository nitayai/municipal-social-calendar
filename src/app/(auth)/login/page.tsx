"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Dynamically import to avoid build-time evaluation
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-[#171717] shadow-md dark:shadow-none dark:border dark:border-[#2a2a2a] rounded-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-1">התחברות</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">היכנס לחשבון שלך</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-1"
            >
              דוא״ל
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#3a3a3a] rounded-md bg-background dark:bg-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="your@email.com"
              dir="ltr"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
            >
              סיסמה
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#3a3a3a] rounded-md bg-background dark:bg-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              dir="ltr"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:bg-blue-400 dark:disabled:bg-blue-800 text-white font-medium rounded-md transition-colors"
          >
            {loading ? "מתחבר..." : "התחבר"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          אין לך חשבון?{" "}
          <Link
            href="/register"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            הרשמה
          </Link>
        </p>
      </div>
    </div>
  );
}
