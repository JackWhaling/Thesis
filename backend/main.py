from fastapi import FastAPI, status, Request, Header, Depends, status, Response, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, auth
from firebase_admin import firestore
from pydantic import BaseModel
from typing import List, Dict
from dotenv import load_dotenv
import models
import time
from datetime import date, datetime
import psycopg2
import os
from endpoints import getResultsRaw, createUserEntry, createBallot, getBallotInfo, \
    getBallotSecure, getUserEntry, castVote, getBallotResults, addVoterToBallot, closeBallot \

load_dotenv()

security = HTTPBearer()

fbcred = firebase_admin.credentials.Certificate("./privatekey.json")
fbapp = firebase_admin.initialize_app(fbcred)

def get_user_token(res: Response, credential: HTTPAuthorizationCredentials=Depends(HTTPBearer(auto_error=False))):
    if fbcred is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer authentication is needed",
            headers={'WWW-Authenticate': 'Bearer realm="auth_required"'},
        )
    try:
        decoded_token = auth.verify_id_token(credential.credentials)
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication from Firebase. {err}",
            headers={'WWW-Authenticate': 'Bearer error="invalid_token"'},
        )
    res.headers['WWW-Authenticate'] = 'Bearer realm="auth_required"'
    return decoded_token['uid']

conn = psycopg2.connect(
    host=os.getenv('DB_HOST'),
    password=os.getenv('DB_PASSWORD'),
    port=os.getenv('DB_PORT'),
    user=os.getenv('DB_USER'),
    dbname=os.getenv('DB_DATABASE')
)

origins = ["*"]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def getApp():
    return app


# if getting results not wanted, check if database/firebase connection is ok. If these connections
# are working then we can deduce its 100% internal error
@app.get("/v1/alive", status_code=status.HTTP_200_OK)
def alive():
    crsr = conn.cursor()
    crsr.execute('SELECT version()')
    db_version = crsr.fetchone()
    aliveText = "connected to {}".format(db_version) if (db_version) else "error"
    crsr.close()
    firebaseText = "connected" if (fbapp) else "error"
    return {"database-check": aliveText, "firebase-check": firebaseText}


@app.post("/v1/users/create", status_code=status.HTTP_201_CREATED)
def createVoter(voterDetails: models.CreateVoter):
    return createUserEntry(fbdb=fbapp, postgresdb=conn, userInfo=voterDetails)


@app.get("/v1/users/{id}", status_code=status.HTTP_200_OK)
def getUserDetails(id):
    return getUserEntry(fbdb=fbapp, postgresdb=conn, id=id)


@app.post("/v1/polls/create", status_code=status.HTTP_201_CREATED)
def createPoll(BallotInfo: models.BallotCreate, user = Depends(get_user_token)):
    print(user)
    return createBallot(fbapp, conn, BallotInfo)


@app.get("/v1/polls/details/{id}", status_code=status.HTTP_200_OK)
def getPollDetails(id, request: Request):
    headerPass = str(request.headers.get("passcode"))
    return getBallotInfo(conn, id, headerPass)

@app.get("/v1/polls/details/secure/{id}", status_code=status.HTTP_200_OK)
def getSecureDeatils(id, passcode: str = "", dfpasscode: str = ""):
    print(passcode)
    return getBallotSecure(conn, id, passcode)

@app.get("/v1/results/ballot/{id}", status_code=status.HTTP_200_OK)
def getBallotRes(id, request: Request):
    print('hello')
    user = 3
    return getBallotResults(conn, id, user)

@app.put("/v1/polls/close", status_code=status.HTTP_201_CREATED)
def closePoll(BallotInfo: models.BallotBaseInfo):
    return closeBallot(conn, BallotInfo.ballotId, BallotInfo.userToken)

@app.post("/v1/results/election", status_code=status.HTTP_200_OK)
def definePoll(RawData: models.BallotRaw):
    return getResultsRaw(RawData)

# add authentication

@app.put("/v1/ballots/invite", status_code=status.HTTP_201_CREATED)
def addVoters(AddInfo: models.AddVoters):
    creatorId = AddInfo.creatorId
    votersToAdd = AddInfo.voters
    ballotId = AddInfo.ballotId
    return addVoterToBallot(conn, creatorId, votersToAdd, ballotId)

@app.post("/v1/ballots/votes/give", status_code=status.HTTP_200_OK)
def ballotVote(BasicVote: models.BallotVote, user = Depends(get_user_token)):
    return castVote(conn, BasicVote)

# add authentication


@app.put("/v1/ballots/update", status_code=status.HTTP_201_CREATED)
def updateBallot(UpdateVote: models.BallotVote):
    return {}

# logger (keeps track of API performance) Runs for each request of the api


@app.middleware("http")
async def Logger(request: Request, call_next):

    # Track which endpoint this log is for
    parts = str(request.url)
    parts = parts.split("/")[3:]
    endpoint = "/" + "/".join(parts)

    # Tracks reponse time of request
    startTime = time.time()
    response = await call_next(request)
    endTime = time.time()

    # Track time of request
    requestTime = str(datetime.now())
    processTime = str(round((endTime - startTime), 4)) + "s"

    # Track Status of request
    status = str(response.status_code)

    # Track method used
    method = request.method

    # Track user ip
    ip = str(request.client.host)
    # ip = ipToLocation(request.client.host)

    # Track request packet body size (bytes)
    size = response.headers["content-length"]

    # write to backend log file
    logFile = open("./log.txt", "a")
    logEntry = (
        endpoint
        + " ["
        + method
        + ", "
        + status
        + ", "
        + ip
        + ", "
        + requestTime
        + ", "
        + processTime
        + ", "
        + size
        + "B]\n"
    )
    logFile.write(logEntry)

    # Return log info to user
    response.headers["Name"] = "PropaVote"
    response.headers["Accessed-Time"] = requestTime
    return response
