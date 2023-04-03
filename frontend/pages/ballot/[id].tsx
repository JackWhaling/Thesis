import { useRouter, withRouter } from "next/router"
import { useEffect, useState, useContext } from "react"
import { userContext, UserContextType } from "../../context/userState"
import { postRecord, putRecord } from "../../services/axios"
import { auth } from "../../services/firebase"
import { randomStyleCandA, randomListStyleA, randomStyleNameA } from "../../components/shared/randomStyles"
import { integerPropType } from "@mui/utils"
import { ballotContext, BallotContextType } from "../../context/ballotState"
import DfaCard from "../../components/ballots/dfaCard"
import UpdateCard from "../../components/ballots/updateBallotCard"
import { diffTime } from "../../services/helpers"
// @ts-ignore

const Ballot = (props: any) => {
  const { ballotValues, setBallotValues } = useContext(ballotContext) as BallotContextType
  const [styleRandomListNum, setStyleRandomListNum] = useState<number>(Math.floor(Math.random() * 2))
  const [styleRandomCandNum, setStyleRandomCandNum] = useState<number>(Math.floor(Math.random() * 4))
  const [styleRandomNameNum, setStyleRandomNameNum] = useState<number>(Math.floor(Math.random() * 2))
  const styleRandomList = randomListStyleA[styleRandomListNum]
  const styleRandomCand = randomStyleCandA[styleRandomCandNum]
  const styleRandomName = randomStyleNameA[styleRandomNameNum]
  const router = useRouter()
  const [loading, setLoading] = useState<boolean>(true)
  const [candidates, setCandidates] = useState<string[]>(ballotValues.candidates)
  const [voteError, setVoteError] = useState<string | null>(null)
  const [isApproval, setIsApproval] = useState<boolean>(ballotValues.votingMethod === "approval")
  const [dfaReuired, setDfaRequired] = useState<boolean>(false)
  const [dfaCode, setDfaCode] = useState<string>("")
  const [toUpdate, setToUpdate] = useState<boolean>(false)
  const [voteOrder, setVoteOrder] = useState<any>({})
  const [voteObject, setVoteObject] = useState<any>({})
  const [invalidDfa, setInvalidDfa] = useState<boolean>(false)
  const { userValues, setUserValues } = useContext(
    userContext
  ) as UserContextType;
  const [start, setStart] = useState<any>(new Date())


  const shuffle = (array: any) => {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  };


  useEffect(() => {
    if (ballotValues.ballotId == "") {
      router.push("/")
    }
    setBallotValues((prevState) => ({
      ...prevState,
      candidates: shuffle(prevState.candidates)
    }))
  }, [])

  useEffect(() => {
    setLoading(false)
  },[candidates])

  const isStrictCheck = (values: Set<any>) => {
    if (values.size === candidates.length) {
      return true
    }
    return false
  }

  const handleSelectValue = (index: number, e: any) => {
    if (!e.target.value) {
      return
    }
    if (e.target.value <= 0 || e.target.value > candidates.length) {
      return
    }
    setVoteOrder((prevState: any) => ({
      ...prevState,
      [index]: e.target.value,
      }
    ))
  }

  const handleVote = async (e:any) => {
    e.preventDefault()
    const target = e.target
    let voteDict: any = {}
    setVoteError(null)
    const uriPath = "ballots/votes/give"

    if (isApproval) {
      for (let i = 0; i < target.length - 1; i++) {
        const name: string = target.elements[i].name
        if (target.elements[i].checked) {
          voteDict[name as keyof typeof voteDict] = 0
        }
        else { voteDict[name as keyof typeof voteDict] = 1}
      }
      setVoteObject(voteDict)
      const postData = {
        timeDiff: diffTime(start, new Date()).toString(),
        voteOrder: voteOrder,
        styleGenerated: `${styleRandomListNum} ${styleRandomCandNum} ${styleRandomNameNum}`,
        ballotId: ballotValues.ballotId,
        ballot: voteDict,
      }
      const config = {
        headers: {
          Authorization: "Bearer " + await auth.currentUser?.getIdToken(),
        }
      }
      const res = postRecord(uriPath, postData, config)
      res.then((data) => {
        if (data.status === 409) {
          setVoteError("You don't have permission to vote in this ballot")
          return
        }
        if (data.status !== 200) {
          setVoteError("Something happened when trying to submit this ballot, try again later")
          return
        }
        const end = new Date()
        // @ts-ignore
        window.gtag("event", "vote", {
          start: `${start.toUTCString()}`,
          end: `${end.toUTCString()}`,
          randomStyles: `${styleRandomListNum} ${styleRandomCandNum} ${styleRandomNameNum}`,
          votePattern: `${voteOrder}`,
        })
        setVoteError("Ballot Submitted Successfully!")
        return
      })
    }
    let valueSet = new Set()
    for (let i = 0; i < target.length - 1; i++) {
      if (!target.elements[i].value) {
        setVoteError(`Missing Vote for candidate ${target.elements[i].name}`)
        return
      }
      valueSet.add(target.elements[i].value)
      const name: string = target.elements[i].name
      voteDict[name as keyof typeof voteDict] = target.elements[i].value - 1
    }
    if (ballotValues.votingMethod === "strictOrdering") {
      if (!isStrictCheck(valueSet)) {
        setVoteError("This is a strict order ballot, no two candidates can have the same preferences.")
        return
      }
    }

    setVoteObject(voteDict)
    const postData = {
      timeDiff: diffTime(start, new Date()).toString(),
      voteOrder: voteOrder,
      styleGenerated: `${styleRandomListNum} ${styleRandomCandNum} ${styleRandomNameNum}`,
      ballotId: ballotValues.ballotId,
      ballot: voteDict,
    }
    const config = {
      headers: {
        Authorization: "Bearer " + await auth.currentUser?.getIdToken(),
      }
    }
    const res = postRecord(uriPath, postData, config)
    res.then((data) => {
      if (data.status === 403) {
        setVoteError("You don't have permission to vote in this ballot")
        return
      }
      if (data.status === 405) {
        setToUpdate(true)
        return
      } else if (data.status === 406) {
        setDfaRequired(true)
        return
      } else if (data.staus === 200) {
        setVoteError("Ballot Submitted Successfully!")
        const end = new Date()
        // @ts-ignore
        window.gtag("event", "vote", {
          start: `${start.toUTCString()}`,
          end: `${end.toUTCString()}`,
          randomStyles: `${styleRandomListNum} ${styleRandomCandNum} ${styleRandomNameNum}`,
          votePattern: `${voteOrder}`,
        })
        return
      } else {
        setVoteError("An error occured. Please try submitting again")
        return
      }
    })
  }

  const handleDfaChange = (e:any) => {
    e.preventDefault()
    setDfaCode(e.target.value);
  }

  const handleDfaSubmit = async (e:any) => {
    e.preventDefault()
    setInvalidDfa(false)
    const uriPath = "ballots/votes/secure"
    const postData = {
      timeDiff: diffTime(start, new Date()).toString(),
      voteOrder: voteOrder,
      styleGenerated: `${styleRandomListNum} ${styleRandomCandNum} ${styleRandomNameNum}`,
      dfaCode: dfaCode,
      ballotId: ballotValues.ballotId,
      ballot: voteObject,
    }
    const config = {
      headers: {
        Authorization: "Bearer " + await auth.currentUser?.getIdToken(),
      }
    }
    const res = postRecord(uriPath, postData, config)
    res.then((data) => {
      if (data.status === 200) {
        const end = new Date()
        // @ts-ignore
        window.gtag("event", "vote", {
          start: `${start.toUTCString()}`,
          end: `${end.toUTCString()}`,
          randomStyles: `${styleRandomListNum} ${styleRandomCandNum} ${styleRandomNameNum}`,
          votePattern: `${voteOrder}`,
        })
        setVoteError("Ballot Submitted Successfully!")
        setDfaRequired(false)
        return
      } else if (data.status === 409) {
        setVoteError("Something went wrong. Please try again later.")
        setDfaRequired(false)
        return
      } else if (data.status === 403) {
        setVoteError("Something went wrong. Please try again later.")
        setDfaRequired(false)
        return
      } else if (data.status === 405) {
        setVoteError("Any error occured, please try again")
        setInvalidDfa(true)
        return
      }
    })
  }

  const handleUpdateSubmit = async (e: any) => {
    e.preventDefault()
    const uriPath = "ballots/update"
    const postData = {
      timeDiff: diffTime(start, new Date()).toString(),
      voteOrder: voteOrder,
      styleGenerated: `${styleRandomListNum} ${styleRandomCandNum} ${styleRandomNameNum}`,
      ballotId: ballotValues.ballotId,
      ballot: voteObject,
    }
    const config = {
      headers: {
        Authorization: "Bearer " + await auth.currentUser?.getIdToken(),
      }
    }
    const res = putRecord(uriPath, postData, config)
    res.then((data) => {
      console.log(data)
    if (data.status === 200) {
        const end = new Date()
        // @ts-ignore
        window.gtag("event", "vote", {
          start: `${start.toUTCString()}`,
          end: `${end.toUTCString()}`,
          randomStyles: `${styleRandomListNum} ${styleRandomCandNum} ${styleRandomNameNum}`,
          votePattern: `${voteOrder}`,
        })
        setVoteError("Ballot Submitted Successfully!")
        setToUpdate(false)
        return
      } else if (data.status === 403) {
        setVoteError("Something happened!")
        setToUpdate(false)
        return
      } else if (data.status === 406) {
        setVoteError("Double Factor Authentication required")
        setDfaRequired(true)
        return
      } else if (data.status === 405) {
        setVoteError("An Error occured, please try again")
        setToUpdate(false)
        return
      }
    })
  }

  const handleUpdateDfa = async (e: any) => {
    e.preventDefault()
    setInvalidDfa(false)
    const uriPath = "ballots/update/secure"
    const postData = {
      timeDiff: diffTime(start, new Date()).toString(),
      voteOrder: voteOrder,
      styleGenerated: `${styleRandomListNum} ${styleRandomCandNum} ${styleRandomNameNum}`,
      dfaCode: dfaCode,
      ballotId: ballotValues.ballotId,
      ballot: voteObject,
    }
    const config = {
      headers: {
        Authorization: "Bearer " + await auth.currentUser?.getIdToken(),
      }
    }
    const res = postRecord(uriPath, postData, config)
    res.then((data) => {
    if (data.status === 200) {
        const end = new Date()
        // @ts-ignore
        window.gtag("event", "vote", {
          start: `${start.toUTCString()}`,
          end: `${end.toUTCString()}`,
          randomStyles: `${styleRandomListNum} ${styleRandomCandNum} ${styleRandomNameNum}`,
          votePattern: `${voteOrder}`,
        })
        setVoteError("Ballot Submitted Successfully!")
        setToUpdate(false)
        setDfaRequired(false)
        return
      } else if (data.status === 403) {
        setVoteError("Something went wrong. Please try again later.")
        setToUpdate(false)
        setDfaRequired(false)
        return
      } else if (data.status === 405) {
        setVoteError("Invalid Passcode Given.")
        setInvalidDfa(true)
        return
      } else if (data.status === 409) {
        setVoteError("Something went wrong, please try again later")
        setToUpdate(false)
        setDfaRequired(false)
        return
      }
    })
  }

  return (
    <div className="page-container vote__container">
      {loading ? <></> 
      :
      <>
        <h1 className="vote__title">{ballotValues.name}</h1>
        <form onSubmit={handleVote} className='form__vote'>
        <div className="vote__cand-list" style={styleRandomList}>
        {candidates?.map((x, idx) => {
          return (
            <div className="vote__cand-card" key={x} style={styleRandomCand}>
              <h3 className="vote__cand-name" style={styleRandomName}>{x}</h3> 
              {ballotValues.votingMethod == "approval" ? 
                <input 
                  className="vote__checkbox"
                  type="checkbox" 
                  name={x}
                  onChange={(e) => {
                    handleSelectValue(idx, e)
                  }
                  }
                /> : 
              <input 
                type="number" 
                className="vote-rating" 
                name={x} 
                max={candidates.length} 
                min="1"
                key={x}
                onChange={(e) => {
                  e.preventDefault()
                  handleSelectValue(idx, e)
                }}
              />
              }
            </div>
          )
        })}
        {(dfaReuired && !toUpdate) && 
          <div className="dfa-modal">
            <DfaCard 
              invalid={invalidDfa}
              changeFunc={handleDfaChange} 
              closeFunc={() => {setDfaRequired(false)}} 
              submitFunc={handleDfaSubmit}
            />
          </div>
        }
        {(toUpdate && dfaReuired) && 
          <div className="dfa-modal">
            <DfaCard
              invalid={invalidDfa}
              changeFunc={handleDfaChange} 
              closeFunc={() => {
                setDfaRequired(false)
                setToUpdate(false)
              }} 
              submitFunc={handleUpdateDfa}
            />
          </div>
        }
        </div>
        {(toUpdate && !dfaReuired) && 
          <UpdateCard 
            closeFunc={() => {setToUpdate(false)}}
            submitFunc={handleUpdateSubmit}
          />}
        {!toUpdate && <input type="submit" value="Submit Vote!" className="vote__submit"/>}
        </form>
      </>
      }
      {voteError && <p>{voteError}</p>}
    </div>
  )
}

export default withRouter(Ballot);