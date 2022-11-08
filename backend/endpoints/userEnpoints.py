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
  ballotSqlStr =  "SELECT ballot_name, ballot_id, closed FROM voteschema.vote JOIN voteschema.ballot ON \
(voteschema.vote.ballot_id = voteschema.ballot.id) WHERE voteschema.vote.voter_id = %s"
  ownedBallots = []
  userPostgresId = "SELECT id FROM voteschema.voter WHERE fb_key = %s"
  try: 
    cur.execute(ballotSqlStr, (id, ))
    record = cur.fetchall()
    for row in record:
      (ballotName, ballotId, closed) = row
      userBallots.append({"ballotId": ballotId, "ballotName": ballotName, "closed": closed})
  except Exception as error:
    print(error)
    cur.close()
    return toJsonResponse(409, {})
  ownedBallotsSqlStr = "SELECT ballot_name, id, closed FROM voteschema.ballot WHERE ballot_owner = %s"
  try: 
    cur.execute(userPostgresId, (id, ))
    record = cur.fetchone()[0]
    (userId) = record
    cur.execute(ownedBallotsSqlStr, (userId,))
    record = cur.fetchall()
    for row in record:
      (ballotName, ballotId, closed) = row
      ownedBallots.append({"ballotId": ballotId, "ballotName": ballotName, "closed": closed})
  except Exception as error:
    print(error)
    cur.close()
    return toJsonResponse(409, {})
  cur.close()
  return toJsonResponse(200, {"userBallots": userBallots, "ownedBallots": ownedBallots, "postId": userId})