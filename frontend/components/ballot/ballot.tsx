import React from "react";

interface IBallot {
  ballotId: string;
  live: boolean;
  rule: string;
  candidates: string[];
  owner: string;
}

const Ballot: React.FC<IBallot> = ({
  ballotId,
  live,
  rule,
  candidates,
  owner,
}: IBallot) => {
  return <></>;
};

export default Ballot;
