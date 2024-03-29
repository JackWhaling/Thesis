import { NextPage } from "next";
import { useRouter } from "next/router";
import React, { createRef, useContext, useEffect, useRef, useState } from "react";
import Select from "react-select";
import internal from "stream";
import { IBallots, userContext, UserContextType } from "../../../context/userState";
import { postRecord } from "../../../services/axios";
import DatasetInfo from "../../../components/info/datasetInfo";
import { Modal } from "react-bootstrap";
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme } from "victory"

// Updates the height of a <textarea> when the value changes.
const useAutosizeTextArea = (
  textAreaRef: HTMLTextAreaElement | null,
  value: string
) => {
  useEffect(() => {
    if (textAreaRef) {
      // We need to reset the height momentarily to get the correct scrollHeight for the textarea
      textAreaRef.style.height = "0px";
      const scrollHeight = textAreaRef.scrollHeight;

      // We then set the height directly, outside of the render loop
      // Trying to set this with state or a ref will product an incorrect value.
      textAreaRef.style.height = scrollHeight + "px";
    }
  }, [textAreaRef, value]);
};


interface IRawBallot {
  rule: string | null;
  numWinners: number,
  rawData: string,
}

interface IResults {
  winners: string[];
  numCandidates: number,
  uniqueVoters: number,
  numVoters: number,
}

const DEFAULT_RESULTS = {
  winners: [],
  numCandidates: 0,
  uniqueVoters: 0,
  numVoters: 0,
}

const DEFAULT_FORM = {
  rule: null,
  numWinners: 2,
  rawData: "",
};

const ALL_RULES = [
  { value: "EAR", label: "Expanding Approvals Rule {SOC, SOI, TOI, TOC, Approval}" }, 
  { value: "pbv", label: "Preferential Block Voting {SOC}"},
  { value: "stv", label: "Single Transferable Vote {SOC}"},
  { value: "cc", label: "Chamberlin-Courant (CC) {Approval}" },
  { value: "greedy-monroe", label: "Greedy Monroe {Approval}"},
  { value: "minimaxav", label: "Minimax Condorcet Method {Approval}"},
  { value: "equal-shares", label: "Method of Equal Shares (Rule-X) {Approval}"},
  { value: "reqseqpav", label: "Sequential Proportional Approval Voting {Approval}"},
  { value: "pav", label: "Proportional Approval Voting {Approval}"}
];

const chartTheme = {
  axis: {
    style: {
      tickLabels: {
        fill: "#6e2594",
      },
      axis: {
        stroke: "#6e2594",
      },
      grid: {
          stroke: '#E6EBE0',
          strokeDasharray: '7',
      }
    },
  },
};

interface ISpecial {
  specificWeight: number,
  average: number,
  totalWeight: number,
}

const RawBallot: NextPage = () => {
  const [help, setHelp] = useState<boolean>(false)
  const [formState, setFormState] = useState<IRawBallot>(DEFAULT_FORM);
  const [selectedRule, setSelectedRule] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null)
  const [gettingResults, setGettingResults] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [resultsData, setResultsData] = useState<IResults>(DEFAULT_RESULTS)
  const [special, setSpecial] = useState<ISpecial | null>(null)
  const { userValues, setUserValues } = useContext(
    userContext
  ) as UserContextType;
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useAutosizeTextArea(textareaRef.current, formState.rawData)

  const handleChange = (e: any) => {
    setFormState((prevState: IRawBallot | any) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const goBack = (e: any) => {
    e.preventDefault()
    setShowResults(false)
    setResultsData(DEFAULT_RESULTS)
    setSpecial(null)
  }

  const openHelper = (e:any) => {
    e.preventDefault()
    setHelp(true)
  }

  const closeHelper = () => {
    setHelp(false)
  }


  useEffect(() => {
    setGettingResults(false)
  }, [resultsData])

  const submitForm = (e: any) => {
    e.preventDefault()
    setError(null)
    setGettingResults(true)
    if (validationCheck()) {
      try {
        const postData = {
          voteRule: formState?.rule,
          numWinners: formState?.numWinners,
          rawData: formState?.rawData,
        }
        const uriValue = "results/election"
        const res = postRecord(uriValue, postData)
        res.then((data) => {
          console.log(data)
          if (data.status == 200) {
            setShowResults(true)
            setResultsData((prevState)=> ({
              ...prevState,
              winners: data.data.results,
              numVoters: data.data.numVoters,
              uniqueVoters: data.data.uniqueVotes,
              numCandidates: data.data.numCandidates,
            }))
            if (data.data.special != 0) {
              const specificWeight = data.data.special.specificWeight
              const totalWeight = data.data.special.totalWeight
              const averageWeight = totalWeight/data.data.numVoters
              setSpecial({
                specificWeight: specificWeight,
                totalWeight: totalWeight,
                average: averageWeight,
              })
            }
            return
          }
          else {
            setError("Incorrect Data Input")
          }
          setGettingResults(false)
        })
      } catch(err) {
        setError("Something happened on our end, please try again!")
      }
    }
  }

  const setVotingRule = (e: any) => {
    setFormState((prevState: IRawBallot | any) => ({
      ...prevState,
      rule: e.value,
    }));
    setSelectedRule(e);
  };
  const validationCheck = () => {
    if (formState?.rule === null) {
      return false;
    }

    if (formState.numWinners < 2) {
      return false
    }

    if (formState.rawData == "") {
      return false
    }
    return true
  };

  return (
    <div className="page-container">
      <form className="ballot-form" onSubmit={submitForm}>
        {gettingResults ? <div style={{"width": "100%", "display": "flex", "justifyContent": "center"}}><div className="spinner-border" style={{"color": "#6e2594"}}></div></div>
        :
        !showResults && <>
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
          <label className="select-label">Voting Rule</label>
          <Select
            options={ALL_RULES}
            onChange={(e) => setVotingRule(e)}
            value={selectedRule}
          />
        </div>
        <div className="input input-textarea">
            <textarea 
              contentEditable 
              name="rawData"
              className="input__field input-textarea"
              placeholder="placeholder"
              onChange={(e)=> handleChange(e)} 
              ref={textareaRef}
              rows={1}
              value={formState.rawData}
            />
            <div className="cut"></div> 
            <label className="input__label">Data Set</label>
            <span className="helper__button" onClick={openHelper}>Need Help?</span>
            <Modal show={help} onHide={closeHelper} centered dialogClassName="helper__modal">
              <Modal.Header closeButton>
              </Modal.Header>
              <Modal.Body>
                  <DatasetInfo />
              </Modal.Body>
            </Modal>
        </div>
        <input className="submit" type="submit" value="Get Results" disabled={!validationCheck()}/>
        </>}
        {showResults && 
          <div className="results__container">
            <div className="results__subdata">
              <div className="results__num-voters">Out of: <strong>{resultsData.numVoters}</strong> voters</div>
              <div className="results__unique-votes"><strong>{resultsData.uniqueVoters} </strong> unique ballot orderings</div>
              <div className="results__num-candidates">Out of <strong>{resultsData.numCandidates}</strong> candidates</div>
            </div>
            <div className="results__winners-header">Elected Committee</div>
            <div className="results__winners">
              {resultsData.winners.map((winner) => (
                <div key={winner} className="results__single-winner">{winner}</div>
              ))}
            </div>
            {special && 
              <div className="results__special-container">
                <p>Specific chosen ballot weight: <strong>{special.specificWeight}</strong></p>
                <p>Average weight: <strong>{special.average}</strong></p>
                <div className="results__chart">
                <VictoryChart
                  // adding the material theme provided with Victory
                  theme={chartTheme}
                  domainPadding={80}
                >
                  <VictoryAxis
                    tickValues={[1, 2]}
                    style={{axis: {fill: "#6e2594", color: "#6e2594"}, axisLabel: {fill: "#6e2594", color: "#6e2594"},}}
                  />
                  <VictoryAxis
                    dependentAxis
                    tickFormat={(x) => (x)}
                  />
                  <VictoryBar
                    data={[
                      {bar: "Average", value: special.average, label: special.average}, 
                      {bar: "Specific Weight", value: special.specificWeight, label: special.specificWeight}
                    ]}
                    x="bar"
                    y="value"
                    style={{
                      data: {fill: "#6e2594", color: "#6e2594"}, 
                    }}
                  />
                </VictoryChart>
                </div>
              </div>
            }
            <button onClick={(e) => goBack(e)} className="results__goback">{"<"} Go Back</button>
          </div>
        }
      </form>
      {error ? <div className="error">{error}</div> : <></>}
    </div>
  );
};

export default RawBallot;

/* TEST DATA
1: c1,c2,c3,e1,e2,e3,e4,d1
1: c2,c3,c1,e1,e2,e3,e4,d1
1: c3,c1,d1,c2,e1,e2,e3,e4
6: e1,e2,e3,e4,c1,c2,c3,d1
*/