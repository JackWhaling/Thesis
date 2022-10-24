from fastapi import FastAPI, status, Request
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from pydantic import BaseModel
from typing import List, Dict
from dotenv import load_dotenv
import time
from datetime import date, datetime
import psycopg2
import os

load_dotenv()

fbcred = firebase_admin.credentials.Certificate("./privatekey.json")
fbapp = firebase_admin.initialize_app(fbcred)

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
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class BallotCreate(BaseModel):
    ballotType: str
    inviteMethod: str
    votingRule: str
    liveResult: bool
    numWinners: int
    candidates: List[str]


class BallotBaseInfo(BaseModel):
    userToken: str
    ballotId: str

class CreateVoter(BaseModel):
    userId: str
    email: str

class BallotVote(BaseModel):
    userToken: str
    ballotId: str
    ballot: Dict[str, int]


def getApp():
    return app


#if getting results not wanted, check if database/firebase connection is ok. If these connections
# are working then we can deduce its 100% internal error
@app.get("/v1/alive", status_code=status.HTTP_200_OK)
def alive():
    crsr = conn.cursor()
    crsr.execute('SELECT version()')
    db_version = crsr.fetchone()
    aliveText = "connected" if (db_version) else "error"
    crsr.close()
    firebaseText = "connected" if (fbapp) else "error"
    return {"database-check": aliveText, "firebase-check": firebaseText}


@app.post("/v1/users/create", status_code=status.HTTP_201_CREATED)
def createVoter(VoterDetails: CreateVoter):
    
    return {}

@app.get("/v1/users/{id}", status_code=status.HTTP_200_OK)
def getUserDetails(id):
    return {}

@app.post("/v1/polls/create", status_code=status.HTTP_201_CREATED)
def createPoll(BallotInfo: BallotCreate):
    return {}


@app.get("/v1/polls/details/{id}", status_code=status.HTTP_200_OK)
def getPollDetails(id):
    return {}

#add authentication
@app.put("/v1/polls/close", status_code=status.HTTP_201_CREATED)
def closePole(BallotInfo: BallotBaseInfo):
    return {}

#add authentication
@app.post("/v1/ballots/give", status_code=status.HTTP_200_OK)
def ballotVote(BasicVote: BallotVote):
    return{}

#add authentication
@app.put("/v1/ballots/update", status_code=status.HTTP_201_CREATED)
def updateBallot(UpdateVote: BallotVote):
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
