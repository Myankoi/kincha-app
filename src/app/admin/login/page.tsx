"use client";

import { BrutalButton } from "@/components/ui/BrutalButton";
import { signInWithEmail } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Loader2, Lock, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ClickSpark from "@/components/ui/ClickSpark";
import SunflowerSVG from "@/components/ui/SunflowerSVG";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    const { error: authError } = await signInWithEmail(email, password);

    if (authError) {
      setError("Email atau kata sandi salah. Coba lagi.");
      setLoading(false);
      return;
    }

    router.push("/admin/dashboard");
  };

  return (
    <ClickSpark sparkColor="#FFDB33" sparkSize={10} sparkRadius={22} sparkCount={8}>
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 min-h-screen bg-black relative overflow-hidden">
        
        {/* Background decorative elements */}
        <div className="absolute top-10 left-10 opacity-20 pointer-events-none z-0">
          <SunflowerSVG size={120} className="rotate-[45deg]" />
        </div>
        <div className="absolute bottom-10 right-10 opacity-20 pointer-events-none z-0">
          <SunflowerSVG size={140} className="rotate-[15deg]" />
        </div>

        {/* Back to Home Button */}
        <div className="absolute top-5 left-5 z-20">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-black font-semibold text-xs text-black shadow-[2px_2px_0px_0px_#000] hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0px_0px_#000] transition-all"
          >
            <ArrowLeft size={14} />
            Kembali ke Beranda
          </Link>
        </div>

        <div className="w-full max-w-sm z-10 relative">
          
          {/* Sunflower peeking out from the header card */}
          <SunflowerSVG size={70} className="absolute -top-10 -right-6 rotate-12 z-20 pointer-events-none" />

          {/* Header card */}
          <div className="border-4 border-black bg-[#facc15] px-6 py-5 shadow-[8px_8px_0_0_#000] mb-0 border-b-0">
            <div className="flex items-center gap-3">
              <div className="border-2 border-black bg-black p-2">
                <Lock size={20} className="text-[#facc15]" strokeWidth={3} />
              </div>
              <div>
                <h1 className="text-lg font-black text-black font-[family-name:var(--font-head)] leading-tight tracking-wide">
                  ADMIN PORTAL
                </h1>
                <p className="text-[9px] font-bold text-black/60 uppercase tracking-widest font-[family-name:var(--font-sans)]">
                  Gerbang Keamanan Kincha
                </p>
              </div>
            </div>
          </div>

          {/* Form card with cream background */}
          <form
            onSubmit={handleLogin}
            className="border-4 border-black bg-[#F5F5F0] px-6 py-6 shadow-[8px_8px_0_0_#000] space-y-5"
          >
            {/* Error banner */}
            {error && (
              <div className="border-2 border-[#E63946] bg-[#FEF2F2] px-4 py-3 shadow-[3px_3px_0_0_#E63946] animate-bounce">
                <p className="text-xs font-bold text-[#E63946] font-[family-name:var(--font-sans)]">{error}</p>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="admin-email"
                className="block text-xs font-black uppercase tracking-widest text-black font-[family-name:var(--font-head)]"
              >
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kincha.id"
                className={cn(
                  "w-full block border-2 border-black bg-white",
                  "px-3 py-2.5 text-sm text-black",
                  "placeholder:text-[#AEAEAE]",
                  "shadow-[3px_3px_0_0_#000]",
                  "transition-all duration-150",
                  "focus:outline-none focus:border-[#FFDB33] focus:shadow-[4px_4px_0_0_#000]",
                  "font-[family-name:var(--font-sans)]"
                )}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="admin-password"
                className="block text-xs font-black uppercase tracking-widest text-black font-[family-name:var(--font-head)]"
              >
                Kata Sandi
              </label>
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={cn(
                  "w-full block border-2 border-black bg-white",
                  "px-3 py-2.5 text-sm text-black",
                  "placeholder:text-[#AEAEAE]",
                  "shadow-[3px_3px_0_0_#000]",
                  "transition-all duration-150",
                  "focus:outline-none focus:border-[#FFDB33] focus:shadow-[4px_4px_0_0_#000]",
                  "font-[family-name:var(--font-sans)]"
                )}
              />
            </div>

            <BrutalButton
              type="submit"
              variant="dark"
              size="lg"
              fullWidth
              disabled={loading || !email || !password}
              className="mt-6 font-black uppercase tracking-wider font-[family-name:var(--font-head)]"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Masuk…
                </>
              ) : (
                "Masuk ke Dashboard"
              )}
            </BrutalButton>
          </form>

          <p className="text-center text-[10px] text-[#AEAEAE] mt-6 tracking-wide font-[family-name:var(--font-sans)]">
            Akses dibatasi. Hanya untuk administrator Kincha.
          </p>
        </div>
      </main>
    </ClickSpark>
  );
}
