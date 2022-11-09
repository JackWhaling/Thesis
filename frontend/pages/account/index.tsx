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
  const [passcode, setPasscode] = useState<string>("")
  const [selectedBallotId, setSelectedBallotId] = useState<string>("")

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

  const hideVoteModal = () => {
    setVoteModal(false)
    setSelectedBallotId("")
  }


  const handleGotoVote = async (id: string, passcode: string) => {
    const config = {
      headers: {
        passcode: passcode,
      }
    }
    console.log(config)
    const uriPath = `polls/details/${id}`
    const res = await getRecord(uriPath, config);
    console.log(res)
    if (res.status == 403) {
      setIncorrect(true)
      return
    }
    setIncorrect(false)
    hideVoteModal();
    console.log(res)
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

  return (
    <div className="page-container">
      <div className="account-header">
        <h2 className="account-header__username">{userValues.username}</h2>
        <h3 className="account-header__email">{userValues.email}</h3>
      </div>
      <div className="ballot-lists__open">
        {openBallots.length === 0 ? (
          <div className="ballot-list__none">You have no open ballots</div>
        ) : (
          <div className="open-ballot-container">
            <h4>Your Open Ballots:</h4>
            {openBallots.map((ballot: IBallots) => {
              console.log(ballot)
              return (
              <div className="ballot__card" key={ballot.id} onClick={(e) => showVoteModal(ballot.id)}>
                <BallotCard name={ballot.name} id={ballot.id} key={ballot.id} />
              </div>
            )}
            )}
          </div>
        )
        }
      </div>
      <div className="ballot-lists__closed">
        {closedBallots.length === 0 ? (
          <div className="ballot-list__none">You have no closed ballots</div>
        ) : (
          closedBallots.map((ballot) => (
            <div className="ballot__card" key={ballot.id} onClick={(e) => showVoteModal(ballot.id)}>
              <BallotCard name={ballot.name} id={ballot.id} key={ballot.id} />
            </div>
          ))
        )}
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
    </div>
  );
};

export default Account;
