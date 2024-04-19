import { getServerSession } from "next-auth";
export default async function Page(){
  const session = await getServerSession();
  console.log(session);
  if (session?.user)
    return (
      <>
        {"Authenticated User "}
        <br />
        {console.log(session.user.email)}
      </>
    );
  else
    return (
      <>
        Not Authenticated <button>Signin</button>
      </>
    );
}