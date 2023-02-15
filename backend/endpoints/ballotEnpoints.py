from random import randint
from operator import itemgetter
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
import psycopg2.extras
from helpers import toJsonResponse
from dotenv import load_dotenv
from supabase import Client

load_dotenv()

def createBallot(superdb: Client, ballotInfo: BallotCreate, userId):
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
  createdBallotData = superdb.table("ballot").insert({
    "ballot_name": name, 
    "live_results": live,
    "ballot_owner": userId, 
    "candidates": candidateList, 
    "double_factor": inviteMethod, 
    "passcode": hashedp,
    "voting_rule": rule,
    "voting_method": votingType,
    "committee_size": numWinners
  }).execute()
  if (len(createdBallotData.data) > 0):
    return toJsonResponse(201, {"ballotId": createdBallotData.data[0]["id"], "passcode": randomPass})
  return toJsonResponse(409, {})

def getBallotInfo(superdb: Client, ballotId, passcode, skipCheck: bool = False):
  ballotData = superdb.table("ballot").select("double_factor, ballot_name, voting_method, live_results, ballot_owner, candidates, closed, \
      committee_size, elected_committee, passcode, voting_rule").eq("id", ballotId).execute()
  if (len(ballotData.data) <= 0):
    return toJsonResponse(409, {})
  ballotObject = ballotData.data[0]
  (doubleFactor, ballotName, votingMethod, liveRes, ownerId, candidates, close, size, elected, ballotPass, votingRule) = itemgetter("double_factor", "ballot_name",
  "voting_method", "live_results", "ballot_owner", "candidates", "closed",
  "committee_size", "elected_committee", "passcode", "voting_rule")(ballotObject)
  mySalt = os.getenv('SOME_SALT').encode('utf-8')
  passcode = (passcode).encode('utf-8')
  hashedp = bcrypt.hashpw(passcode, mySalt)
  hashedp = hashedp.decode('utf-8')
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
      "elected": elected,
      "rule": votingRule,
    }
    return toJsonResponse(200, responseBody)

def getBallotSecure(superdb: Client, ballotId, givenPasscode):
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

def castVote(superdb: Client, voteUpdate: BallotVote, user):
  userId = user
  ballotId = voteUpdate.ballotId
  ballot = voteUpdate.ballot
  ballotCheckData = superdb.table("ballot").select("candidates, closed").eq("id", ballotId).execute()
  if (len(ballotCheckData.data) <= 0):
    return toJsonResponse(409, {})
  (candidates, closed) = itemgetter("candidates", "closed")(ballotCheckData.data[0])
  if (sorted(list(ballot.keys())) != sorted(candidates)):
    return toJsonResponse(403, {"error": "incorrect candidates given"})
  if (closed):
    return toJsonResponse(403, {"error": "voting is closed"})
  voteCheckData = superdb.table("vote").select("vote_object_string, passcode").eq("voter_id", userId).eq("ballot_id", ballotId).execute()
  if (len(voteCheckData.data) <= 0):
    return toJsonResponse(403, {"error": "you don't have permission to vote"})
  (voteString, passcode) = itemgetter("vote_object_string", "passcode")(voteCheckData.data[0])
  if (voteString != None):
    return toJsonResponse(405, {"error": "voted"})
  if (passcode != None):
    return toJsonResponse(406, {"error": "double factor required"})
  newVoteString = json.dumps(ballot)
  updateData = updateVoteHelper(superdb, userId, ballotId, newVoteString)
  if (len(updateData) <= 0):
    return toJsonResponse(409, {})
  return toJsonResponse(200, {})

def updateVote(superdb: Client, voteUpdate: BallotVote, user):
  userId = user
  ballotId = voteUpdate.ballotId
  ballot = voteUpdate.ballot
  ballotCheckData = superdb.table("ballot").select("candidates, closed").eq("id", ballotId).execute()
  if (len(ballotCheckData.data) <= 0):
    return toJsonResponse(409, {})
  (candidates, closed) = itemgetter("candidates", "closed")(ballotCheckData.data[0])
  if (sorted(list(ballot.keys())) != sorted(candidates)):
    return toJsonResponse(403, {"error": "incorrect candidates given"})
  if (closed):
    return toJsonResponse(403, {"error": "voting is closed"})
  voteCheckData = superdb.table("vote").select("vote_object_string, passcode").eq("voter_id", userId).eq("ballot_id", ballotId).execute()
  if (len(voteCheckData.data) <= 0):
    return toJsonResponse(403, {"error": "you don't have permission to vote"})
  (voteString, passcode) = itemgetter("vote_object_string", "passcode")(voteCheckData.data[0])
  if (voteString == None):
    return toJsonResponse(405, {"error": "you cannot update a vote if you haven't voted yet"})
  if (passcode != None):
    return toJsonResponse(406, {"error": "double factor required"})
  newVoteString = json.dumps(ballot)
  updateData = updateVoteHelper(superdb, userId, ballotId, newVoteString)
  if (len(updateData) <= 0):
    return toJsonResponse(409, {})
  return toJsonResponse(200, {})

def updateVoteHelper(superdb: Client, userId, ballotId, voteString):
  updateData = superdb.table("vote").update({"vote_object_string": voteString}).eq("voter_id", userId).eq("ballot_id", ballotId).execute()
  return updateData.data

def addVoteSecure(superdb: Client, voteUpdate: BallotVote):

  return toJsonResponse(200, {})

def addVoterToBallot(superdb: Client, ballotOwnerId, toAddList, ballotId):
  ballotInfo = superdb.table("ballot").select("ballot_owner, closed").eq("id", ballotId).execute()
  if (len(ballotInfo.data) <= 0):
    return toJsonResponse(409, {})
  (ballotOwner, isClosed) = itemgetter("ballot_owner", "closed")(ballotInfo.data[0])
  print(ballotOwner)
  print(ballotOwnerId)
  if (ballotOwner == ballotOwnerId and not isClosed):
    data = []
    for userId in toAddList:
      data.append({"ballot_id": ballotId, "voter_id": userId})
    addedData = superdb.table("vote").upsert(data).execute()
    if (len(addedData.data) <= 0):
      return toJsonResponse(401, {"error": "something went wrong adding voters"})
    return toJsonResponse(201, {})
  else:
    return toJsonResponse(401, {"error": "cannot add people to this ballot"})

def closeBallot(superdb: Client, ballotId, userId):
    ballotData = superdb.table("ballot").update({"closed": True}).eq("ballot_owner", userId).eq("id", ballotId).execute()
    if (len(ballotData.data) <= 0):
      return toJsonResponse(409, {})
    return toJsonResponse(201, {})