"use client";
import { User } from "@repo/prisma-db";
import { useEffect, useState, useContext } from "react";
import { SelectedUserContext } from "./client-wrapper/ClientComponentContext";

export default function Contacts({
  className,
}: {
  wsConn: WebSocket | null;
  className: string;
}) {
  const context = useContext(SelectedUserContext);
  const [loading, setLoading] = useState<boolean>(true);
  const [contacts, setContacts] = useState<User[]>([]);
  const [error, setError] = useState<{ error: boolean; message: string }>({
    error: false,
    message: "",
  });
  useEffect(() => {
    (async () => {
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      const url = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000";
      try {
        const fetchReq = await fetch(url + "/api/auth/get-contacts", {
          method: "GET",
        });
        const contacts = await fetchReq.json();
        setLoading(false);
        setContacts(contacts);
      } catch (e) {
        const err: { message: string } = e as any;
        setLoading(false);
        setError({ error: true, message: err.message });
      }
    })();
  }, [context.renderContacts]);
  if (loading) return <div>Loading ...</div>;
  if (error.error)
    return <div>There is an error. Message : {error.message}</div>;
  return (
    <section className={className}>
      Contacts
      <ul>
        {contacts.map((x) => (
          <li
            key={x.id}
            className={
              x.id === context?.selectedUser?.id ? "selected" : "regular"
            }
            onClick={() => {
              context.setSelectedUser!(x);
              console.log("X=");
              console.log(x);
            }}
            style={{ border: "solid black", padding: "7px", margin: "3px" }}
          >
            {x.name}
          </li>
        ))}
      </ul>
    </section>
  );
}