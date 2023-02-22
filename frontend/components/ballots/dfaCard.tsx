import React from "react";

interface DfaProps {submitFunc: any, closeFunc: any, changeFunc: any, invalid: boolean}

const DfaCard = ({submitFunc, closeFunc, changeFunc, invalid}: DfaProps) => {

  return (
    <div className="dfa-card">
      <div className="dfa-title-container">
        <strong className="dfa-title">Notice!</strong>
        <div onClick={closeFunc} className="dfa-close">X</div>
      </div>
      <p className="dfa-info">This ballot has double factor authentication</p>
      <div className="passcode-container">
        <div className="dfa-input-container">
          <label>Enter your personal passcode. <p className="tiny-text">(You should have recived this from the ballot creator)</p></label>
          <input type="text" onChange={changeFunc}/>
        </div>
        {invalid && <h5>Invalid Passcode Given</h5>}
        <input type="button" value="Cast Vote" onClick={submitFunc} />
      </div>
    </div>
  );
};

export default DfaCard;
