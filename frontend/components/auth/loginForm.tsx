import React from "react";
import { useRouter } from "next/router";
import { useState, useContext } from "react";
import { IUser, userContext, UserContextType } from "../../context/userState";
import app, { auth } from "../../services/firebase";
import { getRecord, postRecord } from "../../services/axios";
import { IBallots } from "../../context/userState";

const LoginForm = () => {
  const router = useRouter();
  const { userValues, setUserValues } = useContext(
    userContext
  ) as UserContextType;
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: any) => {
    setUserValues((prevState: IUser | any) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const validationCheck = () => {
    if (password == "" || userValues === null || userValues.email == "") {
      setError("missingFields");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (validationCheck()) {
      try {
        if (userValues === null) {
          setError("invalidCreds");
          return;
        }
        await auth.signInWithEmailAndPassword(userValues.email, password);
        const user = auth.currentUser;
        const userID = user?.uid;
        const uriPath = `users/${userID}`;
        const userDetails = await getRecord(uriPath);
        const userData = userDetails.data;
        let ownedBallots: IBallots[] = []
        let userBallots: IBallots[] = []
        userData.userBallots.forEach((ballot: any) => {
          var newBallot: IBallots = {id: "", name: "", open: false}
          newBallot.name = ballot.ballotName
          newBallot.id = ballot.ballotId
          newBallot.open = !ballot.closed
          userBallots.push(newBallot)
        })

        userData.ownedBallots.forEach((ballot: any) => {
          var newBallot: IBallots = {id: "", name: "", open: false}
          newBallot.name = ballot.ballotName
          newBallot.id = ballot.ballotId
          newBallot.open = !ballot.closed
          ownedBallots.push(newBallot)
        })
        setUserValues((prevState: IUser | any) => ({
          ...prevState,
          id: userID,
          postgresId: userData.postId,
          ballots: userBallots,
          ownedBallots: ownedBallots,
        }));
        router.push("/");
      } catch (err) {
        setError("invalidCreds");
      }
    }
  };
  return (
    <form onSubmit={handleSubmit}>
      <div className="inner-form">
        <div
          className={
            userValues?.email == "" ? "input" : "input input--has-value"
          }
        >
          <input
            className="input__field"
            name="email"
            type="email"
            placeholder="email"
            onChange={(e) => {
              handleChange(e);
            }}
            value={userValues?.email}
          />
          <label className="input__label">Email</label>
        </div>
        <div
          className={
            password == ""
              ? "input password-input"
              : "input input--has-value password-input"
          }
        >
          <input
            className="input__field"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="password"
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            value={password}
          />
          <label className="input__label">Password</label>
          {/* {showPassword ? (
            <ViewIcon
              onClick={() => {
                setShowPassword(false);
              }}
            />
          ) : (
            <ViewOffIcon
              onClick={() => {
                setShowPassword(true);
              }}
            />
          )} */}
        </div>
        {error == "missingFields" && <p className="error">Missing fields</p>}
        {error == "invalidCreds" && (
          <p className="error">Incorrect Email or Password</p>
        )}
        <input type="submit" value="Login" className="submit-button" />
      </div>
    </form>
  );
};

export default LoginForm;
