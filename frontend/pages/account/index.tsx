import { NextPage } from "next";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from "react";
import Ballot from "../../components/ballot/ballot";
import BallotCard from "../../components/ballots/ballotCard";
import { IBallots, userContext, UserContextType } from "../../context/userState";
import { Modal } from "react-bootstrap";
import { getRecord } from "../../services/axios";

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

  const [showIncorrect, setIncorrect] = useState<boolean>(false)
  const [voteModal, setVoteModal] = useState<boolean>(false)
  const [addModal, setAddModal] = useState<boolean>(false)
  const [passcode, setPasscode] = useState<string>("")
  const [selectedBallotId, setSelectedBallotId] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [voters, setVoters] = useState<string[]>([])
  const [currVoter, setCurrVoter] = useState<string>("")

  const router = useRouter();

  const openBallots = userValues.ballots.filter(
    (ballot) => ballot.open === true
  );
  const closedBallots = userValues.ballots.filter(
    (ballot) => ballot.open !== true
  );

  useEffect(() => {
    console.log(userValues)

    if (userValues.id === "") {
      router.push("/");
    }
  }, []);

  const showVoteModal = (id: string) => {
    setVoteModal(true)
    setSelectedBallotId(id)
  }

  const hideVoteModal = () => {
    setVoteModal(false)
    setSelectedBallotId("")
  }

  const addVoter = (e: any) => {
    if (voters.includes(e.target.value)) {
      setError("Candidate already exists")
      setCurrVoter("")
      return
    }

    if (e.target.value == "") {
      setError("Cant have an empty candidate")
      return
    }
    setVoters((prevState: string[] | any) => [
      ...prevState,
      e.target.value,
    ]);
    setCurrVoter("");
  };

  const removeVoter = (voter: string) => {
    // @ts-ignore
    setVoters(voters?.filter((item) => item !== voter));
  };

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
    const passQuery = {
      name: res.data.ballotName,
      candidates: res.data.candidates,
      committeeSize: res.data.committeeSize,
      elected: res.data.elected,
      liveResults: res.data.liveResults,
      owner: res.data.owner,
      votingMethod: res.data.votingMethod,
      closed: res.data.closed,
      ballotId: id,
    }
    router.push({pathname: `/ballot/${id}`, query: passQuery}, `/ballot/${id}`)
  }

  const addVotersModal = (ballotId: any) => {
    setSelectedBallotId(ballotId)
    setAddModal(true)
  }

  const closeAddModal = () => {
    setAddModal(false)
  }

  
  const handleVoterChange = (e: any) => {
    setCurrVoter(e.target.value);
  };

  const addVoters = (ballotId: string, userId: any) => {
    console.log(ballotId)
  }

  const closeBallot = (ballotId: string, userId: any) => {
  }

  const getResults = (ballotId: string, userId: any) => {

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
                console.log(ballot)
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
          closedBallots.map((ballot) => (
            <div className="ballot__card" key={ballot.id} onClick={(e) => showVoteModal(ballot.id)}>
              <BallotCard name={ballot.name} id={ballot.id} key={ballot.id} />
            </div>
          ))
        )}
      </div>
      <div className="ballots-lists__owned">
        <h3 className="ballots-list__title">Owned Ballots</h3>
        {userValues.ownedBallots.map((ballot) => (
          <div className={`ballot__owned-card ${ballot.open ? "ballot__open":"ballot__closed"}`} key={ballot.id}>
            <BallotCard name={ballot.name} id={ballot.id} key={ballot.id} />
            {ballot.open ? 
            <div className="ballot__options">
              <div className="close-section" onClick={(e) => {
                e.preventDefault()
                closeBallot(ballot.id, userValues.postgresId)}}
              >
                Close
              </div>
              <div className="add-voters" onClick={(e) => {
                e.preventDefault()
                addVotersModal(ballot.id)
              }}>
                Add Voters +
              </div>
            </div> 
            : 
            <div className="get-results" onClick={(e) => {
              e.preventDefault()
              getResults(ballot.id, userValues.postgresId)
            }}>
              Get Results
            </div>
            }
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
      <Modal show={addModal} onHide={closeAddModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Add Voters
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="voters-list-input__container">
            <div className="input">
              <input
                className="input__field"
                name="candidate"
                type="text"
                placeholder="Add new candidate"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setError(null)
                    addVoter(e);
                  }
                }}
                onChange={(e) => {
                  handleVoterChange(e);
                }}
                value={currVoter}
              />
              <div className="cut cut-large"></div>
              <label className="input__label">Voter Email</label>
            </div>
            {voters.length > 0 && <div className="list-added-candidates">
              {voters?.map((voter) => (
                <div
                  className="added-cand__container"
                  key={voter}
                  onClick={(e) => removeVoter(voter)}
                >
                  <div className="added-cand__name">{voter}</div>
                  <div className="added-cand__remove">-</div>
                </div>
              ))}
            </div>}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <input type="submit" value="Add Voters" onClick={(e) => {
              e.preventDefault()
              addVoters(selectedBallotId, userValues.postgresId)
            }}
          />
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Account;
