import { NextPage } from "next";
import React, { createRef, useRef, useState } from "react";
import Select from "react-select";

interface IBallotForm {
  name: string;
  rule: string | null;
  liveResults: boolean;
  voteMethod: string | null;
  doubleAuth: boolean;
}

const DEFAULT_FORM = {
  name: "",
  liveResults: false,
  rule: null,
  voteMethod: null,
  doubleAuth: false,
};

const VOTING_METHODS = [
  { value: "strict", label: "Strict Preferences" },
  { value: "weak", label: "Weak Preferences" },
  { value: "approval", label: "Approval Ballot" },
];

const ABC_RULES = [
  { value: "EAR", label: "Expanding Approvals Rules" },
  { value: "J", label: "j" },
];

const STRICT_RULES = [{ value: "EAR", label: "Expanding Approvals Rule" }];

const WEAK_RULES = [{ value: "EAR", label: "Expanding Approvals Rule" }];

const CreateBallot: NextPage = () => {
  const [formState, setFormState] = useState<IBallotForm | null>(DEFAULT_FORM);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [currCand, setCurrCand] = useState<string>("");
  const [selectedRule, setSelectedRule] = useState<any | null>(null);

  const handleChange = (e: any) => {
    setFormState((prevState: IBallotForm | any) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const addCandidate = (e: any) => {
    setCandidates((prevState: string[] | any) => [
      ...prevState,
      e.target.value,
    ]);
    setCurrCand("");
    console.log(candidates);
  };

  const handleCandChange = (e: any) => {
    setCurrCand(e.target.value);
  };

  const setVotingRule = (e: any) => {
    setFormState((prevState: IBallotForm | any) => ({
      ...prevState,
      rule: e.value,
    }));
    setSelectedRule(e);
  };

  const setVotingMethod = (e: any) => {
    setFormState((prevState: IBallotForm | any) => ({
      ...prevState,
      voteMethod: e.value,
      rule: null,
    }));
    console.log(e);
    setSelectedRule(null);
  };

  const removeCandidate = (candidate: string) => {
    // @ts-ignore
    setCandidates(candidates?.filter((item) => item !== candidate));
  };

  const validationCheck = () => {
    if (formState?.rule === null) {
      return false;
    }

    if (!formState?.name || formState.name.length === 0) {
      return false;
    }

    if (candidates?.length < 2) {
      return false;
    }
  };

  return (
    <div className="page-container">
      <form className="ballot-form">
        <div
          className={formState?.name == "" ? "input" : "input input--has-value"}
        >
          <input
            className="input__field"
            name="name"
            type="name"
            onChange={(e) => {
              handleChange(e);
            }}
            value={formState?.name}
          />
          <label className="input__label">Ballot Name</label>
        </div>
        <div className="candidate-list-input__container">
          <div className="input-container">
            <input
              className="input__field"
              name="candidate"
              type="candidate"
              placeholder="Add new candidate"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addCandidate(e);
                }
              }}
              onChange={(e) => {
                handleCandChange(e);
              }}
              value={currCand}
            />
            <label className="input__label">Candidates</label>
          </div>
          <div className="list-added-candidates">
            {candidates?.map((cand) => (
              <div
                className="added-cand__container"
                key={cand}
                onClick={(e) => removeCandidate(cand)}
              >
                <div className="added-cand__name">{cand}</div>
                <div className="added-cand__remove">-</div>
              </div>
            ))}
          </div>
        </div>
        <div className="select-component">
          <label className="select-label">Voting Method</label>
          <Select
            options={VOTING_METHODS}
            onChange={(e) => setVotingMethod(e)}
          />
        </div>
        {formState?.voteMethod !== null && (
          <div className="select-component">
            <label className="select-label">Voting Rule</label>
            <Select
              options={
                formState?.voteMethod === "strict"
                  ? STRICT_RULES
                  : formState?.voteMethod === "weak"
                  ? WEAK_RULES
                  : ABC_RULES
              }
              onChange={(e) => setVotingRule(e)}
              value={selectedRule}
            />
          </div>
        )}
        <div className="input-checkbox">
          <input type="checkbox" />
          <label>Show Live Results</label>
          <div className="info-hover">?</div>
        </div>
        <div className="input-checkbox">
          <input type="checkbox" />
          <label>Double Factor</label>
          <div className="info-hover">?</div>
        </div>
        <input
          type="submit"
          value="Create Ballot"
          onClick={(e) => e.preventDefault()}
        />
      </form>
    </div>
  );
};

export default CreateBallot;
