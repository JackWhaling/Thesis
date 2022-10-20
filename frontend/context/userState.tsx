import React, { createContext, useState } from "react";

export interface IUser {
  id: string;
  email: string;
  username: string;
  ballots: IBallots[];
}

export interface IBallots {
  id: string;
  name: string;
}

export const INITIAL_USER_STATE = {
  ballots: [],
  username: "",
  email: "",
  id: "",
}

type UserContextProviderProps = {
  children: React.ReactNode
}

type UserContextType = {
  userValues: IUser | null,
  setUserValues: React.Dispatch<React.SetStateAction<IUser | null>>
}

export const userContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: UserContextProviderProps) => {
  const [userValues, setUserValues] = useState<IUser | null>(INITIAL_USER_STATE)

  return (
    <userContext.Provider value={{ userValues, setUserValues }}>
      {children}
    </userContext.Provider>
  )
}