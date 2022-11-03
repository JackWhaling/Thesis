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

def getUserElections(fbdb, postgresdb, email):
  return
