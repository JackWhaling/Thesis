import React from "react";

interface IBallotCard {
  id: string;
  name: string;
}

const BallotCard = ({ name, id }: IBallotCard) => {


  return (
    <div className="ballot-card">
      <strong className="ballot-name">{name}</strong> Ballot Id: {id}
    </div>
  );
};

export default BallotCard;
