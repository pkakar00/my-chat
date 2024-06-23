"use client";
import * as React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import { User } from "@repo/prisma-db";
import { useEffect, useState, useContext } from "react";
import { SelectedUserContext } from "./client-wrapper/ClientComponentContext";
import ContactsSkeleton from "./ContactsSkeleton";
import TopMenu from "./TopMenu";

export default function Contacts({
  display,
  setDisplay,
}: {
  wsConn: WebSocket | null;
  display: { contacts: boolean; friendReq: boolean; profile: boolean };
  setDisplay: React.Dispatch<
    React.SetStateAction<{
      contacts: boolean;
      friendReq: boolean;
      profile: boolean;
    }>
  >;
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
      const url =
        process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000";
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
  return loading ? (
    <ContactsSkeleton />
  ) : error.error ? (
    <div>There is an error. Message : {error.message}</div>
  ) : (
    <section className={"db-item-contacts"}>
      <>
        <TopMenu display={display} setDisplay={setDisplay} text={"Chat"} />
        <br />
        <List>
          {contacts.map((x) => (
            <ListItem
              alignItems="flex-start"
              key={x.id}
              className={
                x.id === context?.selectedUser?.id
                  ? "light-background selected curved-edges"
                  : "light-background regular curved-edges"
              }
              onClick={() => {
                context.setSelectedUser!(x);
                console.log(x);
              }}
            >
              <div className="contact">
                <ListItemAvatar>
                  {x.image ? (
                    <Avatar src={x.image} />
                  ) : (
                    <Avatar alt="">{x.name?.charAt(0).toUpperCase()}</Avatar>
                  )}
                </ListItemAvatar>
                <div>
                  {x.name!.charAt(0).toUpperCase() + x.name!.substring(1)}
                </div>
              </div>
            </ListItem>
          ))}
        </List>
      </>
    </section>
  );
}
