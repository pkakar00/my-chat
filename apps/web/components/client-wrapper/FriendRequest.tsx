/* eslint-disable turbo/no-undeclared-env-vars */
"use client";
let url = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000/";
import { useCallback, useContext, useEffect, useState } from "react";
import { ClientSession } from "../../app/dashboard/page";
import { Recommendations } from "../../app/api/auth/get-recommendations/route";
import {
  ReqsAsReceiver,
  ReqsAsSender,
  RequestReturnType,
} from "../../app/api/auth/get-requests/route";
import { SelectedUserContext } from "./ClientComponentContext";
import TopMenu from "../TopMenu";
import { Button, List, ListItem, TextField } from "@mui/material";

export default function FriendRequest({
  wsConn,
  session,
  deviceId,
  getUserId,
  display,
  setDisplay,
}: {
  deviceId: string;
  wsConn: WebSocket | null;
  className: string;
  session: ClientSession;
  getUserId: () => Promise<string>;
  userId: string | null;
  display: { contacts: boolean; friendReq: boolean; profile: boolean };
  setDisplay: React.Dispatch<
    React.SetStateAction<{
      contacts: boolean;
      friendReq: boolean;
      profile: boolean;
    }>
  >;
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
  const [result, setResult] = useState<string>("");
  const [requests, setRequests] = useState<RequestReturnType>({
    senderReq: [],
    receiverReq: [],
  });
  const context = useContext(SelectedUserContext);

  useEffect(() => {
    function eventHandler(e: any) {
      const payload: {
        type: string;
        payload: any;
      } = JSON.parse(e.data);
      console.log(payload.type);
      if (payload.type === "request-operation-successful") {
        setRenderGetRequests((x) => !x);
        context.setRenderContacts!((x) => !x);
      }
      if (payload.type === "removed-contact") setRenderOnSearch((x) => !x);
      if (payload.type === "send-friend-request") {
        console.log("send-friend-request");
        const reqsAsReceiver: ReqsAsReceiver = payload.payload.receiverReq;
        setRequests((x) => ({
          senderReq: [...x.senderReq],
          receiverReq: reqsAsReceiver,
        }));
      }
      if (payload.type === "accept-friend-request") {
        const reqsAsSender: ReqsAsSender = payload.payload.senderReq;
        console.log("accept-friend-request");
        setRequests((x) => ({
          senderReq: reqsAsSender,
          receiverReq: [...x.receiverReq],
        }));
        context.setRenderContacts!((x) => !x);
        console.log("Ctx.set");
        console.log(context.setRenderContacts);
      }
    }
    wsConn?.addEventListener("message", eventHandler);
    return () => {
      wsConn?.removeEventListener("message", eventHandler);
    };
  }, [wsConn, context.setRenderContacts]);
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
  return (
    <section className={"db-item-contacts"}>
      <TopMenu
        display={display}
        setDisplay={setDisplay}
        text={"Send Request"}
      />
      <br />
      <br />
      <TextField
        sx={{ width: "100%", color: "white" }}
        onChange={(e) => {
          setEmail(e.target.value);
          setResult("");
        }}
        value={email}
        placeholder="abc@gmail.com"
        id="outlined-basic"
        label="E-mail"
        variant="outlined"
        color="secondary"
      />
      <br />
      <br />
      {email !== "" ? (
        <div>
          <div className="noto-font white-text">Search Results:</div>
          <List>
            {recom.usersNotAdded.map((value, index) => (
              <ListItem key={index}>
                <div
                  className="light-background regular curved-edges"
                  style={{
                    padding: "4%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "5px",
                  }}
                >
                  <div className="noto-font white-text">{value.name}</div>
                  <div className="noto-font white-text">{value.email}</div>
                  <Button
                    onClick={() => {
                      sendRequest(value.email);
                    }}
                  >
                    Send
                  </Button>
                </div>
              </ListItem>
            ))}

            {recom.usersAlreadyAdded.map((value, index) => (
              <ListItem key={index}>
                <div
                  style={{
                    padding: "4%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "5px",
                  }}
                  className="light-background regular curved-edges"
                >
                  <div className="noto-font white-text">{value.name}</div>
                  <div className="noto-font white-text">{value.email}</div>
                  {value.email !== session?.email ? (
                    <Button
                      onClick={() => {
                        removeContact(value.email);
                      }}
                    >
                      Remove contact
                    </Button>
                  ) : (
                    <></>
                  )}
                </div>
              </ListItem>
            ))}
          </List>
        </div>
      ) : (
        <></>
      )}
      <br />
      <div className="noto-font white-text">{result}</div>
      <br />
      <div className="noto-font white-text">Receieved Requests</div>
      <List>
        {requests.receiverReq.map((value, index) => (
          <ListItem key={index}>
            <div
              style={{
                padding: "4%",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "5px",
              }}
              className="light-background regular curved-edges"
            >
              <div className="noto-font white-text">{value.sender.name}</div>
              <div className="noto-font white-text">{value.sender.email}</div>
              <Button
                onClick={() => {
                  acceptRequest(value.sender.email);
                }}
              >
                Accept
              </Button>
            </div>
          </ListItem>
        ))}
      </List>
      <br />
      <div className="noto-font white-text">Sent Requests</div>
      <List>
        {requests.senderReq.map((value, index) => (
          <ListItem key={index}>
            <div
              style={{
                padding: "4%",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "5px",
              }}
              className="light-background regular curved-edges"
            >
              <div className="noto-font white-text">{value.receiver.name}</div>
              <div className="noto-font white-text">{value.receiver.email}</div>
            </div>
          </ListItem>
        ))}
      </List>
    </section>
  );
}