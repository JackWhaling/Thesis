import React, { createContext, useEffect, useState } from "react";
import { getRecord } from "../services/axios";
import { auth } from "../services/firebase";

export interface IUser {
  token: string;
  id: string;
  email: string;
  ballots: IBallots[];
  ownedBallots: IBallots[];
  postgresId: bigint | null;
}

export interface IBallots {
  id: string;
  name: string;
  open: boolean;
  live: boolean | null;
  doubleFactor: boolean;
}

export const INITIAL_USER_STATE = {
  ballots: [],
  ownedBallots: [],
  email: "",
  id: "",
  postgresId: null,
  token: "",
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

  useEffect(() => {
    auth.onAuthStateChanged(async user => {

      const loggedUser = user?.uid
      const token = await user?.getIdToken()
      const email = user?.email
      if (loggedUser) {
        setUserValues((prevState: IUser | any) => ({
          ...prevState,
          id: loggedUser,
          token: token,
          email: email,
        }))
        const uriPath = `users/${loggedUser}`;
        const userDetails = await getRecord(uriPath);
        const userData = userDetails.data;
        let ownedBallots: IBallots[] = []
        let userBallots: IBallots[] = []
        userData?.userBallots?.forEach((ballot: any) => {
          var newBallot: IBallots = {id: "", name: "", open: false, live: false, doubleFactor: false}
          newBallot.name = ballot.ballotName
          newBallot.id = ballot.ballotId
          newBallot.open = !ballot.closed
          newBallot.live = ballot.live
          userBallots.push(newBallot)
        })

        userData?.ownedBallots?.forEach((ballot: any) => {
          var newBallot: IBallots = {id: "", name: "", open: false, live: false, doubleFactor: false}
          newBallot.name = ballot.ballotName
          newBallot.id = ballot.ballotId
          newBallot.open = !ballot.closed
          newBallot.live = ballot.live
          newBallot.doubleFactor = ballot.dfa
          ownedBallots.push(newBallot)
        })
        setUserValues((prevState: IUser | any) => ({
          ...prevState,
          id: loggedUser,
          postgresId: userData?.postId,
          ballots: userBallots,
          token: token,
          ownedBallots: ownedBallots,
        }));
      } else {
        setUserValues(INITIAL_USER_STATE)
      }
    })
  }, [])

  return (
    <userContext.Provider value={{ userValues, setUserValues }}>
      {children}
    </userContext.Provider>
  );
};
