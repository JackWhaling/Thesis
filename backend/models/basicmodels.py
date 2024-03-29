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
    inviteMethod: InviteMethod
    votingRule: str
    liveResult: bool
    numWinners: int
    candidates: List[str]
    
    class Config:
        use_enum_values = True

class BallotBaseInfo(BaseModel):
    ballotId: str

class BallotExtraInfo(BaseModel):
    userToken: str
    userEmail: str
    ballotId: str

class CreateVoter(BaseModel):
    userId: str
    email: str

class BallotVoteSecure(BaseModel):
    timeDiff: str
    voteOrder: Dict[int, str]
    styleGenerated: str
    ballotId: str
    dfaCode: str
    ballot: Dict[str, int]

class BallotVote(BaseModel):
    timeDiff: str
    voteOrder: Dict[int, str]
    styleGenerated: str
    ballotId: str
    ballot: Dict[str, int]

class BallotRaw(BaseModel):
    voteRule: str
    numWinners: str
    rawData: str

class AddVoters(BaseModel):
    voters: List[str]
    ballotId: str

class AddSingleVoter(BaseModel):
    voter: str
    ballotId: str