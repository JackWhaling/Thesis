import { NextPage } from "next";
import { useRouter } from "next/router";
import React, { createRef, useContext, useEffect, useRef, useState } from "react";
import Select from "react-select";
import { IBallots, IUser, userContext, UserContextType } from "../../../context/userState";
import { postRecord } from "../../../services/axios";
import { auth } from "../../../services/firebase";

interface IBallotForm {
  name: string;
  rule: string | null;
  liveResults: boolean;
  voteMethod: string | null;
  doubleAuth: boolean;
  numWinners: number,
}

const DEFAULT_FORM = {
  name: "",
  liveResults: false,
  rule: null,
  voteMethod: null,
  doubleAuth: false,
  numWinners: 2,
};

const VOTING_METHODS = [
  { value: "strictOrdering", label: "Strict Preferences" },
  { value: "weakOrdering", label: "Weak Preferences" },
  { value: "approval", label: "Approval Ballot" },
];

const ABC_RULES = [
  { value: "EAR", label: "Expanding Approvals Rules" },
  { value: "cc", label: "Chamberlin-Courant (CC)" },
  { value: "greedy-monroe", label: "Greedy Monroe"},
  { value: "minimaxav", label: "Minimax Condorcet Method"},
  { value: "equal-shares", label: "Method of Equal Shares (Rule-X)"},
  { value: "reqseqpav", label: "Sequential Proportional Approval Voting"},
  { value: "pav", label: "Proportional Approval Voting"}
];

const STRICT_RULES = [
  { value: "EAR", label: "Expanding Approvals Rule" }, 
  { value: "pbv", label: "Preferential Block Voting"},
  { value: "stv", label: "Single Transferable Vote"},
];

const WEAK_RULES = [{ value: "EAR", label: "Expanding Approvals Rule" }];

const CreateBallot: NextPage = () => {
  const [formState, setFormState] = useState<IBallotForm>(DEFAULT_FORM);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [currCand, setCurrCand] = useState<string>("");
  const [selectedRule, setSelectedRule] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null)
  const [successBallot, successBallotPass] = useState<any | null>(null);
  const { userValues, setUserValues } = useContext(
    userContext
  ) as UserContextType;
  const router = useRouter()

  const handleChange = (e: any) => {
    setFormState((prevState: IBallotForm | any) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  console.log(userValues)

  const submitForm = async () => {
    setError(null)
    if (validationCheck()) {
      try {
        const postData = {
          ballotType: formState?.voteMethod,
          ballotName: formState?.name,
          creatorId: userValues.postgresId,
          inviteMethod: formState?.doubleAuth ? "doubleFactor" : "singleFactor",
          votingRule: formState?.rule,
          liveResult: formState?.liveResults,
          numWinners: formState?.numWinners,
          candidates: candidates,
        }
        const uriValue = "polls/create"
        const config = {
          headers: {
            Authorization: "Bearer " + await auth.currentUser?.getIdToken(),
          }
        }
        const res = await postRecord(uriValue, postData, config)
          if (res.status === 201) {
            let newBallot: IBallots = {id: res.data.ballotId, name: formState.name, open: true, live: postData.liveResult}
            setUserValues((prevState: IUser | any) => ({
              ...prevState,
              ownedBallots: [...prevState.ownedBallots, newBallot]
            }))
            successBallotPass({pass: res.data.passcode, id: res.data.ballotId})
          }
          else {
            setError("Something went wrong! Please check you're not missing any fields")
          }
      } catch(err) {
        setError("Something happened on our end, please try again!")
      }
    }
  }

  const addCandidate = (e: any) => {
    if (candidates.includes(e.target.value)) {
      setError("Candidate already exists")
      setCurrCand("")
      return
    }

    if (e.target.value == "") {
      setError("Cant have an empty candidate")
      return
    }
    setCandidates((prevState: string[] | any) => [
      ...prevState,
      e.target.value,
    ]);
    setCurrCand("");
  };

  const handleLiveChange = (e: any) => {
    setFormState((prevState) => ({
      ...prevState,
      liveResults: e.target.checked
    }))
  } 

  const handleDoubleChange = (e: any) => {
    setFormState((prevState) => ({
      ...prevState,
      doubleAuth: e.target.checked
    }))
  }

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

    if (formState.numWinners < 2) {
      return false
    }
    return true
  };

  return (
    <div className="page-container">
      {successBallot ? 
        <div>
          <h3>Ballot Created (save the following information)</h3>
          <label>Passcode:</label>
          <p>{successBallot.pass}</p>
          <label>Id</label>
          <p>{successBallot.id}</p>
          <button onClick={(e) => router.push("/")}>Go Home</button>
        </div> 
      : 
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
            placeholder="Ballot Name"
          />
          <div className="cut-large cut"></div>
          <label className="input__label">Ballot Name</label>
        </div>
        <div className="candidate-list-input__container">
          <div className="input">
            <input
              className="input__field"
              name="candidate"
              type="text"
              placeholder="Add new candidate"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setError(null)
                  addCandidate(e);
                }
              }}
              onChange={(e) => {
                handleCandChange(e);
              }}
              value={currCand}
            />
            <div className="cut cut-large"></div>
            <label className="input__label">Candidates</label>
          </div>
          {candidates.length > 0 && <div className="list-added-candidates">
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
          </div>}
        </div>
        <div
          className={formState?.numWinners == null ? "input" : "input input--has-value"}
        >
          <input
            className="input__field"
            name="numWinners"
            type="number"
            onChange={(e) => {
              handleChange(e);
            }}
            value={formState?.numWinners}
            placeholder="placeholder"
          />
          <div className="cut cut-xxl"></div>
          <label className="input__label">Committee Size (min: 2)</label>
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
                formState?.voteMethod === "strictOrdering"
                  ? STRICT_RULES
                  : formState?.voteMethod === "weakOrdering"
                  ? WEAK_RULES
                  : ABC_RULES
              }
              onChange={(e) => setVotingRule(e)}
              value={selectedRule}
            />
          </div>
        )}
        <div className="input-checkbox">
          <input type="checkbox" onChange={handleLiveChange}/>
          <label>Show Live Results</label>
          <div className="info-hover">?</div>
        </div>
        <div className="input-checkbox">
          <input type="checkbox" onChange={handleDoubleChange}/>
          <label>Double Factor</label>
          <div className="info-hover">?</div>
        </div>
        <input
          type="button"
          disabled={!validationCheck()}
          value="Create Ballot"
          onClick={(e) => {
            e.preventDefault()
            submitForm()}
          }
        />
      </form>
      }
      {error ? <div className="error">{error}</div> : <></>}
    </div>
  );
};

export default CreateBallot;
