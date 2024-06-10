"use client";
// eslint-disable-next-line turbo/no-undeclared-env-vars
let url = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000/";
console.log("NEXT_PUBLIC_WEBSITE_URL = " + process.env.NEXT_PUBLIC_WEBSITE_URL);

import { useCallback, useContext, useEffect, useState } from "react";
import { SelectedUserContext } from "./client-wrapper/ClientComponentContext";
import { ChatMessage, User } from "@repo/prisma-db";
import { ChatMsg } from "@repo/backend-api";
import { ClientSession } from "../app/dashboard/page";

export default function ChatScreenContacts({
  wsConn,
  className,
  isSubscribed,
  deviceId,
  userId,
  getUserId,
}: {
  wsConn: WebSocket | null;
  className: string;
  session: ClientSession;
  isSubscribed: boolean;
  deviceId: string;
  userId: string | null;
  getUserId: () => Promise<string>;
}) {
  const [clearChatsText, setClearChatsText] = useState<string>("Clear Chats");
  const [chats, setChats] = useState<ChatMsg[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{
    error: boolean;
    message: string | null;
  }>({ error: false, message: null });
  const context = useContext(SelectedUserContext);
  useEffect(() => {
    if (typeof window !== "undefined") {
      (async () => {
        try {
          if (context.selectedUser) {
            setLoading(true);
            const searchParams = new URLSearchParams({
              recieverEmail: context.selectedUser.email,
            });
            const response = await fetch(
              url + "api/auth/get-chats?" + searchParams.toString(),
              {
                method: "GET",
              }
            );
            const { chats }: { chats: ChatMessage[] } = await response.json();
            setLoading(false);
            setError({ error: false, message: null });
            setChats(chats);
          }
        } catch (e: any) {
          console.log(e);
          const error: { message: string } = e;
          setLoading(false);
          setError({ error: false, message: error.message });
        }
      })();
    }
  }, [context.selectedUser, context.renderContacts]);
  useEffect(() => {
    const eventHandler = (e: any) => {
      if (!wsConn) throw new Error("WebSocket not available");
      const payload: { type: string; payload: { data: ChatMsg } } = JSON.parse(
        e.data
      );
      if (payload.type == "message") {
        console.log("Message received");
        if (userId != null) {
          console.log(payload.payload.data);
          const si = payload.payload.data.senderId;
          const ri = payload.payload.data.receiverId;
          console.log(si == userId);

          if (ri != context.selectedUser?.id) {
            console.log("ri= " + ri);
            console.log("selectedUser= " + context.selectedUser?.id);
          }

          if (
            (si == userId && ri == context.selectedUser?.id) ||
            (si == context.selectedUser?.id && ri == userId)
          ) {
            setChats((chats) => [...chats, payload.payload.data]);
          }
        } else {
          getUserId();
          if (context.setRenderContacts) context.setRenderContacts((x) => !x);
          console.log("userid not available");
        }
      }
      if (payload.type == "removed-contact") {
        if (context.setRenderContacts) context.setRenderContacts((x) => !x);
      }
    };
    wsConn?.addEventListener("message", eventHandler);

    return () => {
      wsConn?.removeEventListener("message", eventHandler);
    };
  }, [setChats, wsConn, context.selectedUser]);
  const clearChats = useCallback(async (recieverEmail: string | undefined) => {
    if (!recieverEmail) {
      setError({ error: true, message: "Contact userId not found" });
      return;
    }
    setClearChatsText(() => "Deleting Chats ...");
    const searchParams = new URLSearchParams({
      recieverEmail,
    });
    const response = await fetch(
      url + "/api/auth/delete-chats?" + searchParams.toString(),
      { method: "GET" }
    );
    const b = await response.json();
    console.log("RES1");
    console.log(b);

    const response2 = await fetch(
      url + "api/auth/get-chats?" + searchParams.toString(),
      {
        method: "GET",
      }
    );
    const { chats }: { chats: ChatMessage[] } = await response2.json();
    console.log("RES2");
    console.log(chats);
    setChats(chats);
    setClearChatsText(() => "Clear Chats");
  }, []);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!wsConn) return;
      const userId = await getUserId();
      // console.log("Sending message");
      wsConn.send(
        JSON.stringify({
          type: "publish-message",
          deviceId,
          userId,
          message,
          receiverId: context?.selectedUser?.id,
          payload: null,
        })
      );
    },
    [wsConn, context]
  );
  if (!context?.selectedUser)
    return <div className={className}>This is ChatScreen</div>;
  else if (loading) return <div>Loading...</div>;
  else if (!isSubscribed) return <div>Connecting to backend server...</div>;
  else if (error.error) return <div>Error : {error.message}</div>;
  else
    return (
      <div>
        Reciever : {context.selectedUser.name}
        <br />
        <br />
        Chats:
        <button
          onClick={() => {
            clearChats(context.selectedUser?.email);
          }}
        >
          {clearChatsText}
        </button>
        <br />
        <div>
          <ul>
            {chats.map((chat, key) => (
              <li key={key}>
                {"Sender : " + chat.senderId + " : " + chat.content}
              </li>
            ))}
          </ul>
        </div>
        <br />
        <br />
        <input
          onKeyDown={(e) => {
            if (message !== "" && e.key === "Enter") {
              sendMessage(message);
              setMessage(() => "");
            }
          }}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
          }}
          type="text"
        />
        <button
          disabled={!isSubscribed}
          onClick={() => {
            if (message !== "") {
              sendMessage(message);
              setMessage(() => "");
            }
          }}
        >
          Send
        </button>
      </div>
    );
}
