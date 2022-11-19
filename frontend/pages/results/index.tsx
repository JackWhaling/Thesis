import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import GetResultsModal from "../../components/results/getResultsModal";
import { getRecord } from "../../services/axios";

export const VOTING_RULE_MAP = new Map([
  ["EAR", "Expanding Approvals Rule"],
  ["cc", "Chamberlin-Courant (CC)"],
  ["greedy-monroe", "Greedy Monroe"],
  ["minimaxav", "Minimax Condorcet Method"],
  ["equal-shares", "Method of Equal Shares (Rule-X)"],
  ["reqseqpav", "Sequential Proportional Approval Voting"],
  ["pav", "Proportional Approval Voting"],
  ["stv", "Single Transferable Vote"],
  ["pbv", "Preferential Block Voting"],
])

interface IBallotInfo {
  candidates: string[],
  name: string,
  committeeSize: number | string,
  close: boolean,
  votingMethod: string,
  rule: string,
}

const BallotResults = (props: any) => {
  const router = useRouter()

  const [ballotInfo, setBallotInfo] = useState<IBallotInfo | any>(null);
  const [ballotId, setBallotId] = useState(null)
  const [winners, setWinners] = useState([])
  const [show, setShow] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log(router.query)
    //@ts-ignore
    setBallotId(router.query?.ballotId)
    //@ts-ignore
    setWinners(router.query.results)
  }, [router.query])

  const handleClose = () => {
    setShow(false)
  }

  const handleOpen = () => {
    setShow(true)
  }

  const getBallotInfo = async (e: any, passcode: string) => {
    e.preventDefault();
    const config = {
      headers: {
        passcode: passcode,
      }
    }
    console.log(config)
    const uriPath = `polls/details/${ballotId}`
    const res = await getRecord(uriPath, config);
    console.log(res)
    if (res.status == 403) {
      setError("Incorrect Passcode")
      return
    }
    if (res.status == 200) {
      setBallotInfo({
        name: res.data.ballotName,
        candidates: res.data.candidates,
        committeeSize: res.data.committeeSize,
        votingMethod: res.data.votingMethod,
        closed: res.data.closed,
        rule: res.data.rule
      })
      handleClose()
      return
    } else {
      setError("Something went wrong")
    }
  }

  return (<div className='page-container election-results__container'>
    <div className="election-results__left-side">
      <h3>Ballot Id: {ballotId}</h3>
      <h5>Elected Committee</h5>
      <div className="results-committee">
        {winners && winners.map((cand) => (
          <div key={cand} className='elected-committee'>{cand}</div>
        ))}
      </div>
    </div>
    <div className="election-results__right-side">
      {!ballotInfo ? 
        <>
          <input type='button' className="get-info-btn" value="Get More Info" onClick={handleOpen}/>
          <GetResultsModal
            show={show}
            hideModal={handleClose}
            getBallotInfo={getBallotInfo}
            error={error}
          /> 
        </>: 
        <div className="election-results__info">
          <h3>{ballotInfo.name}</h3>
          <div className="all-candidates">
            <h5 className="all-candidates__title">All candidates</h5>
            <div className="all-candidates__list">
              {ballotInfo.candidates.map((cand: string) => <div key={cand} className='candidate'>{cand}</div>)}
            </div>
          </div>
          <div className='rule'>
            Voting Rule: <strong>{VOTING_RULE_MAP.get(ballotInfo.rule)}</strong>
          </div>
        </div>
      }
    </div>
  </div>)
}

export default BallotResults;
