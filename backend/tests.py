from votingRules import convertToAbcProfile
from typing import List, Dict

if __name__=="__main__":
  print("hello")
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
      "Lielle": 1,
      "Ethan": 0,
      "Revi": 0
    }
  ]
  newProf = convertToAbcProfile(votes, numCands)
  print(newProf.str_compact())
  print(newProf.cand_names)