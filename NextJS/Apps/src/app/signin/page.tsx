"use client";

import { useEffect, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/";
  const isLogout = searchParams?.get("logout") === "true";

  console.log("SignIn Page rendered with callbackUrl:", callbackUrl, "isLogout:", isLogout);

  useEffect(() => {
    // Don't auto-redirect if user just logged out
    if (isLogout) {
      console.log("User logged out, not auto-redirecting");
      return;
    }

    // Check if user is already signed in and redirect them
    getSession().then((session) => {
      if (session) {
        console.log("User is already signed in, redirecting to callback URL:", callbackUrl);
        window.location.href = callbackUrl;
      } else {
        // Automatically redirect to OAuth flow
        console.log("Automatically initiating OAuth flow");
        signIn("ministryplatform", { callbackUrl });
      }
    });
  }, [callbackUrl, isLogout]);

  if (isLogout) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center max-w-md px-4">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">You have been signed out</h2>
          <button
            onClick={() => signIn("ministryplatform", { callbackUrl })}
            className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Redirecting to sign in...</h2>
        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent mx-auto"></div>
      </div>
    </div>
  );
}

function SignInFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Loading...</h2>
        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent mx-auto"></div>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInContent />
    </Suspense>
  );
}