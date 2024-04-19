"use client";
import { useState } from "react";
import { createUserInDb } from "../serverActions";
import { signIn } from "next-auth/react";

export default function Page() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  return (
    <>
      {error == "" ? <></> : <>{error}</>}
      <br />
      <label htmlFor="first-name">First Name</label>
      <input
        onChange={(e) => {
          setFirstName(e.target.value);
        }}
        value={firstName}
        id="first-name"
        type="text"
      />
      <label htmlFor="last-name">Last Name</label>
      <input
        onChange={(e) => {
          setLastName(e.target.value);
        }}
        value={lastName}
        id="last-name"
        type="text"
      />
      <label htmlFor="email">Email</label>
      <input
        onChange={(e) => {
          setEmail(e.target.value);
        }}
        value={email}
        id="email"
        type="text"
      />
      <button
        onClick={async () => {
          console.log("result");
          const result = await createUserInDb(firstName, lastName, email);
          if (!result.error) {
            signIn("email", {
              email,
              callbackUrl: "http://localhost:3000/dashboard",
            });
          } else {
            setError(result.error);
          }
        }}
      >
        Create Account
      </button>
    </>
  );
}
