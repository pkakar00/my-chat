"use client";
// eslint-disable-next-line turbo/no-undeclared-env-vars
let url = process.env.WEBSITE_URL || "http://localhost:3000/";
import { useCallback, useContext, useEffect, useState } from "react";
import { SelectedUserContext } from "./client-wrapper/ClientComponentContext";
import { ChatMessage, User } from "@repo/prisma-db";
import { ChatMsg } from "@repo/backend-api";
import { ClientSession } from "../app/dashboard/page";

export default function ChatScreenContacts({
  wsConn,
  className,
}: {
  wsConn: WebSocket | null;
  className: string;
  session: ClientSession;
}) {
  const [clearChatsText, setClearChatsText] = useState<string>("Clear Chats");
  const [deviceId] = useState<string>("1");
  const [userId, setUserId] = useState<string | null>(null);
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
        console.log(payload.payload.data);

        setChats((chats) => [...chats, payload.payload.data]);
      }
      if (payload.type == "removed-contact") {
        if (context.setRenderContacts) context.setRenderContacts((x) => !x);
      }
    };
    wsConn?.addEventListener("message", eventHandler);

    return () => {
      wsConn?.removeEventListener("message", eventHandler);
    };
  }, [setChats, wsConn]);
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

  const getUserId = useCallback(
    async function (): Promise<string> {
      try {
        if (!userId) {
          const response = await fetch(url + "api/auth/get-user", {
            method: "GET",
          });
          const user: User = await response.json();
          setUserId(user.id);
          return user.id;
        } else return userId;
      } catch (e: any) {
        const error: { message: string } = e as any;
        setError({ error: true, message: error.message });
        return "";
      }
    },
    [userId, error]
  );

  if (!context?.selectedUser)
    return <div className={className}>This is ChatScreen</div>;
  else if (loading) return <div>Loading...</div>;
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
