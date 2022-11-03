from fastapi import status, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import auth
from firebase_admin import exceptions
from models import BallotCreate

import bcrypt
import os
from helpers import toJsonResponse
from dotenv import load_dotenv

load_dotenv()

def createBallot(pgdb, postgresdb, ballotInfo: BallotCreate):
  creatorId = ballotInfo.creatorId
  votingType = ballotInfo.ballotType
  name = ballotInfo.ballotName
  rule = ballotInfo.votingRule
  inviteMethod = ballotInfo.inviteMethod == "doubleFactor"
  live = ballotInfo.liveResult
  candidateList = ballotInfo.candidates
  numWinners = ballotInfo.numWinners
  passcode = (ballotInfo.passcode).encode('utf-8')
  mySalt = os.getenv('SOME_SALT').encode('utf-8')
  hashedp = bcrypt.hashpw(passcode, mySalt)
  hashedp = hashedp.decode('utf-8')
  cur = postgresdb.cursor()
  sqlStr = "INSERT INTO voteschema.ballot (ballot_name, \
      live_results, ballot_owner, candidates, voting_method, \
      voting_rule, committee_size, passcode, double_factor) \
      VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id"
  
  try:
    cur.execute(
      sqlStr, 
      (name, live, creatorId, candidateList, votingType, rule, numWinners, hashedp, inviteMethod)
    )
    postgresdb.commit()
    record = cur.fetchone()[0]
    if (record == None):
      cur.close()
      return toJsonResponse(409, {})
    cur.close()
    return toJsonResponse(201, {"ballotId": record})
  except Exception as error:
    print(error)
    cur.close()
    return toJsonResponse(409, {})

def getBallotInfo(postgresdb, ballotId, skipCheck: bool = False):
  sqlStr = "SELECT double_factor, ballot_name, voting_method, live_results, ballot_owner, candidates, closed, \
      committee_size, elected_committee FROM voteschema.ballot WHERE id = %s"
  cur = postgresdb.cursor()
  try:
    cur.execute(
      sqlStr, (ballotId)
    )
    (doubleFactor, ballotName, votingMethod, liveRes, ownerId, candidates, close, size, elected) = cur.fetchone()
    cur.close()
    if (doubleFactor and not skipCheck):
      toJsonResponse(203, {"dfa": True})
    else:
      print(ballotName)
      responseBody = {
        "ballotName": ballotName, 
        "votingMethod": votingMethod, 
        "liveResults": liveRes,
        "candidates": candidates,
        "owner": ownerId,
        "closed": close,
        "committeeSize": size,
        "elected": elected
      }
      return toJsonResponse(200, responseBody)
  except Exception as error:
    print(error)
    cur.close()
    return toJsonResponse(409, {})

def getBallotSecure(postgresdb, ballotId, givenPasscode):
  sqlStr = "SELECT ballot_name, voting_method, live_results, ballot_owner, candidates, closed, \
      committee_size, elected_committee, passcode FROM voteschema.ballot WHERE id = %s"
  cur = postgresdb.cursor()
  passcode = (givenPasscode).encode('utf-8')
  mySalt = os.getenv('SOME_SALT').encode('utf-8')
  hashedp = bcrypt.hashpw(passcode, mySalt)
  hashedp = hashedp.decode('utf-8')
  try:
    cur.execute(
      sqlStr, (ballotId)
    )
    (ballotName, votingMethod, liveRes, ownerId, candidates, close, size, elected, ballotPass) = cur.fetchone()
    cur.close()
    if (hashedp != ballotPass):
      return toJsonResponse(401, {"error": "invalid password"})
    else:
      responseBody = {
        "ballotName": ballotName, 
        "votingMethod": votingMethod, 
        "liveResults": liveRes,
        "candidates": candidates,
        "owner": ownerId,
        "closed": close,
        "committeeSize": size,
        "elected": elected
      }
      return toJsonResponse(200, responseBody)
  except Exception as error:
    print(error)
    cur.close()
    return toJsonResponse(409, {})