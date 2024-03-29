import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { auth } from "../services/firebase";
import { userContext, UserContextType } from "../context/userState";
import { Modal } from "react-bootstrap";
import { getRecord } from "../services/axios";
import axios from "axios";
import { ballotContext, BallotContextType } from "../context/ballotState";

const DEFAULT_VOTE_STATE = {
  ballotId: "",
  ballotPass: "",
}

const Home: NextPage = () => {
  const { userValues, setUserValues } = useContext(
    userContext
  ) as UserContextType;
  const { ballotValues, setBallotValues } = useContext(ballotContext) as BallotContextType;
  const router = useRouter();
  const [voteModal, setVoteModal] = useState<boolean>(false)
  const [voteState, setVoteState] = useState<any>(DEFAULT_VOTE_STATE)
  const [showIncorrect, setIncorrect] = useState<boolean>(false)
  const [showNotAllowed, setNotAllowed] = useState<boolean>(false)

  const clickPush = (e: React.MouseEvent<HTMLButtonElement>) => {
    router.push((e.target as HTMLInputElement).value);
  };

  const handleChange = (e: any) => {
    setVoteState((prevState: any) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const showVoteModal = () => {
    setVoteModal(true)
  }

  const hideVoteModal = () => {
    setVoteModal(false)
  }

  const handleGotoVote = async (e: any) => {
    e.preventDefault();
    setNotAllowed(false)
    const config = {
      headers: {
        passcode: voteState.ballotPass,
        Authorization: "Bearer " + await auth.currentUser?.getIdToken(),
      }
    }
    const uriPath = `polls/details/${voteState.ballotId}`
    const res = await getRecord(uriPath, config);
    if (res.status == 401 || res.status == 408) {
      setNotAllowed(true)
      return
    }
    if (res.status != 200) {
      setIncorrect(true)
      return
    }
    setIncorrect(false)
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
      ballotId: voteState.ballotId,
    })
  }

  useEffect(() => {
    if (ballotValues.ballotId != "") {
      router.push(`/ballot/${ballotValues.ballotId}`)
    }
  }, [ballotValues])

  useEffect(() => {
    console.log(userValues)
  }, [userValues.id])

  return (
    <div className="container">
      <div className="home-page">
        {userValues.id === "" ? (
          <>
            <button
              className="main-button button"
              value="/login"
              onClick={(e) => clickPush(e)}
            >
              Login
            </button>
            <button
              className="sub-button button"
              value="/signup"
              onClick={(e) => clickPush(e)}
            >
              Sign Up
            </button>
            <button className="sub-button button" value="/ballot/raw" onClick={(e) => clickPush(e)}>Enter Raw Ballot</button>
          </>
        ) : (
          <>
            <button
              className="sub-button button"
              value="/ballot/create"
              onClick={(e) => clickPush(e)}
            >
              Create Ballot
            </button>
            <button className="main-button button" onClick={showVoteModal}>Vote</button>
            <button className="sub-button button" value="/account" onClick={(e) => clickPush(e)}>My Ballots</button>
            <button className="sub-button button" value="/ballot/raw" onClick={(e) => clickPush(e)}>Enter Raw Ballot</button>
          </>
        )}
      </div>
      <Modal show={voteModal} onHide={hideVoteModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Enter ballot id and passcode
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div
            className="input"
          >
            <input
              className="input__field"
              name="ballotId"
              type="text"
              placeholder="Ballot Id"
              onChange={(e) => {
                handleChange(e);
              }}
              value={voteState?.ballotId}
            />
            <div className="cut"></div>
            <label className="input__label">Ballot id</label>
          </div>
          <div
            className="input"
          >
            <input
              className="input__field"
              name="ballotPass"
              type="text"
              placeholder="Ballot Passcode"
              onChange={(e) => {
                handleChange(e);
              }}
              value={voteState?.ballotPass}
            />
            <div className="cut cut-xl"></div>
            <label className="input__label">Ballot Passcode</label>
          </div>
          {showIncorrect && <label>Incorrect Password or Id</label>}
          {showNotAllowed &&<label>{"You haven't been invited to vote in this ballot"}</label>}
        </Modal.Body>
        <Modal.Footer>
          <input type="submit" value="Vote!" onClick={(e) => {handleGotoVote(e)}}/>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Home;
