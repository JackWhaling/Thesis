import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { UrlObject } from "url";
import { userContext, UserContextType } from "../context/userState";
import { Modal } from "react-bootstrap";
import { getRecord } from "../services/axios";
import axios from "axios";

const DEFAULT_VOTE_STATE = {
  ballotId: "",
  ballotPass: "",
}

const Home: NextPage = () => {
  const { userValues, setUserValues } = useContext(
    userContext
  ) as UserContextType;
  const router = useRouter();
  const [voteModal, setVoteModal] = useState<boolean>(false)
  const [voteState, setVoteState] = useState<any>(DEFAULT_VOTE_STATE)
  const [showIncorrect, setIncorrect] = useState<boolean>(false)

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
    console.log("hello")
    const config = {
      headers: {
        passcode: voteState.ballotPass,
      }
    }
    console.log(config)
    const uriPath = `polls/details/${voteState.ballotId}`
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
      ballotId: voteState.ballotId,
    }
    router.push({pathname: `/ballot/${voteState.ballotId}`, query: passQuery}, `/ballot/${voteState.ballotId}`)
  }

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
        </Modal.Body>
        <Modal.Footer>
          <input type="submit" value="Vote!" onClick={(e) => {handleGotoVote(e)}}/>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Home;
