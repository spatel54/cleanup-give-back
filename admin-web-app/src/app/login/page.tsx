import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-bg-app font-body text-sm text-text-tertiary">
          Loading…
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
