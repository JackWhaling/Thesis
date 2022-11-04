import React from "react";

interface IBallotCard {
  id: string;
  name: string;
}

const BallotCard = ({ name, id }: IBallotCard) => {
  return (
    <a className="ballot-card" href={`ballot/${id}`}>
      {name}
    </a>
  );
};

export default BallotCard;
