import { NextPage } from "next";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from "react";
import Ballot from "../../components/ballot/ballot";
import BallotCard from "../../components/ballots/ballotCard";
import { IBallots, userContext, UserContextType } from "../../context/userState";
import { Modal } from "react-bootstrap";
import { getRecord, postRecord, putRecord } from "../../services/axios";
import { auth } from "../../services/firebase";
import { ballotContext, BallotContextType, IBallot } from "../../context/ballotState";
import SingleAddVoter from "../../components/ballot/singleAddVoters";
import MultiAddBody from "../../components/ballot/multiAddVoters";

interface IBallotInfo {
  ballotId: string;
  ballotName: string;
  closed: boolean;
}

interface IAccount {
  email: string;
  ballots: IBallotInfo[];
}

const Account: NextPage = () => {
  const { userValues, setUserValues } = useContext(
    userContext
  ) as UserContextType;

  const { ballotValues, setBallotValues } = useContext(ballotContext) as BallotContextType;
  const [showIncorrect, setIncorrect] = useState<boolean>(false)
  const [voteModal, setVoteModal] = useState<boolean>(false)
  const [resultModal, setResultModal] = useState<boolean>(false)
  const [addModal, setAddModal] = useState<boolean>(false)
  const [passcode, setPasscode] = useState<string>("")
  const [selectedAddBallot, setSelectedBallot] = useState<IBallots | null>(null)
  const [voterAdded, setVoterAdded] = useState<boolean>(false)
  const [selectedBallotId, setSelectedBallotId] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [voters, setVoters] = useState<string[]>([])
  const [currVoter, setCurrVoter] = useState<string>("")
  const [isDfaAdd, setIsDfaAdd] = useState<boolean>(false)
  const [givenPass, setGivenPass] = useState<string>("")

  const router = useRouter();

  const openBallots = userValues.ballots.filter(
    (ballot) => ballot.open === true
  );
  const closedBallots = userValues.ballots.filter(
    (ballot) => ballot.open !== true
  );

  useEffect(() => {

    if (userValues.id === "") {
      router.push("/");
    }
  }, []);

  const showVoteModal = (id: string) => {
    setVoteModal(true)
    setSelectedBallotId(id)
  }

  const showResultModal = (id: string) => {
    setResultModal(true)
    setSelectedBallotId(id)
  }

  const hideResultModal = () => {
    setResultModal(false)
    setSelectedBallotId("")
  }

  const hideVoteModal = () => {
    setVoteModal(false)
    setSelectedBallotId("")
  }

  const addVoter = (e: any) => {
    if (voters.includes(currVoter)) {
      setError("Voter already added")
      setCurrVoter("")
      return
    }
    if (currVoter== "") {
      setError("No email given")
      return
    }
    setVoters((prevState: string[] | any) => [
      ...prevState,
      currVoter,
    ]);
    setCurrVoter("");
  };

  const removeVoter = (voter: string, e:any) => {
    e.preventDefault()
    // @ts-ignore
    setVoters(voters?.filter((item) => item !== voter));
  };

  const onKeyDownMulti = (e: any) => {
    if (e.key === "Enter") {
      setError(null)
      addVoter(currVoter);
    }
  }

  const addVoterFunc = (e: any) => {
    console.log(voters)
    setError(null)
    addVoter(e)
  }

  const handleGotoVote = async (id: string, passcode: string) => {
    const config = {
      headers: {
        passcode: passcode,
      }
    }
    const uriPath = `polls/details/${id}`
    const res = await getRecord(uriPath, config);
    if (res.status == 403) {
      setIncorrect(true)
      return
    }
    setIncorrect(false)
    hideVoteModal();
    // @ts-ignore
    setBallotValues({
      name: res.data.ballotName,
      candidates: res.data.candidates,
      committeeSize: res.data.committeeSize,
      elected: res.data.elected,
      // @ts-ignore
      liveResults: res.data.liveResults,
      // @ts-ignore
      owner: res.data.owner,
      votingMethod: res.data.votingMethod,
      closed: res.data.closed,
      ballotId: id,
    })
  }

  useEffect(() => {
    if (ballotValues.ballotId != "") {
      router.push(`/ballot/${ballotValues.ballotId}`)
    }
  }, [ballotValues])

  const addVotersModal = (ballotId: any, doubleFactor: boolean, ballot: IBallots) => {
    setSelectedBallotId(ballotId)
    setError(null)
    setIsDfaAdd(doubleFactor)
    setAddModal(true)
    setSelectedBallot(ballot)
  }

  const closeAddModal = () => {
    setAddModal(false)
    setIsDfaAdd(false)
    setVoters([])
  }

  const addVoterSecure = async (e: any) => {
    const uriPath = "/ballots/invite/secure"
    const postData = {
      voter: currVoter,
      ballotId: selectedAddBallot?.id
    }
    const config = {
      headers: {
        Authorization: "Bearer " + await auth.currentUser?.getIdToken(),
      }
    }

    const res = await putRecord(uriPath, postData, config)
    if (res.status === 403) {
      setError("Someone you tried to add doesn't exist in our system")
      return
    }
    if (res.status !== 201) {
      setError("Failed to add this voter to the ballot (this account may not exist)")
      return
    }
    setVoterAdded(true)
    addVoter(currVoter)
    setError("")
    setGivenPass(res.data.code)
  }
  
  const handleVoterChange = (e: any) => {
    setCurrVoter(e.target.value);
  };

  const addVoters = async (ballotId: string, userId: any) => {
    const uriPath = "/ballots/invite"
    const postData = {
      voters: voters,
      ballotId: ballotId
    }
    const config = {
      headers: {
        Authorization: "Bearer " + await auth.currentUser?.getIdToken(),
      }
    }

    const res = await putRecord(uriPath, postData, config)
    if (res.status === 403) {
      setError("Someone you tried to add doesn't exist in our system")
      return
    }
    if (res.status !== 201) {
      setError("Failed to add users to the ballots, either someone has already been added or an account doesn't exist in our system")
      return
    }
    setVoters([])
    closeAddModal()
  }

  const closeBallot = async (ballotId: string) => {
    const putUrl = 'polls/close'
    const body = {
      ballotId: ballotId,
    }
    const config = {
      headers: {
        Authorization: "Bearer " + await auth.currentUser?.getIdToken(),
      }
    }

    const res = await putRecord(putUrl, body, config)
    if (res.status == 201) {
      const index = userValues.ownedBallots.findIndex(ballot =>{
        return ballot.id === ballotId  
      })
      setUserValues((prevState) => ({
        ...prevState,
        ownedBallots: [
          ...prevState.ownedBallots.slice(0,index),
          {
            ...prevState.ownedBallots[index],
            open: false,
          },
          ...prevState.ownedBallots.slice(index + 1),
        ]
      }))
    } else {
      alert('Failed to close')
    }
  }

  const handleGotoResultSpecific = async (ballotId: string) => {
    const getUrl = `results/personal/${ballotId}`
    const config = {
      headers: {
        ContentType: "application/json",
        Authorization: "Bearer " + await auth.currentUser?.getIdToken(),
      }
    }
    const res = await getRecord(getUrl, config)

    if (res.status == 200) {
      const passQuery = {
        results: res.data.results,
        ballotId: ballotId,
        totalWeight: res.data.totalWeight,
        personalWeight: res.data.personalWeight
      }
      router.push({pathname: `/results`, query: passQuery}, `/results`)
      return
    } if (res.status == 406) {
      alert('not enough voters found to analyse results')
      return
    } else {
      alert('Unable to get results at this time')
      return
    }
  }

  const getResults = async (ballotId: string) => {
    const getUrl = `results/ballot/${ballotId}`
    const config = {
      headers: {
        ContentType: "application/json",
        Authorization: "Bearer " + await auth.currentUser?.getIdToken(),
      }
    }

    const res = await getRecord(getUrl, config)

    if (res.status == 200) {
      const passQuery = {
        results: res.data.results,
        ballotId: ballotId,
      }
      router.push({pathname: `/results`, query: passQuery}, `/results`)
      return
    } if (res.status == 406) {
      alert('not enough voters found to analyse results')
    } else {
      alert('Unable to get results at this time')
    }
  }

  return (
    <div className="page-container">
      <div className="account-header">
        <h3 className="account-header__email">{userValues.email}</h3>
      </div>
      <div className="ballot-lists__open">
        {openBallots.length === 0 ? (
          <h4 className="ballot-list__none">You have no open ballots</h4>
        ) : (
          <div className="open-ballot-container">
            <h4>Your Open Ballots:</h4>
            <div className="card-container">
              {openBallots.map((ballot: IBallots) => {
                return (
                <div className="ballot__card" key={ballot.id} onClick={(e) => showVoteModal(ballot.id)}>
                  <BallotCard name={ballot.name} id={ballot.id} key={ballot.id} />
                </div>
              )}
              )}
            </div>
          </div>
        )
        }
      </div>
      <div className="ballot-lists__closed">
        {closedBallots.length === 0 ? (
          <h4 className="ballot-list__none">You have no closed ballots</h4>
        ) : (
          <div className="open-ballot-container">
          <h4>Your Closed Ballots:</h4>
            <div className="card-container">
            {closedBallots.map((ballot) => (
              <div className="ballot__card" key={ballot.id} onClick={(e) => showResultModal(ballot.id)}>
                <BallotCard name={ballot.name} id={ballot.id} key={ballot.id} />
              </div>
            ))}
            </div>
          </div>
        )}
      </div>
      <div className="ballots-lists__owned">
        <h3 className="ballots-list__title">Owned Ballots</h3>
        {userValues.ownedBallots.map((ballot) => (
          <div className={`ballot__owned-card ${ballot.open ? "ballot__open":"ballot__closed"}`} key={ballot.id}>
            <BallotCard name={ballot.name} id={ballot.id} key={ballot.id} />
            <div className="ballot__options">
            {ballot.open ? 
            <>
              {ballot.live && <div className="get-results" onClick={(e) => {
                e.preventDefault()
                getResults(ballot.id)
              }}>
                Get Results
              </div>}
              <div className="close-section" onClick={(e) => {
                e.preventDefault()
                closeBallot(ballot.id)}}
              >
                Close
              </div>
              <div className="add-voters" onClick={(e) => {
                e.preventDefault()
                addVotersModal(ballot.id, ballot.doubleFactor, ballot)
              }}>
                Add Voters +
              </div>
              
            </>
            : 
            <div className="get-results" onClick={(e) => {
              e.preventDefault()
              getResults(ballot.id)
            }}>
              Get Results
            </div>
            }
            </div> 
          </div>
        ))}

      </div>
      <Modal show={voteModal} onHide={hideVoteModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Enter ballot passcode for ballot id: {selectedBallotId}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div
            className="input"
          >
            <input
              className="input__field"
              name="ballotPass"
              type="text"
              placeholder="Ballot Passcode"
              onChange={(e) => {
                setPasscode(e.target.value);
              }}
              value={passcode}
            />
            <div className="cut"></div>
            <label className="input__label">Ballot Passcode</label>
          </div>
          {showIncorrect && <label>Incorrect Password or Id</label>}
        </Modal.Body>
        <Modal.Footer>
          <input type="submit" value="Vote!" onClick={(e) => {
              e.preventDefault()
              handleGotoVote(selectedBallotId, passcode)
            }}
          />
        </Modal.Footer>
      </Modal>
            <Modal show={resultModal} onHide={hideResultModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Enter ballot passcode for ballot id: {selectedBallotId}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div
            className="input"
          >
            <input
              className="input__field"
              name="ballotPass"
              type="text"
              placeholder="Ballot Passcode"
              onChange={(e) => {
                setPasscode(e.target.value);
              }}
              value={passcode}
            />
            <div className="cut"></div>
            <label className="input__label">Ballot Passcode</label>
          </div>
          {showIncorrect && <label>Incorrect Password or Id</label>}
        </Modal.Body>
        <Modal.Footer>
          <input type="submit" value="Get Results!" onClick={(e) => {
              e.preventDefault()
              handleGotoResultSpecific(selectedBallotId, passcode)
            }}
          />
        </Modal.Footer>
      </Modal>
      <Modal show={addModal} onHide={closeAddModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Add Voters
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isDfaAdd && 
            <SingleAddVoter 
              voterChangeFunc={handleVoterChange} 
              closeFunc={closeAddModal}
              voters={voters}
              currVoter={currVoter}
              passcode={givenPass}
              addSingleClickFunc={addVoterSecure}
              voterAdded={voterAdded}
            />
          }
          {!isDfaAdd && 
            <MultiAddBody
              voterChangeFunc={handleVoterChange}
              voters={voters}
              currVoter={currVoter}
              removeVoter={removeVoter}
              addSingleClickFunc={addVoterFunc}
              keyDownFunc={onKeyDownMulti}
            />
          }
        </Modal.Body>
        <Modal.Footer>
          {error && <div className="error-container">{error}</div>}
          {!isDfaAdd && <input type="submit" value="Add Voters" onClick={(e) => {
              e.preventDefault()
              addVoters(selectedBallotId, userValues.postgresId)
            }}
            disabled={voters.length === 0}
          />}
          {isDfaAdd && <div className="dfa-close" onClick={closeAddModal}>Close</div>}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Account;
