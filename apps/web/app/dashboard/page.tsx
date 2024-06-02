"use client";
// eslint-disable-next-line turbo/no-undeclared-env-vars
let url = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000/";
import Contacts from "../../components/Contacts";
import ChatScreen from "../../components/ChatScreen";
import ClientComponentContext from "../../components/client-wrapper/ClientComponentContext";
import { signOut, useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { User } from "@repo/prisma-db";
import FriendRequest from "../../components/client-wrapper/FriendRequest";

export default function Page() {
  const deviceIdRef = useRef<string>("");
  const router = useRouter();
  const [deviceId, setDeviceId] = useState<string>("");
  const [error, setError] = useState<{
    error: boolean;
    message: string | null;
  }>({ error: false, message: null });
  const [userId, setUserId] = useState<string | null>(null);
  const webSocket = useRef<WebSocket | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [webSocketProp, setWebSocketProp] = useState<WebSocket | null>(null);
  useEffect(() => {
    let wsConn: WebSocket;
    async function eventHandler() {
      await subscribeDeviceToUser();
    }
    if (typeof window !== "undefined") {
      (async () => {
        const u = await getUserId();

        const deviceIdBody = await fetch(
          process.env.NEXT_PUBLIC_API_URL + "/register-device/" + u,
          {
            method: "POST",
          }
        );
        const devId: string = await deviceIdBody.json();
        console.log("DEVICEID");
        console.log(devId);
        if (!devId) {
          deviceIdRef.current = "1";
          setDeviceId("1");
        } else {
          deviceIdRef.current = devId;
          setDeviceId(devId);
        }
        try {
          // eslint-disable-next-line turbo/no-undeclared-env-vars
          wsConn = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || "");
          webSocket.current = wsConn;

          wsConn.addEventListener("open", eventHandler);
          setWebSocketProp(wsConn);
        } catch (error) {
          console.log("Here in error block" + error);
        }
      })();
    }
    return () => {
      if (wsConn && wsConn.OPEN == 1) {
        wsConn.removeEventListener("open", eventHandler);
        wsConn.close();
      }
    };
  }, []);
  const subscribeDeviceToUser = useCallback(async () => {
    if (!webSocket.current) throw new Error("Websocket not available");
    const userId = await getUserId();
    console.log("Inside subscribe device");
    console.log("userId " + userId);
    console.log(webSocket);

    console.log("deviceid = " + deviceIdRef.current);

    webSocket.current.send(
      JSON.stringify({
        type: "subscribe-userid",
        deviceId: deviceIdRef.current,
        userId,
        message: null,
        receiverId: null,
        payload: null,
      })
    );
    console.log("Inside subscribe device 2");
    setIsSubscribed(true);
  }, [userId]);
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
          <Contacts wsConn={webSocket.current} className="" />
          <ChatScreen
            getUserId={getUserId}
            userId={userId}
            deviceId={deviceIdRef.current}
            wsConn={webSocket.current}
            session={session.data.user}
            isSubscribed={isSubscribed}
            className=""
          />
        </ClientComponentContext>
        <FriendRequest
          userId={userId}
          getUserId={getUserId}
          deviceId={deviceIdRef.current}
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
