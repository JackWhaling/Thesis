import React from "react";

interface UpdateProps {
  submitFunc: any,
  closeFunc: any,
}
const UpdateCard = ({submitFunc, closeFunc}: UpdateProps) => {

  return (
    <div className="update-card">
      <strong className="update-title">Notice!</strong>
      <p className="update-info">You have already voted in this election, do you wish update your previous vote?</p>
      <div className="option-container">
        <button onClick={submitFunc}>Yes</button>
        <button onClick={closeFunc}>No</button>
      </div>
    </div>
  );
};

export default UpdateCard;
