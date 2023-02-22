import { useRouter } from "next/router";
import React, { createContext, useEffect, useState } from "react";

export type BallotContextProps = {
  children: React.ReactNode;
};

export type IBallot = {
  candidates: string[],
  votingMethod: string,
  name: string,
  committeeSize: number,
  elected: string[],
  liveResults: boolean,
  owned: string,
  closed: boolean,
  ballotId: string,
}

export const INITIAL_BALLOT_STATE = {
  candidates: [],
  votingMethod: "",
  name: "",
  committeeSize: 0,
  elected: [],
  liveResults: false,
  owned: "",
  closed: false,
  ballotId: "",
}

export type BallotContextType = {
  ballotValues: IBallot;
  setBallotValues: React.Dispatch<React.SetStateAction<IBallot>>;
};

export const ballotContext = createContext<BallotContextType | null>(null);

export const BallotProvider = ({ children }: BallotContextProps) => {
  const [ballotValues, setBallotValues] = useState<IBallot>(INITIAL_BALLOT_STATE);
  const router = useRouter()

  useEffect(() => {
    if (router.pathname != '/ballot/[id]') {
      setBallotValues(INITIAL_BALLOT_STATE)
    }
  }, [router.pathname])

  return (
    <ballotContext.Provider value={{ ballotValues, setBallotValues }}>
      {children}
    </ballotContext.Provider>
  );
};

