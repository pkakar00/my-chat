/* eslint-disable turbo/no-undeclared-env-vars */
"use client";
let url = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000/";
import { useCallback, useEffect, useState } from "react";
import { ClientSession } from "../../app/dashboard/page";
import { User } from "@repo/prisma-db";
import { Recommendations } from "../../app/api/auth/get-recommendations/route";
import {
  ReqsAsReceiver,
  ReqsAsSender,
  RequestReturnType,
} from "../../app/api/auth/get-requests/route";

export default function FriendRequest({
  wsConn,
  session,
  deviceId
}: {
  deviceId:string
  wsConn: WebSocket | null;
  className: string;
  session: ClientSession;
}) {
  const [renderGetRequests, setRenderGetRequests] = useState<boolean>(false);
  const [renderOnSearch, setRenderOnSearch] = useState<boolean>(false);
  const [error, setError] = useState<{
    error: boolean;
    message: string | null;
  }>({ error: false, message: null });
  const [recom, setRecom] = useState<Recommendations>({
    usersAlreadyAdded: [],
    usersNotAdded: [],
  });
  const [email, setEmail] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [result, setResult] = useState<string>("");
  const [requests, setRequests] = useState<RequestReturnType>({
    senderReq: [],
    receiverReq: [],
  });

  useEffect(() => {
    function eventHandler(e: any) {
      const payload: {
        type: string;
        payload: any;
      } = JSON.parse(e.data);
      if (payload.type === "request-operation-successful")
        setRenderGetRequests((x) => !x);
      if (payload.type === "removed-contact") setRenderOnSearch((x) => !x);
      if (payload.type === "send-friend-request") {
        console.log("send-friend-request");
        const reqsAsReceiver: ReqsAsReceiver = payload.payload;
        setRequests((x) => ({
          senderReq: [...x.senderReq],
          receiverReq: reqsAsReceiver,
        }));
      }
      if (payload.type === "accept-friend-request") {
        const reqsAsSender: ReqsAsSender = payload.payload;
        console.log("accept-friend-request");
        setRequests((x) => ({
          senderReq: reqsAsSender,
          receiverReq: [...x.receiverReq],
        }));
      }
    }
    wsConn?.addEventListener("message", eventHandler);
    return () => {
      wsConn?.removeEventListener("message", eventHandler);
    };
  }, [wsConn]);
  useEffect(() => {
    const delay = 300;
    const debounceTimer = setTimeout(() => {
      onSearch(email);
    }, delay);
    return () => clearTimeout(debounceTimer);
  }, [email, renderOnSearch]);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(url + "/api/auth/get-requests");
        const requests: RequestReturnType = await response.json();
        setRequests(requests);
      } catch (error) {
        setError({ error: true, message: "Requests not loaded" });
      }
    })();
  }, [renderGetRequests]);

  const acceptRequest = useCallback(
    async (email: string) => {
      if (error.error == false) {
        if (wsConn) {
          wsConn.send(
            JSON.stringify({
              type: "accept-request",
              deviceId,
              userId: await getUserId(),
              message: null,
              receiverEmailId: email,
            })
          );
        }
      } else setResult("Error " + error.message);
    },
    [wsConn]
  );
  const onSearch = useCallback(async (email: string) => {
    try {
      if (email === "") return;
      const searchParams = new URLSearchParams({ email });
      const response = await fetch(
        url + "api/auth/get-recommendations?" + searchParams.toString(),
        { method: "GET" }
      );
      const recommendations: Recommendations = await response.json();
      console.log(recommendations);

      setRecom(recommendations);
    } catch (e) {
      setError({ error: true, message: "Error while loading recommendations" });
    }
  }, []);
  const sendRequest = useCallback(
    async (value: string) => {
      const alreadyRequestSent: boolean = await checkRequestSent(value);
      if (error.error == false) {
        if (!alreadyRequestSent) {
          if (wsConn) {
            console.log(value);

            wsConn.send(
              JSON.stringify({
                type: "send-request",
                deviceId,
                userId: await getUserId(),
                message: null,
                receiverEmailId: value,
              })
            );
          }
        } else {
          setResult("Request already sent");
          return;
        }
      } else setResult("Error " + error.message);
    },
    [wsConn]
  );
  const removeContact = useCallback(
    async (value: string) => {
      const contactExists: boolean = await checkContactExists(value);
      if (error.error == false) {
        if (contactExists) {
          if (wsConn) {
            console.log(value);
            wsConn.send(
              JSON.stringify({
                type: "remove-contact",
                deviceId,
                userId: await getUserId(),
                message: null,
                receiverEmailId: value,
              })
            );
          }
        } else {
          setResult("Contact does not exist");
          return;
        }
      } else setResult("Error " + error.message);
    },
    [wsConn]
  );
  const checkContactExists = useCallback(async (value: string) => {
    try {
      const searchParams = new URLSearchParams({ email: value });
      const response = await fetch(
        url + "api/auth/check-contact?" + searchParams.toString()
      );
      const { contactExists }: { contactExists: boolean } =
        await response.json();
      return contactExists;
    } catch (e) {
      const error: { message: string } = e as any;
      setError({ error: true, message: error.message });
      return true;
    }
  }, []);
  const checkRequestSent = useCallback(async (value: string) => {
    try {
      const searchParams = new URLSearchParams({ email: value });
      const response = await fetch(
        url + "api/auth/check-request?" + searchParams.toString()
      );
      const { requestSent }: { requestSent: boolean } = await response.json();
      return requestSent;
    } catch (e) {
      const error: { message: string } = e as any;
      setError({ error: true, message: error.message });
      return true;
    }
  }, []);
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
  return (
    <>
      <br />
      <br />
      <br />

      <h1>Find a friend</h1>
      <input
        value={email}
        placeholder="Enter friend email"
        onChange={(e) => {
          setEmail(e.target.value);
        }}
        type="text"
      />
      <br />
      {email !== "" ? (
        <div>
          <h3>Search Results:</h3>
          <ul>
            {recom.usersNotAdded.map((value, index) => (
              <li key={index}>
                <div
                  style={{
                    border: "3px solid black",
                    display: "flex",
                    flexDirection: "column",
                    margin: "12px",
                    padding: "5px",
                  }}
                >
                  <div style={{ marginBottom: "5px" }} className="name">
                    {value.name}
                  </div>
                  <div style={{ marginBottom: "5px" }} className="email">
                    {value.email}
                  </div>
                  <button
                    onClick={() => {
                      sendRequest(value.email);
                    }}
                  >
                    Send
                  </button>
                </div>
              </li>
            ))}

            {recom.usersAlreadyAdded.map((value, index, array) => (
              <li key={index}>
                <div
                  style={{
                    border: "3px solid black",
                    display: "flex",
                    flexDirection: "column",
                    margin: "12px",
                    padding: "5px",
                  }}
                >
                  <div style={{ marginBottom: "5px" }} className="name">
                    {value.name}
                  </div>
                  <div style={{ marginBottom: "5px" }} className="email">
                    {value.email}
                  </div>
                  {value.email !== session?.email ? (
                    <button
                      onClick={() => {
                        removeContact(value.email);
                      }}
                    >
                      Remove contact
                    </button>
                  ) : (
                    <></>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <></>
      )}
      <br />
      <div>{result}</div>
      <br />
      <h3>Receieved Requests</h3>
      <ul>
        {requests.receiverReq.map((value, index) => (
          <li key={index}>
            Request from {value.sender.name} Email : {value.sender.email}
            <button
              onClick={() => {
                acceptRequest(value.sender.email);
              }}
            >
              Accept
            </button>
          </li>
        ))}
      </ul>
      <br />
      <h3>Sent Requests</h3>
      <ul>
        {requests.senderReq.map((value, index) => {
          return (
            <li key={index}>
              Request sent to {value.receiver.name} Email :{" "}
              {value.receiver.email}
            </li>
          );
        })}
      </ul>
    </>
  );
}
