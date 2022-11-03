import { NextPage } from "next";
import React from "react";

interface IBallotInfo {
  ballotId: string;
  ballotName: string;
  closed: boolean;
}

interface IAccount {
  email: string;
  ballots: IBallotInfo[];
}

const Account: NextPage<IAccount> = ({ email, ballots }: IAccount) => {
  return <></>;
};

export default Account;
