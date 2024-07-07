"use client";
// eslint-disable-next-line turbo/no-undeclared-env-vars
let url = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000/";
console.log("NEXT_PUBLIC_WEBSITE_URL = " + process.env.NEXT_PUBLIC_WEBSITE_URL);

import { useCallback, useContext, useEffect, useState } from "react";
import { SelectedUserContext } from "./client-wrapper/ClientComponentContext";
import { ChatMessage } from "@repo/prisma-db";
import { ChatMsg } from "@repo/backend-api";
import { ClientSession } from "../app/dashboard/page";
import {
  Avatar,
  CircularProgress,
  circularProgressClasses,
} from "@mui/material";
import CallIcon from "@mui/icons-material/Call";
import VideocamIcon from "@mui/icons-material/Videocam";
import SearchIcon from "@mui/icons-material/Search";
import SendIcon from "@mui/icons-material/Send";
import DeleteIcon from "@mui/icons-material/Delete";
import React from "react";

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
  const [clearChatsLoader, setClearChatsLoader] = useState<boolean>(false);
  const [chats, setChats] = useState<ChatMsg[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{
    error: boolean;
    message: string | null;
  }>({ error: false, message: null });
  const context = useContext(SelectedUserContext);
  const selectedUser = context.selectedUser;
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
    setClearChatsLoader(true);
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
    setClearChatsLoader(false);
  }, []);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!wsConn) return;
      const userId = await getUserId();
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
  else if (loading) return <div className={className}>Loading...</div>;
  else if (!isSubscribed)
    return <div className={className}>Connecting to backend server...</div>;
  else if (error.error)
    return <div className={className}>Error : {error.message}</div>;
  else
    return (
      <div className={className}>
        <div className="appbar">
          <div className="appbar-grp1">
            {selectedUser!.image ? (
              <Avatar className="appbar-avt" src={selectedUser!.image} />
            ) : (
              <Avatar className="appbar-avt" alt="">
                {selectedUser!.name?.charAt(0).toUpperCase()}
              </Avatar>
            )}
            <div className="appbar-name">
              {context.selectedUser.name!.charAt(0).toUpperCase() +
                context.selectedUser.name!.substring(1)}
            </div>
          </div>
          <div className="appbar-grp2">
            <div className="vc black-hover">
              <CallIcon />
            </div>
            <div className="ac black-hover">
              <VideocamIcon />
            </div>
            <div className="search black-hover">
              <SearchIcon />
            </div>
            <div>
              {clearChatsLoader ? (
                <GradientCircularProgress />
              ) : (
                <DeleteIcon
                  className="black-hover"
                  onClick={() => {
                    clearChats(context.selectedUser?.email);
                  }}
                />
              )}
            </div>
          </div>
        </div>
        <ul className="chat-flex-list">
          {chats.map((chat, key) => {
            if (chat.senderId == userId)
              return (
                <li className="chat-msg right noto-font" key={key}>
                  <div className="min-content">{chat.content}</div>
                </li>
              );
            else
              return (
                <li className="chat-msg left noto-font" key={key}>
                  <div className="min-content">{chat.content}</div>
                </li>
              );
          })}
        </ul>
        <div className="chat-input-container">
          <input
            type="text"
            className="chat-input noto-font white-text"
            placeholder="Type a message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (message !== "" && e.key === "Enter") {
                sendMessage(message);
                setMessage("");
              }
            }}
          />
          <button
            className="chat-send-button"
            disabled={!isSubscribed || message === ""}
            onClick={() => {
              if (message !== "") {
                sendMessage(message);
                setMessage("");
              }
            }}
          >
            <SendIcon />
          </button>
        </div>
      </div>
    );
}
function GradientCircularProgress() {
  return (
    <React.Fragment>
      <svg width={0} height={0}>
        <defs>
          <linearGradient id="my_gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e01cd5" />
            <stop offset="100%" stopColor="#1CB5E0" />
          </linearGradient>
        </defs>
      </svg>
      <CircularProgress size={25}
        sx={{ "svg circle": { stroke: "url(#my_gradient)" } }}
      />
    </React.Fragment>
  );
}
