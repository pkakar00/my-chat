"use client";

import { User } from "@repo/prisma-db";
import {
  createContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

interface SelectedUserContextProps {
  selectedUser: User | null;
  setSelectedUser: Dispatch<SetStateAction<User | null>> | null;
  renderContacts: boolean;
  setRenderContacts: Dispatch<SetStateAction<boolean>> | null;
}

export const SelectedUserContext = createContext<SelectedUserContextProps>({
  selectedUser: null,
  setSelectedUser: null,
  renderContacts: false,
  setRenderContacts: null,
});

export default function ClientComponentContext(props: { children: ReactNode }) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [renderContacts, setRenderContacts] = useState<boolean>(false);
  return (
    <SelectedUserContext.Provider
      value={{
        selectedUser,
        setSelectedUser,
        renderContacts,
        setRenderContacts,
      }}
    >
      {props.children}
    </SelectedUserContext.Provider>
  );
}
