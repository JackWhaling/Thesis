import React from "react"

interface MultiAddProps {
  voterChangeFunc: any,
  keyDownFunc: any,
  addSingleClickFunc: any,
  voters: string[],
  removeVoter: any,
  currVoter: any,
}

const MultiAddBody = ({currVoter, voterChangeFunc, keyDownFunc, addSingleClickFunc, removeVoter, voters}: MultiAddProps) => {
  console.log(voters)
  
  return (
    <div className="voters-list-input__container">
      <div className="input">
        <input
          className="input__field"
          name="candidate"
          type="text"
          placeholder="Add new candidate"
          onKeyDown={(e) => keyDownFunc(e)}
          onChange={(e) => voterChangeFunc(e)}
          value={currVoter}
        />
        <div className="cut cut-large"></div>
        <label className="input__label">Voter Email</label>
        <button 
          className="add-single-button"
          onClick={(e) => addSingleClickFunc(e)}
        >
          Add voter
        </button>
      </div>
      {voters.length > 0 && <div className="list-added-candidates">
        {voters.map((voter) => (
          <div
            className="added-cand__container"
            key={voter}
            onClick={(e) => removeVoter(voter, e)}
          >
            <div className="added-cand__name">{voter}</div>
            <div className="added-cand__remove">-</div>
          </div>
        ))}
      </div>}
    </div>
  )
}

export default MultiAddBody