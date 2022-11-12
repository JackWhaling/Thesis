from random import randint
from fastapi import status, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import auth
from firebase_admin import exceptions
from models import BallotCreate, BallotVote, BallotBaseInfo
import json
import bcrypt
import os
import psycopg2
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
  randomPass = ''.join(["{}".format(randint(0,9)) for _ in range(0, 6)])
  passcode = (randomPass).encode('utf-8')
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
    return toJsonResponse(201, {"ballotId": record, "passcode": randomPass})
  except Exception as error:
    print(error)
    cur.close()
    return toJsonResponse(409, {})

def getBallotInfo(postgresdb, ballotId, passcode, skipCheck: bool = False):
  sqlStr = "SELECT double_factor, ballot_name, voting_method, live_results, ballot_owner, candidates, closed, \
      committee_size, elected_committee, passcode FROM voteschema.ballot WHERE id = %s"
  cur = postgresdb.cursor()
  print("hello")
  try:
    cur.execute(
      sqlStr, (ballotId,)
    )
    (doubleFactor, ballotName, votingMethod, liveRes, ownerId, candidates, close, size, elected, ballotPass) = cur.fetchone()
    cur.close()
    print("nononono")
    mySalt = os.getenv('SOME_SALT').encode('utf-8')
    passcode = (passcode).encode('utf-8')
    hashedp = bcrypt.hashpw(passcode, mySalt)
    hashedp = hashedp.decode('utf-8')
    print("hello")

    if (hashedp != ballotPass):
      return toJsonResponse(403, {"error": "Wrong Passcode"})
    if (doubleFactor and not skipCheck):
      return toJsonResponse(203, {"dfa": True})
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
    print(votingMethod)
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

def closeBallot(postgresdb, ballotInfo: BallotBaseInfo):
  sqlGetBallotInfoStr = "SELECT ballot_owner, closed FROM voteschema.ballot WHERE id = %s"
  cur = postgresdb.cursor()
  try:
    cur.execute(
      sqlGetBallotInfoStr, (ballotInfo.ballotId,)
    )
    (ballotOwner, isClosed) = cur.fetchone()
    if (ballotOwner == ballotInfo.userToken and not isClosed):
      sqlUpdateStr = "UPDATE voteschema.ballot SET closed = 1 WHERE id = %s"
      cur.execute(
        sqlUpdateStr, (ballotInfo.ballotId,)
      )
      cur.close()
      return toJsonResponse(201, {})
    else:
      cur.close()
      return toJsonResponse(401, {})
  except Exception as error:
    print(error)
    cur.close()
    return toJsonResponse(409, {})

def castVote(postgresdb, voteUpdate: BallotVote):
  userId = voteUpdate.userToken
  ballotId = voteUpdate.ballotId
  ballot = voteUpdate.ballot

  sqlBallotCheck = "SELECT candidates, closed FROM voteschema.ballot WHERE id = %s"
  cur = postgresdb.cursor()
  try:
    cur.execute(sqlBallotCheck, (ballotId, ))
    record = cur.fetchone()
    (candidates, closed) = record
    if (sorted(list(ballot.keys())) != sorted(candidates)):
      cur.close()
      return toJsonResponse(404, {})
    if (closed):
      cur.close()
      return toJsonResponse(403, {})
    sqlVoteCheck = "SELECT vote_string, passcode FROM voteschema.vote WHERE voter_id = %s AND ballot_id = %s"
    cur.execute(sqlVoteCheck, (userId, ballotId))
    record = cur.fetchone()
    (voteString, passcode) = record
    if (voteString != None):
      return toJsonResponse(403, {})
    if (passcode != None):
      return toJsonResponse(403, {})
    sqlAddVote = "UPDATE voteschema.vote SET vote_string = %s WHERE voter_id = %s AND ballot_id = %s RETURNING voter_id"
    newVoteString = json.dumps(ballot)
    cur.execute(sqlAddVote, (newVoteString, userId, ballotId))
    postgresdb.commit()
    cur.close()
    return toJsonResponse(200, {})
  except Exception as error:
    print(error)
    cur.close()
    return toJsonResponse(409, {})

def updateVote(postgresdb, voteUpdate: BallotVote):
  userId = voteUpdate.userToken
  ballotId = voteUpdate.ballotId
  ballot = voteUpdate.ballot
  sqlBallotCheck = "SELECT candidates, closed FROM voteschema.ballot WHERE id = %s"
  cur = postgresdb.cursor()
  try:
    cur.execute(sqlBallotCheck, (ballotId,))
    record = cur.fetchone()
    (candidates, closed) = record
    if (sorted(list(ballot.keys())) != sorted(candidates)):
      cur.close()
      return toJsonResponse(404, {})
    if (closed):
      cur.close()
      return toJsonResponse(403, {})
    sqlVoteCheck = "SELECT vote_string, passcode FROM voteschema.vote WHERE voter_id = %s AND ballot_id = %s"
    cur.execute(sqlVoteCheck, (userId, ballotId))
    record = cur.fetchone()
    (voteString, passcode) = record
    if (voteString == None):
      return toJsonResponse(403, {})
    if (passcode != None):
      return toJsonResponse(403, {})
    sqlAddVote = "UPDATE voteschema.vote SET vote_string = %s WHERE voter_id = %s AND ballot_id = %s RETURNING voter_id"
    newVoteString = json.dumps(ballot)
    cur.execute(sqlAddVote, (newVoteString, userId, ballotId))
    postgresdb.commit()
    cur.close()
    return toJsonResponse(200, {})
  except Exception as error:
    print(error)
    cur.close()
    return toJsonResponse(409, {})

def addVoteSecure(postgresdb, voteUpdate: BallotVote):

  return toJsonResponse(200, {})

def addVoterToBallot(postgresdb, ballotOwnerId, toAddList, ballotId):
  sqlCheck = "SELECT ballot_owner, closed FROM voteschema.ballot WHERE id = %s"
  cur = postgresdb.cursor()
  try:
    cur.execute(sqlCheck, (ballotId,))
    (ballotOwner, isClosed) = cur.fetchone()
    if (ballotOwner == ballotOwnerId and not isClosed):
      data = []
      for userId in toAddList:
        data.append((ballotId, userId))
      sqlAddVoter = "INSERT INTO voteschema.vote (ballot_id, voter_id) VALUES %s"
      
      try: 
        psycopg2.extras.execute_values(
          cur, sqlAddVoter, data, template=None, page_size=100 
        )
        cur.close()
        return toJsonResponse(201, {})
      except Exception as error:
        print(error)
        cur.close()
        return toJsonResponse(403, {})
    else:
      return toJsonResponse(401, {})
  except Exception as error:
    print(error)
    cur.close()
    return toJsonResponse(409, {})