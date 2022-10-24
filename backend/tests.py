from xml.dom.minidom import Element
from votingRules import convertToAbcProfile
from typing import List, Dict
from abcvoting import abcrules

from votingRules.abcRules import rankMaximalAbc

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
      "Ethan": 0,
      "Lielle": 1,
      "Revi": 0
    }
  ]
  newProf = convertToAbcProfile(votes, numCands)
  print(newProf.str_compact())
  for voter in newProf._voters:
    for element in voter.approved:
      print(element)
  print(rankMaximalAbc(newProf))