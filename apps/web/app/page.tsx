"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
export default function Page() {
  const router = useRouter();
  const [input, setInput] = useState<string>("");
  const session = useSession();
  useEffect(() => {
    if (session.status === "authenticated") redirect("/dashboard");
  }, [session.status]);
  return (
    <>
      <button onClick={() => signIn("google")}>Sign in With Google</button>
      <br />
      <label htmlFor="emailInput">Email</label>
      <input
        value={input}
        onChange={(e) => {
          setInput((x) => e.target.value);
        }}
        id="emailInput"
        type="email"
      />
      <button
        onClick={() => {
          signIn("email",{email:input,callbackUrl:"http://localhost:3000/dashboard"});
        }}
      >
        Login With Email
      </button>
      <button
        onClick={() => {
          signOut();
        }}
      >
        Signout
      </button>
      <br />
      <h1>Don't have an account?</h1>
      <button
        onClick={() => {
          router.push("/signup");
        }}
      >
        Signup
      </button>
    </>
  );
}