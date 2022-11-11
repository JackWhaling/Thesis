from pydantic import BaseModel
from typing import List, Dict
from enum import Enum

class BallotVotingTypes(str, Enum):
    strictOrdering="strictOrdering"
    approval="approval"
    weakOrdering="weakOrdering"


class InviteMethod(str, Enum):
    doubleFactor="doubleFactor"
    singleFactor="singleFactor"

class BallotCreate(BaseModel):
    ballotType: BallotVotingTypes
    ballotName: str
    creatorId: int
    inviteMethod: InviteMethod
    votingRule: str
    liveResult: bool
    numWinners: int
    candidates: List[str]
    
    class Config:
        use_enum_values = True

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

class BallotRaw(BaseModel):
    voteRule: str
    numWinners: str
    rawData: str