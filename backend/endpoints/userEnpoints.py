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
from supabase import Client
from operator import itemgetter

def createUserEntry(superdb: Client, userInfo: CreateVoter):
  userEmail = userInfo.email
  userId = userInfo.userId
  print("helo")
  data = superdb.table("voter").insert({"email": userEmail, "fb_key": userId}).execute()
  if (len(data.data) > 0):
    return toJsonResponse(201, {"userId": data.data[0]["id"]})
  return toJsonResponse(409, {})


def getUserEntry(superdb: Client, id):
  userBallots = []
  ownedBallots = []
  print("here")
  userBaseData = superdb.table("voter").select("email, id").eq("fb_key", id).execute()
  if (len(userBaseData.data) <= 0):
    return toJsonResponse(409, {})
  databaseId = userBaseData.data[0]["id"]
  ownedBallotData = superdb.table("ballot").select("ballot_name, id, closed, live_results").eq("ballot_owner", id).execute()
  for ballot in ownedBallotData.data:
    print(ballot)
    (ballotId, ballotName, closed, live) = itemgetter("id", "ballot_name", "closed", "live_results")(ballot)
    ownedBallots.append({"ballotId": ballotId, "ballotName": ballotName, "closed": closed, "live": live})
  ballotsData = superdb.table("vote").select("ballot_id, ballot (id, ballot_name, closed, live_results, double_factor)").eq("voter_id", id).execute()
  for ballot in ballotsData.data:
    (ballotId, ballotName, closed, live) = itemgetter("id", "ballot_name", "closed", "live_results")(ballot["ballot"])
    userBallots.append({"ballotId": ballotId, "ballotName": ballotName, "closed": closed, "live": live})
  return toJsonResponse(200, {"userBallots": userBallots, "ownedBallots": ownedBallots, "postId": databaseId})