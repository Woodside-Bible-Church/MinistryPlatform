"use client";

import { useEffect, useState, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/";
  const [isSigningIn, setIsSigningIn] = useState(false);

  console.log("SignIn Page rendered with callbackUrl:", callbackUrl);

  useEffect(() => {
    // Check if user is already signed in and redirect them
    getSession().then((session) => {
      if (session) {
        console.log("User is already signed in, redirecting to callback URL:", callbackUrl);
        window.location.href = callbackUrl;
      }
    });
  }, [callbackUrl]);

  const handleSignIn = async () => {
    console.log("User clicked sign in, initiating OAuth flow");
    setIsSigningIn(true);
    await signIn("ministryplatform", { callbackUrl });
  };

  if (isSigningIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Redirecting to sign in...</h2>
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h1>
          <p className="text-gray-600 dark:text-gray-400">Sign in to access your account</p>
        </div>
        <button
          onClick={handleSignIn}
          className="w-full bg-[#61BC47] hover:bg-[#52a33c] text-white font-semibold py-3 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#61BC47] focus:ring-opacity-50"
        >
          Sign in with Ministry Platform
        </button>
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#61BC47] dark:hover:text-[#61BC47] transition-colors underline"
          >
            Continue without signing in
          </a>
        </div>
      </div>
    </div>
  );
}

function SignInFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Loading...</h2>
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
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