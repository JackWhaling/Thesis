from fastapi import FastAPI, status, Request
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from pydantic import BaseModel
from typing import List, Dict
import time
import psycopg2


firestoreDb = firestore.client()
conn = psycopg2.connect(
    host="database-1.cr5yt92m1t0g.ap-southeast-2.rds.amazonaws.com",
    password="lt4Uqx6EO#sy6*sq0gFmHf",
    port="5432",
    user="postgres"
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


class BallotVote(BaseModel):
    userToken: str
    ballotId: str
    ballot: Dict[str, int]


def getApp():
    return app


@app.get("/v1/alive", status_code=status.HTTP_200_OK)
def alive():
    return {"hello world": "propa vote"}


@app.post("/v1/polls/create", status_code=status.HTTP_201_CREATED)
def createPoll(BallotInfo: BallotCreate):
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
