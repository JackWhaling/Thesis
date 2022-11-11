from xml.dom.minidom import Element
from votingRules import convertToAbcProfile, convertToEarProfile, getAbcResult
from typing import List, Dict
from abcvoting import abcrules

if __name__=="__main__":
  numCands = 2
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


  
  ## add test cases for randomized 1-1000 voters
  otherProf = convertToEarProfile(votes, 2)
  print(otherProf.earResult())

  for voter in otherProf.voters:
    print(voter.voteArray)