import { useRouter } from "next/router"
import { useEffect, useState, useContext } from "react"
import { userContext, UserContextType } from "../../context/userState"
import { postRecord } from "../../services/axios"
import { auth } from "../../services/firebase"
import { randomStyleCandA, randomListStyleA, randomStyleNameA } from "./randomStyles"

const Ballot = (props: any) => {
  const styleRandomList = randomListStyleA[Math.floor(Math.random() * 2)]
  const styleRandomCand = randomStyleCandA[Math.floor(Math.random() * 4)]
  const styleRandomName = randomStyleNameA[Math.floor(Math.random() * 2)]
  const router = useRouter()
  const [loading, setLoading] = useState<boolean>(true)
  const [candidates, setCandidates] = useState<string[]>([])
  const [voteError, setVoteError] = useState<string | null>(null)
  const [isApproval, setIsApproval] = useState<boolean>(false)
  const { userValues, setUserValues } = useContext(
    userContext
  ) as UserContextType;

  useEffect(() => {
    if (!router.query.name) {
      router.push("/")
    }
    else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    //@ts-ignore
    setCandidates(router.query.candidates)
    setIsApproval(router.query.votingMethod === "approval")
  }, [router.query])

  useEffect(() => {
    console.log(candidates)
  },[candidates])

  const isStrictCheck = (values: Set<any>) => {
    if (values.size === candidates.length) {
      return true
    }
    return false
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
      const postData = {
        userToken: userValues.email,
        ballotId: router.query.ballotId,
        ballot: voteDict,
      }
      const config = {
        headers: {
          Authorization: "Bearer " + await auth.currentUser?.getIdToken(),
        }
      }
      const res = postRecord(uriPath, postData, config)
      res.then((data) => {
        console.log(data)
        if (data.status === 409) {
          setVoteError("You don't have permission to vote in this ballot")
        }
      })
      return
    }
    let valueSet = new Set()
    for (let i = 0; i < target.length - 1; i++) {
      console.log(target.elements[i].name, target.elements[i].value)
      if (!target.elements[i].value) {
        setVoteError(`Missing Vote for candidate ${target.elements[i].name}`)
        return
      }
      valueSet.add(target.elements[i].value)
      const name: string = target.elements[i].name
      voteDict[name as keyof typeof voteDict] = target.elements[i].value - 1
    }
    if (router.query.votingMethod === "strictOrdering") {
      if (!isStrictCheck(valueSet)) {
        setVoteError("This is a strict order ballot, no two candidates can have the same preferences.")
        return
      }
    }
    const postData = {
      userToken: userValues.email,
      ballotId: router.query.ballotId,
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
      }
      if (data.status === 405) {
        setVoteError("You've already cast a vote in this ballot.")
      } else {
        setVoteError("Ballot Submitted Successfully!")
      }
    })
  }
  return (
    <div className="page-container vote__container">
      {loading ? <></> 
      :
      <>
        <h1 className="vote__title">{router.query.name}</h1>
        <form onSubmit={handleVote} className='form__vote'>
        <div className="vote__cand-list" style={styleRandomList}>
        {candidates.map((x) => {
          console.log(styleRandomName)

          return (
            <div className="vote__cand-card" key={x} style={styleRandomCand}>
              <h3 className="vote__cand-name" style={styleRandomName}>{x}</h3> {router.query.votingMethod == "approval" ? <input type="checkbox" name={x}/> : <input type="number" name={x} max={candidates.length} min="1"/>}
            </div>
          )
        })}
        </div>
        <input type="submit" value="Submit Vote!" className="vote__submit"/>
        </form>
      </>
      }
      {voteError && <p>{voteError}</p>}
    </div>
  )
}

export default Ballot;