import React from "react";
import { useContext, useState } from "react";
import { userContext, UserContextType, IUser, IBallots } from "../../context/userState";
import Select, { components } from 'react-select';
import { getRecord, postRecord } from "../../services/axios";
import app, { auth } from "../../services/firebase";
import { useRouter } from "next/router";

const SignupForm = () => {
  const router = useRouter();
  const { userValues, setUserValues } = useContext(userContext) as UserContextType;
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [stateClicked, setStateClicked] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e:any) => {
    setUserValues((prevState: IUser | any) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const validationCheck = () => {
    const emailRegex = new RegExp(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)

    if (
      userValues.email == "" ||
      password == ""
    ) {
      setError("missingFields");
      return false;
    }

    if (!emailRegex.test(userValues.email)) {
      setError("invalidEmail")
      return false
    }   
    return true;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (validationCheck()) {
      try {

        // const userData = res.data;
        auth.createUserWithEmailAndPassword(userValues.email, password).then(async (user) => {
          setUserValues((prevState: IUser | any) => ({
            ...prevState,
            id: user.user?.uid
          }));
          const postData = {
            email: userValues.email,
            userId: user.user?.uid,
          };
          const uriValue = "users/create";
          const res = await postRecord(uriValue, postData);

          let ownedBallots: IBallots[] = []
          let userBallots: IBallots[] = []
          console.log("hello", res)
          setUserValues((prevState: IUser | any) => ({
            ...prevState,
            postgresId: res.data.userId,
            ballots: userBallots,
            ownedBallots: ownedBallots,
          }));
          router.push("/");
        }).catch((err) => {
          setError("somethingWrong")
        })
        // if (userData.status == "success") {
        //   setUserValues((prevState) => ({
        //     ...prevState,
        //     userId: userData.uid,
        //   }));
        //   router.push("/");
        // }
        // if (userData.status == "failed_userExists") {
        //   setError("userExists");
        // } else {
        //   setError("somethingWrong");
        // }
      } catch (err) {
        setError("somethingWrong");
      }
    } else {
      return;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="inner-form">
        <h2>Create Account</h2>
        <div
          className={
            userValues.email == "" ? "input" : "input input--has-value"
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
            value={userValues.email}
          />
          <div className="cut cut-short"></div>
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
          <div className="cut"></div>
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
        {error == "missingFields" && (
          <p className="error">{`You're missing some fields`}</p>
        )}
        {error == "invalidAge" && <p className="error">Invalid age input</p>}
        {error == "somethingWrong" && (
          <p className="error">Something went wrong!</p>
        )}
        {error == "userExists" && (
          <p className="error">Email is already being used, use another!</p>
        )}
        <input type="submit" value="Create Account" className="submit-button" />
      </div>
    </form>
  )
}

export default SignupForm