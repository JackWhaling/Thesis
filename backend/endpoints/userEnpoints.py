from fastapi import status, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import auth
from firebase_admin import exceptions
from models import CreateVoter
from pydantic import BaseModel
import psycopg2
import os
from helpers import toJsonResponse

def createUserEntry(fbdb, postgresdb, userInfo: CreateVoter):
  userEmail = userInfo.email
  userId = userInfo.userId

  cur = postgresdb.cursor()
  sqlStr = "INSERT INTO voteschema.voter (fb_key, email) VALUES (%s, %s) RETURNING id"

  try:
    cur.execute(sqlStr, (userId, userEmail))
    postgresdb.commit()
    record = cur.fetchone()[0]
    if (record == None):
      cur.close()
      return toJsonResponse(409, {})
    cur.close()
    return toJsonResponse(201, {"userId": record})
  except:
    cur.close()
    return toJsonResponse(409, {})

def getUserEntry(fbdb, postgresdb, id):
  cur = postgresdb.cursor()
  userBallots = []
  ballotSqlStr =  "SELECT ballot_name, ballot_id, closed, live_results FROM voteschema.voteTable JOIN voteschema.ballot ON \
(voteschema.voteTable.ballot_id = voteschema.ballot.id) WHERE voteschema.voteTable.voter_id = %s"
  ownedBallots = []
  userPostgresId = "SELECT id, email FROM voteschema.voter WHERE fb_key = %s"
  ownedBallotsSqlStr = "SELECT ballot_name, id, closed, live_results FROM voteschema.ballot WHERE ballot_owner = %s"
  try:
    cur.execute(userPostgresId, (id, ))
    record = cur.fetchone()
    (userId, email) = record
    cur.execute(ownedBallotsSqlStr, (userId,))
    record = cur.fetchall()
    for row in record:
      (ballotName, ballotId, closed, live) = row
      ownedBallots.append({"ballotId": ballotId, "ballotName": ballotName, "closed": closed, "live": live})
  except Exception as error:
    print(error)
    cur.close()
    return toJsonResponse(409, {})
  try:
    cur.execute(ballotSqlStr, (email, ))
    record = cur.fetchall()
    for row in record:
      (ballotName, ballotId, closed, live) = row
      userBallots.append({"ballotId": ballotId, "ballotName": ballotName, "closed": closed, "live": live})
  except Exception as error:
    print(error)
    cur.close()
    return toJsonResponse(409, {})
  cur.close()
  return toJsonResponse(200, {"userBallots": userBallots, "ownedBallots": ownedBallots, "postId": userId})