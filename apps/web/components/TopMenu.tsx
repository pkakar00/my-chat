import { Typography, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PersonIcon from "@mui/icons-material/Person";

export default function TopMenu({
  text,
  display,
  setDisplay,
}: {
  text: string;
  display: { contacts: boolean; friendReq: boolean; profile: boolean };
  setDisplay: React.Dispatch<
    React.SetStateAction<{
      contacts: boolean;
      friendReq: boolean;
      profile: boolean;
    }>
  >;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <Typography sx={{ color: "white", paddingLeft: "2%" }} variant="h4">
        {text}
      </Typography>
      <div style={{ display: "flex", gap: "10%" }}>
        <Button
          onClick={() => {
            if (!display.friendReq)
              setDisplay({
                contacts: false,
                friendReq: true,
                profile: false,
              });
            else
              setDisplay({
                contacts: true,
                friendReq: false,
                profile: false,
              });
          }}
          sx={{ borderRadius: "200px", backgroundColor: "white" }}
        >
          <AddIcon color="action" />
        </Button>
        <Button
          onClick={() => {
            if (!display.profile)
              setDisplay({
                contacts: false,
                profile: true,
                friendReq: false,
              });
            else
              setDisplay({
                contacts: true,
                profile: false,
                friendReq: false,
              });
          }}
          sx={{ borderRadius: "200px", backgroundColor: "white" }}
        >
          <PersonIcon color="success" />
        </Button>
      </div>
    </div>
  );
}
