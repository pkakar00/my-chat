"use client";
import { signIn, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { checkUserExists } from "./serverActions";
import { Backdrop } from "@mui/material";

export default function Page() {
  const [input, setInput] = useState<string>("");
  const [backDrop, setBackDrop] = useState<boolean>(false);
  const session = useSession();
  useEffect(() => {
    if (session.status === "authenticated") redirect("/dashboard");
  }, [session.status]);
  return <SignIn backDrop={backDrop} input={input} setInput={setInput} setBackDrop={setBackDrop} />;
}
function Copyright(props: any) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      align="center"
      {...props}
    >
      {"Copyright © "}
      <Link color="inherit" href="https://my-chat-web-eight.vercel.app/">
        My-Chat-Web
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}
const defaultTheme = createTheme({
  palette: {
    primary: {
      main: "#3c3c3c",
    },
    secondary: {
      main: "#ffffff",
    },
  },
});
function SignIn({
  input,
  setInput,
  setBackDrop,
  backDrop,
}: {
  input: string;
  backDrop: boolean;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  setBackDrop: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const handleSubmit = async () => {
    const userExists = await checkUserExists(input);
    if (userExists)
      signIn("email", {
        email: input,
        callbackUrl: process.env.NEXT_PUBLIC_WEBSITE_URL + "dashboard",
      });
    else setBackDrop(true);
  };
  return (
    <ThemeProvider theme={defaultTheme}>
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>
          <Box
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            component="form"
            noValidate
            sx={{ mt: 1 }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={input}
              onChange={(e) => {
                setInput(() => e.target.value);
              }}
            />
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              onClick={() => {
                handleSubmit();
              }}
            >
              Login with email
            </Button>
            <Button
              onClick={() => signIn("google")}
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Login with Google
            </Button>
            <Grid container>
              <Grid item>
                <Link
                  href={process.env.NEXT_PUBLIC_WEBSITE_URL + "signup"}
                  variant="body2"
                >
                  {"Don't have an account? Sign Up"}
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
        <Copyright sx={{ mt: 8, mb: 4 }} />
        <Backdrop onClick={()=>{setBackDrop(false)}} open={backDrop}>
          <div className="noto-font white-text">Account does not exist, Please sign up</div>
        </Backdrop>
      </Container>
    </ThemeProvider>
  );
}