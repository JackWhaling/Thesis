import React, {useState} from "react"

interface SingleAddVoter {
  voterChangeFunc: any,
  addSingleClickFunc: any,
  voters: string[],
  currVoter: any,
  closeFunc: any,
  passcode: any,
  voterAdded: boolean,
}

const SingleAddVoter = ({voterAdded, passcode, currVoter, voterChangeFunc, addSingleClickFunc, voters}: SingleAddVoter) => {
  return (
    <div className="voters-list-input__container">
      <div className="input">
        <input
          className="input__field"
          name="candidate"
          type="text"
          placeholder="Add new candidate"
          onChange={(e) => voterChangeFunc(e)}
          value={currVoter}
        />
        <div className="cut cut-large"></div>
        <label className="input__label">Voter Email</label>
        <button 
          className="add-single-button"
          onClick={(e) => {
            addSingleClickFunc(e)
          }}
        >
          Add voter
        </button>
      </div>
      {voterAdded && <div className="passcode-info">Voter Added, passcode for {voters[voters.length - 1]} is <span>{passcode}</span></div>}

      {voters.length > 0 && <div className="list-added-candidates">
        <p>Voters currently added</p>
        {voters.map((voter, idx) => (
          <div className="added-voters" key={idx}>
            <div className="added-voters__name">{voter}</div>
          </div>
        ))}
      </div>}
    </div>
  )
}

export default SingleAddVoter