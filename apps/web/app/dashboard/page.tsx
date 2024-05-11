"use client";
// eslint-disable-next-line turbo/no-undeclared-env-vars
let url = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000/";
import Contacts from "../../components/Contacts";
import ChatScreen from "../../components/ChatScreen";
import ClientComponentContext from "../../components/client-wrapper/ClientComponentContext";
import { signOut, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { User } from "@repo/prisma-db";
import FriendRequest from "../../components/client-wrapper/FriendRequest";

export default function Page() {
  const [error, setError] = useState<{
    error: boolean;
    message: string | null;
  }>({ error: false, message: null });
  const [userId, setUserId] = useState<string | null>(null);
  const [deviceId] = useState<string>("1");
  const webSocket = useRef<WebSocket | null>(null);
  const [webSocketProp, setWebSocketProp] = useState<WebSocket | null>(null);
  const getDeviceId = useCallback(() => {
    return deviceId;
  }, [deviceId]);
  useEffect(() => {
    let wsConn: WebSocket;
    if (typeof window !== "undefined") {
      (async () => {
        fetch(process.env.NEXT_PUBLIC_API_URL+'/register-device',{method:"GET"});
        try {
          // eslint-disable-next-line turbo/no-undeclared-env-vars
          wsConn = new WebSocket(process.env.NEXT_PUBLIC_WS_URL||"");
          webSocket.current = wsConn;
          setWebSocketProp(wsConn);
          const devId = await getDeviceId();
          subscribeDeviceToUser(devId, wsConn);
        } catch (error) {
          console.log("Here in error block" + error);
        }
      })();

      return () => {
        if (wsConn.OPEN == 1) {
          wsConn.close();
        }
      };
    }
  }, []);
  const subscribeDeviceToUser = useCallback(
    async (devId: string, webSocket: WebSocket | null) => {
      if (!webSocket) throw new Error("Websocket not available");
      const userId = await getUserId();
      console.log("userId " + userId);
      console.log(webSocket);

      webSocket.send(
        JSON.stringify({
          type: "subscribe-userid",
          deviceId: devId,
          userId,
          message: null,
          receiverId: null,
          payload: null,
        })
      );
    },
    [userId]
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

  const session = useSession();
  if (error.error) return <h1>{error.message}</h1>;
  if (session.status === "loading") return <div>Authenticating...</div>;
  else if (session.status === "unauthenticated") {
    redirect("/");
  } else if (session.status === "authenticated") {
    return (
      <div className="flex">
        Welcome to Dashboard
        <br />
        <button
          onClick={() => {
            signOut();
          }}
        >
          Signout
        </button>
        <ClientComponentContext>
          <Contacts wsConn={webSocketProp} className="" />
          <ChatScreen
            wsConn={webSocket.current}
            session={session.data.user}
            className=""
          />
        </ClientComponentContext>
        <FriendRequest
          wsConn={webSocket.current}
          session={session.data.user}
          className=""
        />
      </div>
    );
  }
}

export type ClientSession =
  | {
      name?: string | null | undefined;
      email?: string | null | undefined;
      image?: string | null | undefined;
    }
  | undefined;
