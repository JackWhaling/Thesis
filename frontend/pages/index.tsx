import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";

const Home: NextPage = () => {
  return (
    <div className="container">
      <div className="home-page">
        <button className="sub-button button">Create Ballot</button>
        <button className="main-button button">Vote</button>
        <button className="sub-button button">My Ballots</button>
      </div>
    </div>
  );
};

export default Home;
