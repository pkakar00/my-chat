import Image from "next/image";
import { ClientSession } from "../app/dashboard/page";
import TopMenu from "./TopMenu";
import { Avatar, Button } from "@mui/material";
import { signOut } from "next-auth/react";

export default function UserProfile({
  display,
  setDisplay,
  session,
}: {
  display: { contacts: boolean; friendReq: boolean; profile: boolean };
  setDisplay: React.Dispatch<
    React.SetStateAction<{
      contacts: boolean;
      friendReq: boolean;
      profile: boolean;
    }>
  >;
  session: ClientSession;
}) {
  return (
    <section className={"db-item-contacts"}>
      <TopMenu display={display} setDisplay={setDisplay} text={"Profile"} />
      <br />
      <br />
      <br />
      <br />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            width: "100%",
          }}
        >
          {session?.image ? (
            <Avatar
              src={session?.image || ""}
              alt=""
              sx={{ height: "50%", width: "50%" }}
            />
          ) : (
            <Avatar>{session?.name!.charAt(0).toUpperCase()}</Avatar>
          )}
        </div>
        <br />
        <br />
        <br />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            width: "95%",
            padding: "6% 4%",
          }}
          className="light-background regular curved-edges"
        >
          <div className="noto-font white-text">Name:</div>
          <div className="noto-font white-text">{session?.name}</div>
        </div>
        <br />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            width: "95%",
            padding: "6% 4%",
          }}
          className="light-background regular curved-edges"
        >
          <div className="noto-font white-text">Email:</div>
          <div className="noto-font white-text">{session?.email}</div>
        </div>
        <br />
        <div style={{display: "flex",
            justifyContent: "space-between",
            width: "95%",
            padding: "6% 4%",}}>
          <Button
            onClick={() => {
              signOut();
            }}
            variant="contained"
            sx={{ width: "100%", padding: "5%" }}
            fullWidth
          >
            Signout
          </Button>
        </div>
      </div>
    </section>
  );
}
