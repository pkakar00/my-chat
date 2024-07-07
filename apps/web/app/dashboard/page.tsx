"use client";
// eslint-disable-next-line turbo/no-undeclared-env-vars
let url = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000/";
import Contacts from "../../components/Contacts";
import ChatScreen from "../../components/ChatScreen";
import ClientComponentContext from "../../components/client-wrapper/ClientComponentContext";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { User } from "@repo/prisma-db";
import FriendRequest from "../../components/client-wrapper/FriendRequest";
import ContactsSkeleton from "../../components/ContactsSkeleton";
import UserProfile from "../../components/UserProfile";

export default function Page() {
  const deviceIdRef = useRef<string>("");
  const [display, setDisplay] = useState<{
    contacts: boolean;
    friendReq: boolean;
    profile: boolean;
  }>({ contacts: true, friendReq: false, profile: false });
  const [deviceId, setDeviceId] = useState<string>("");
  const [error, setError] = useState<{
    error: boolean;
    message: string | null;
  }>({ error: false, message: null });
  const [userId, setUserId] = useState<string | null>(null);
  const webSocket = useRef<WebSocket | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [webSocketProp, setWebSocketProp] = useState<WebSocket | null>(null);
  const setIntervalTimeout = useRef<number>(0);
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
        window.clearInterval(setIntervalTimeout.current);
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
    const timeout = window.setInterval(() => {
      webSocket.current?.send(
        JSON.stringify({
          type: "keep-alive",
          deviceId: deviceIdRef.current,
          userId,
          message: null,
          receiverId: null,
          payload: null,
        })
      );
    }, 4000);
    setIntervalTimeout.current = timeout;
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
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "loading") return <LoadingSkeleton />;
  else if (error.error) {
    return <h1>{error.message}</h1>;
  } else if (session.status === "authenticated") {
    return (
      <div className="flex-dashboard">
        <ClientComponentContext>
          {display.contacts ? (
            <Contacts
              display={display}
              setDisplay={setDisplay}
              wsConn={webSocket.current}
            />
          ) : display.friendReq ? (
            <FriendRequest
              display={display}
              setDisplay={setDisplay}
              userId={userId}
              getUserId={getUserId}
              deviceId={deviceIdRef.current}
              wsConn={webSocket.current}
              session={session.data.user}
              className=""
            />
          ) : display.profile ? (
            <UserProfile
              display={display}
              setDisplay={setDisplay}
              session={session.data.user}
            />
          ) : (
            <Contacts
              display={display}
              setDisplay={setDisplay}
              wsConn={webSocket.current}
            />
          )}
          <ChatScreen
            getUserId={getUserId}
            userId={userId}
            deviceId={deviceIdRef.current}
            wsConn={webSocket.current}
            session={session.data.user}
            isSubscribed={isSubscribed}
            className="db-item-chatscreen"
          />
        </ClientComponentContext>
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

export function LoadingSkeleton() {
  return (
    <section className="flex-dashboard">
      <ContactsSkeleton />
      <div className="db-item-chatscreen"></div>
    </section>
  );
}
