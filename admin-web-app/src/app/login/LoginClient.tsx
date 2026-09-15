"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import GradientBarsBackground from "@/components/ui/gradient-bars-background";
import { EyeIcon, EyeOffIcon } from "@/components/ui/Icons";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialError = useMemo(() => {
    if (searchParams.get("error") === "access_denied") {
      return "Access denied. This portal is for administrators only.";
    }
    return "";
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    const role = data.user?.user_metadata?.role;
    if (role !== "admin") {
      await supabase.auth.signOut();
      setError("Access denied. This portal is for administrators only.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <GradientBarsBackground>
      <div className="w-full max-w-sm py-10">
        <div className="mb-8 text-center">
          <Image
            src="/logo.png"
            alt="Clean Up – Give Back"
            width={56}
            height={56}
            className="mb-4 inline-block h-14 w-14 rounded-md object-cover"
            priority
          />
          <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">
            CleanUpGiveBack
          </h1>
          <p className="mt-1 font-data text-[12px] leading-[18px] tracking-[0.96px] text-text-tertiary uppercase">
            Admin Portal
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-md rounded-md border border-border-outline bg-bg-surface/95 p-lg backdrop-blur-sm"
        >
          {error ? (
            <div
              role="alert"
              className="rounded-sm border border-[#ba1a1a] bg-[#ffd9de] px-md py-sm font-body text-sm text-[#ba1a1a]"
            >
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-sm">
            <label
              htmlFor="email"
              className="font-data text-[12px] leading-[18px] tracking-[0.96px] text-text-tertiary uppercase"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-sm border border-border-outline bg-bg-surface px-md font-body text-base text-text-primary placeholder:text-text-tertiary transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-sm">
            <label
              htmlFor="password"
              className="font-data text-[12px] leading-[18px] tracking-[0.96px] text-text-tertiary uppercase"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-sm border border-border-outline bg-bg-surface px-md pr-11 font-body text-base text-text-primary transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1.5 text-text-tertiary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeIcon className="h-5 w-5" aria-hidden />
                ) : (
                  <EyeOffIcon className="h-5 w-5" aria-hidden />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="interactive mt-sm h-11 rounded-sm bg-primary font-data text-base font-semibold tracking-wide text-white transition-transform active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </GradientBarsBackground>
  );
}
