import React, { createContext, useState } from "react";

export interface IUser {
  id: string;
  email: string;
  username: string;
  ballots: IBallots[];
  ownedBallots: IBallots[];
  postgresId: bigint | null;
}

export interface IBallots {
  id: string;
  name: string;
  open: boolean;
}

export const INITIAL_USER_STATE = {
  ballots: [],
  ownedBallots: [],
  username: "",
  email: "",
  id: "",
  postgresId: null
};

export type UserContextProviderProps = {
  children: React.ReactNode;
};

export type UserContextType = {
  userValues: IUser;
  setUserValues: React.Dispatch<React.SetStateAction<IUser>>;
};

export const userContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: UserContextProviderProps) => {
  const [userValues, setUserValues] = useState<IUser>(INITIAL_USER_STATE);

  return (
    <userContext.Provider value={{ userValues, setUserValues }}>
      {children}
    </userContext.Provider>
  );
};
