import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import GetResultsModal from "../../components/results/getResultsModal";
import { auth } from "../../services/firebase";
import { getRecord } from "../../services/axios";
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme } from "victory"

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
  const [totalWeight, setTotalWeight] = useState<number | null>(null)
  const [personalWeight, setPersonalWeight] = useState<number | null>(null)
  const [average, setAverage] = useState<number | null>(null)
  const [totalVoters, setTotalVoters] = useState<number | null>(null)
  const [show, setShow] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    //@ts-ignore
    setBallotId(router.query?.ballotId)
    //@ts-ignore
    setWinners(router.query.results)
    //@ts-ignore
    setTotalWeight(router.query?.totalWeight)
    //@ts-ignore
    setPersonalWeight(router.query?.personalWeight)
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
        Authorization: "Bearer " + await auth.currentUser?.getIdToken(),
      }
    }
    const uriPath = `polls/details/${ballotId}`
    const res = await getRecord(uriPath, config);
    if (res.status == 403) {
      setError("Incorrect Passcode")
      return
    }
    if (res.status == 401 || res.status == 408) {
      setError("Unauthorized for more information about this ballot")
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
      const personalUrl = `results/personal/${ballotId}`
      const personalConfig = {
        headers: {
          ContentType: "application/json",
          Authorization: "Bearer " + await auth.currentUser?.getIdToken(),
        }
      }
      const personalRes = await getRecord(personalUrl, personalConfig);
      if (personalRes.status != 200) {
        setError("Unable to get personal data at this time")
        handleClose()
        return
      }
      else {
        setAverage(personalRes.data.totalWeight/personalRes.data.numVoters)
        setPersonalWeight(personalRes.data.personalWeight)
        setTotalVoters(personalRes.data.numVoters)
        setTotalWeight(personalRes.data.totalWeight)
        handleClose()
        return
      }
    } else {
      setError("Something went wrong")
    }
  }

  return (
  <div className='page-container election-results__container'>
    <div className="election-results__sides">
      <div className="election-results__left-side">
        <h3>Ballot Id: {ballotId}</h3>
        <h5>Elected Committee</h5>
        <div className="results-committee">
          {winners && winners.map((cand) => (
            <div key={cand} className='elected-committee'>{cand}</div>
          ))}
        </div>
            {average && 
      <div className="election-results__special-container">
        <p>Total Number of voters: <strong>{totalVoters}</strong></p>
        <p>Personal ballot weight: <strong>{personalWeight}</strong></p>
        <p>Average weight: <strong>{average}</strong></p>
        <div className="election-results__chart">
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
              {bar: "Average", value: average, label: average}, 
              {bar: "Personal Weight", value: personalWeight, label: personalWeight}
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
    </div>
  </div>)
}

export default BallotResults;
