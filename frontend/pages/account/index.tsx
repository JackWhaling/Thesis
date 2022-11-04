import { NextPage } from "next";
import { useRouter } from "next/router";
import React, { useContext, useEffect } from "react";
import Ballot from "../../components/ballot/ballot";
import BallotCard from "../../components/ballots/ballotCard";
import { userContext, UserContextType } from "../../context/userState";

interface IBallotInfo {
  ballotId: string;
  ballotName: string;
  closed: boolean;
}

interface IAccount {
  email: string;
  ballots: IBallotInfo[];
}

const Account: NextPage = () => {
  const { userValues, setUserValues } = useContext(
    userContext
  ) as UserContextType;

  const router = useRouter();

  const openBallots = userValues.ballots.filter(
    (ballot) => ballot.open === true
  );
  const closedBallots = userValues.ballots.filter(
    (ballot) => ballot.open !== true
  );

  useEffect(() => {
    if (userValues.id === "") {
      router.push("/");
    }
  }, []);

  return (
    <div className="page-container">
      <div className="account-header">
        <h2 className="account-header__username">{userValues.username}</h2>
        <h3 className="account-header__email">{userValues.email}</h3>
      </div>
      <div className="ballot-lists__open">
        {openBallots.map((ballot) => (
          <BallotCard name={ballot.name} id={ballot.id} key={ballot.id} />
        ))}
      </div>
      <div className="ballot-lists__closed">
        {closedBallots.map((ballot) => (
          <BallotCard name={ballot.name} id={ballot.id} key={ballot.id} />
        ))}
      </div>
    </div>
  );
};

export default Account;
