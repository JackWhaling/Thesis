import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useContext } from "react";
import { UrlObject } from "url";
import { userContext, UserContextType } from "../context/userState";

const Home: NextPage = () => {
  const { userValues, setUserValues } = useContext(
    userContext
  ) as UserContextType;
  const router = useRouter();

  const clickPush = (e: React.MouseEvent<HTMLButtonElement>) => {
    router.push((e.target as HTMLInputElement).value);
  };

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
            <button className="main-button button">Vote</button>
            <button className="sub-button button">My Ballots</button>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
