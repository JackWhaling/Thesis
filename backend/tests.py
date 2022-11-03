from xml.dom.minidom import Element
from votingRules import convertToAbcProfile, convertToEarProfile, getAbcResult
from typing import List, Dict
from abcvoting import abcrules

if __name__=="__main__":
  numCands = 4
  votes = [
    {
      "Jack": 1,
      "Lielle": 1,
      "Ethan": 0,
      "Revi": 1
    },
    {
      "Jack": 0,
      "Lielle": 1,
      "Ethan": 0,
      "Revi": 0
    },
    {
      "Jack": 1,
      "Ethan": 0,
      "Lielle": 1,
      "Revi": 0
    }
  ]
  newProf = convertToAbcProfile(votes, numCands)
  otherProf = convertToEarProfile(votes, numCands)

  for voter in otherProf.voters:
    print(voter.voteArray)