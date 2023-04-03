from collections import OrderedDict
from abcvoting.preferences import Profile, Voter
from abcvoting import abcrules
from abcvoting.output import output, INFO
from typing import List, Dict
from models import EarProfile, EarVoter
import itertools
import math
from operator import itemgetter
from pyrankvote import Candidate, Ballot


"""
 FOR EAR VOTING CLASS:

 each profile has m candidates and n voters
 each voter has a ballot
 each voter has a weight initially 1
 each voters ballot of m approvals [{},{},...,{}].
 each j-th approval has up to m candidates ie [{1,2}, {4}, {3}, {}]
 once there is a set of 0 candidates in it we know there is no more approvals by that voter after.

 If a voters candidate is elected, their weights are reweighted to go down by the quota relational
 (ie if 6 voters get a candidate elected on a quota of 3.2, each voters weight is now their previous weight *
 (total num voters supporting candidate elected - quota)/(total num voters supporting candidate elected)
"""

def convertToAbcProfile(ballots: List[Dict[str, int]], numCandidates: int):
  """
  We are given a list of ballots that are a dict of candidates names and their associated value.
  Dictionaries aren't garenteed to be in order as according the the profile is across all ballots.
  """
  candidateNameList = []
  for candidate in ballots[0]:
    candidateNameList.append(candidate)
  profile = Profile(len(candidateNameList), candidateNameList)
  for ballot in ballots:
    approvedCandidates = []
    for candidate in ballot:
      if ballot[candidate] == 1:
        approvedCandidates.append(profile.cand_names.index(candidate))
    vote = Voter(approvedCandidates)
    profile.add_voter(vote)
  return profile

def convertToEarProfile(ballots: List[Dict[str, int]], numCandidates: int, specialBallot = None):
  candidateNameList = []
  specialVoterMade = False
  for candidate in ballots[0]:
    candidateNameList.append(candidate)
  profile = EarProfile(cand_array=candidateNameList, committee_size=numCandidates)
  for ballot in ballots:
    newBase = [[] for _ in range(len(candidateNameList))]
    for candidate in ballot:
      newBase[ballot[candidate]].append(candidate)
    if (specialBallot == newBase and not specialVoterMade):
      voter = EarVoter(voteArray=newBase, special=True)
      specialVoterMade = True
    else:
      voter = EarVoter(voteArray=newBase)
    profile.add_voter(voter)
  return profile

def convertToStrict(ballots: List[Dict[str, int]]):
  candidateList = []
  ballotList = []
  for candidate in ballots[0]:
    candidateList.append(Candidate(candidate))
  for ballot in ballots:
    sortedBallot = sorted(ballot, key=ballot.get)
    votes = []
    for cand in sortedBallot:
      vote = Candidate(cand)
      votes.append(vote)
    ballotList.append(Ballot(ranked_candidates=votes))
  return candidateList, ballotList


def getAbcResult(rule: str, ballots: List[Dict[str, int]], numWinners: int):
  if rule == "EAR":
    profile = convertToEarProfile(ballots, numWinners)
    return (profile, numWinners)
  profile = convertToAbcProfile(ballots, numWinners)
  return abcrules.compute(rule, profile, numWinners)



