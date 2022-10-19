from abcvoting.preferences import Profile, Voter
from abcvoting import abcrules
from abcvoting.output import output, INFO
from typing import List, Dict
import itertools

def convertToAbcProfile(ballots: List[Dict[str, int]], numCandidates: int):
  """
  We are given a list of ballots that are a dict of candidates names and their associated value.
  Dictionaries aren't garenteed to be in order as according the the profile is across all ballots.
  """
  candidateNameList = []
  for candidate in ballots[0]:
    candidateNameList.append(candidate)
  profile = Profile(numCandidates, candidateNameList)
  for ballot in ballots:
    approvedCandidates = []
    for candidate in ballot:
      if ballot[candidate] == 1:
        approvedCandidates.append(profile.cand_names.index(candidate))
    vote = Voter(approvedCandidates)
    profile.add_voter(vote)
  return profile

def getAbcResult(rule: str, profile: Profile, numWinners: int):
  if rule == "EAR":
    return ear(profile, numWinners)
  return abcrules.compute(rule, profile, numWinners)

def ear(profile: Profile, committeeSize: int):
  """
    We are given a profile. The profile should have candidate names and should have a list of candidates.
    to access candidate names get profile.cand_names
  """

  profile.can
  return

