from typing import List
from collections import defaultdict
from math import floor, log
import random
import numpy as np
from itertools import combinations

class EarProfile:
    def __init__(self, cand_array, committee_size):
        self.candidates = cand_array
        self.electedSet = []
        self.candidate_point_dict = {}
        self.committee_size = int(committee_size)
        self.voters: list(EarVoter) = []
        for candidate in cand_array:
            self.candidate_point_dict.setdefault(0, candidate)

    @property
    def num_cands(self):
        return len(self.candidates)

    @property
    def winners(self):
        return self.electedSet

    def set_specific_ballot(self, ballot):
        self.specificBallot = ballot

    def add_voter(self, voter):
        if isinstance(voter, EarVoter):
            self.voters.append(voter)
        else:
            return

    def add_voters(self, voters):
        for voter in voters:
            self.add_voter(voter)

    def checkCandidateQuota(self, quota, cand_pont_dict: defaultdict(list)):
        candidatesWithQuota = []
        for k, v in cand_pont_dict.items():
            if v > quota:
                candidatesWithQuota.append(k)
        if len(candidatesWithQuota) == 0:
            return []
        return candidatesWithQuota
    
    def pavResult(self):
        k = self.committee_size
        possibleCombintations = list(combinations(self.candidates, k))
        combinationMapPoints = defaultdict()
        gamma = 0.57721566490153286060651209008240243104215933593992
        """
            init all possible combination points
        """
        votedVoterArray = []
        for i in possibleCombintations:
            combinationMapPoints[i] = 0
        for voter in self.voters:
            """
                approved voters in index 0
            """
            if (voter.specialVoter):
                votedVoterArray = voter.voteArray[0]
            for comb in possibleCombintations:
                intersectionAm = len([c for c in voter.voteArray[0] if c in comb])
                if intersectionAm == 0:
                    continue
                harmonicVal = gamma + log(intersectionAm) + 0.5/intersectionAm - 1./(12*intersectionAm**2) + 1./(120*intersectionAm**4)
                combinationMapPoints[comb] += harmonicVal
        """
            we will find total weights and specific weight later which will be calculated from points gone in
        """
        bestComb = max(combinationMapPoints, key=combinationMapPoints.get)
        intersectionAm = len([c for c in votedVoterArray if c in bestComb])
        specificWeight = gamma + log(intersectionAm) + 0.5/intersectionAm - 1./(12*intersectionAm**2) + 1./(120*intersectionAm**4)
        totalWeight = combinationMapPoints[bestComb]
        return bestComb, totalWeight, specificWeight
    
    def stvResult(self):
        numVoters = len(self.voters)
        numCands = len(self.candidates)
        k = self.committee_size
        quota: int = (numVoters/(k + 1)) + 1
        electedCommittee = []
        elimintedCands = []
        currentCandsSupporters = defaultdict(list)
        currentCands = defaultdict(list)
        totalWeight = 0
        specificWeight = 0
        """
            initalize
        """
        for candidate in self.candidates:
            currentCands[candidate] = 0.0
            currentCandsSupporters[candidate] = []
        while (len(electedCommittee) < k):
            for voter in self.voters:
                currentVotedCand = voter.voteArray[voter.stage][0]
                """
                    eliminated cands shouldn't count nor should elected cands
                """
                while (currentVotedCand in elimintedCands and currentVotedCand in electedCommittee):
                    voter.upStage()
                currentVotedCand = voter.voteArray[voter.stage][0]
                currentCandsSupporters[currentVotedCand].append(voter)
                currentCands[currentVotedCand] += voter.weight
                """
                    get the candidates with the correct quota, if none then we eliminate cand with
                    least quota. Otherwise we elect a committee. Note since this is multi seat
                    candidates with quota + elected committee needs to equal k in order to end.

                    once a candidate is elected

                    If more than k end up being picked from candidates with quota then we will use the candidates with
                    highest quota otherwise randomly elect them.
                """
            candidatesWithQuota = self.checkCandidateQuota(quota=quota, cand_pont_dict=currentCands)
            """
                if noone with quota, eliminate someone with lowest quota
            """
            if ((len(candidatesWithQuota)) == 0):
                candWithLowest = min(currentCands, key=currentCands.get)
                elimintedCands.append(candWithLowest)
                currentCands.pop(candWithLowest, None)
                currentCandsSupporters.pop(candWithLowest, None)
                continue
            elif ((len(candidatesWithQuota)) + len(electedCommittee) <= k):
                for cand in candidatesWithQuota:
                    electedCommittee.append(cand)
                    for voter in currentCandsSupporters[currentVotedCand]:
                        if (voter.specialVoter):
                            specificWeight += voter.weight
                        totalWeight += voter.weight
                        fractionalWeight = (1 - quota/currentCands[cand])
                        voter.setWeight(fractionalWeight)
                        voter.upStage()
                    currentCands.pop(cand, None)
                    currentCandsSupporters.pop(cand, None)
                if ((len(electedCommittee) == k)):
                    return electedCommittee, totalWeight, specificWeight
                """
                    otherwise we know cnadidates with quota is too large and need to pick by method explaied
                """
            else:
                numberToPick = k - len(electedCommittee)
                elected = 0
                while (numberToPick > 0):
                    sortedCands = sorted(currentCands.items(), key=lambda x: (x[1], random.random()), reverse=True)
                    electedCommittee.append(sortedCands[elected][0])
                    elected += 1
                    numberToPick -= 1
        return electedCommittee, totalWeight, specificWeight
        

    def earResult(self):
        maximalRank = self.getRankMaximal()
        numVoters = len(self.voters)
        numCands = len(self.candidates)
        k = self.committee_size
        quota: int = (numVoters/(k+1)) + ((1/(numCands+1))*(floor(numVoters/(k + 1)) + 1 - (numVoters/(k + 1))))
        electedCommittee = []
        currentCands = defaultdict(float)
        currentCandsSupporters = defaultdict(list)
        totalWeight = 0 
        specificWeight = 0
        for candidate in self.candidates:
            currentCands[candidate] = 0
            currentCandsSupporters[candidate] = []
        currJ = 0 
        while (len(electedCommittee) < k):
            candidatesWithQuota = []
            for voter in self.voters:
                for cand in voter.voteArray[currJ]:
                    if cand in electedCommittee:
                        break
                    currentCandsSupporters[cand].append(voter)
                    currentCands[cand] += voter.weight
            candidatesWithQuota = self.checkCandidateQuota(quota=quota, cand_pont_dict=currentCands)
            if (len(candidatesWithQuota) + len(electedCommittee) <= k):
                for c in candidatesWithQuota:
                    electedCommittee.append(c)
                    for voter in currentCandsSupporters[c]:
                        if (voter.specialVoter):
                            specificWeight += voter.weight
                        totalWeight += voter.weight
                        voter.setWeight(((len(currentCandsSupporters[c]) - quota)/len(currentCandsSupporters[c])) * voter.weight)
                    currentCands.pop(c, None)
                    currentCandsSupporters.pop(c, None)
            else:
                """
                    dont need to worry about popping after this, we will break from here
                """
                candidatesWithQuota = sorted(candidatesWithQuota, key=lambda x: maximalRank.index(x))
                for cands in candidatesWithQuota:
                    if (len(electedCommittee) == k):
                        break
                    electedCommittee.append(cands)
                    for voter in currentCandsSupporters[cands]:
                        if (voter.specialVoter):
                            specificWeight += voter.weight
                        totalWeight += voter.weight
                        voter.setWeight(((len(currentCandsSupporters[cands]) - quota)/len(currentCandsSupporters[cands])) * voter.weight)
            currJ += 1
            # avoid out range checking. If quota wasnt reached then something went wrong in ballot process
            # this shouldnt happen unless people entered in votes with no candidates elected
            # this is saftey incase someone enters voters incorrectly to avoid breaking by out of index
            if (currJ == self.num_cands):
                raise Exception("Either candidates missing in ballots or too little voters")
        return electedCommittee, totalWeight, specificWeight


    """
        compare rules with respect to criteria

        presentation: have some initial results from algorithm implementation

        identify some peformance crtieras and analyse them to user

        look at: proportionality degree
    """
    """
        get maximal rank of voters
    """
    def getRankMaximal(self):
        candidate_dict = defaultdict(list)
        for candidate in self.candidates:
            for i in range(len(self.candidates)):
                candidate_dict[candidate].append(0)
        for voter in self.voters:
            for index, set in enumerate(voter.voteArray):
                for cands in set:
                    candidate_dict[cands][index] += 1
        maximalDict = dict(sorted(candidate_dict.items(), key=lambda x: x[1], reverse=True))
        return list(maximalDict.keys())

class EarVoter:
    def __init__(self, voteArray, weight=1, special = False):
        self.specialVoter = special
        self.voteArray = voteArray
        self.weight = weight
        self.stage = 0

    def setWeight(self, weight):
        self.weight = weight

    def upStage(self):
        self.stage += 1

# if __name__ == "__main__":
#     print("hello")
#     earV1 = EarVoter(voteArray=[["a"], ["b"], ["c"], ["d"]])
#     earV2 = EarVoter(voteArray=[["b"], ["c"], ["d"], ["a"]])
#     earV5 = EarVoter(voteArray=[["d"], ["b"], ["c"], ["a"]])
#     earV4 = EarVoter(voteArray=[["c"], ["d"], ["b"], ["a"]])
#     earV3 = EarVoter(voteArray=[["a"], ["b"], ["d"], ["c"]])
#     earProf = EarProfile(["a", "b", "c", "d"], 2)
#     earProf.add_voters([earV1, earV2, earV3, earV4, earV5])
#     earProf.earResult()
