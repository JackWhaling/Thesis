from typing import List
from collections import defaultdict
from math import floor
import numpy as np

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
                print(v)
                candidatesWithQuota.append(k)
        if len(candidatesWithQuota) == 0:
            return []
        return candidatesWithQuota

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
                    totalWeight += voter.weight
                    if (voter.specialVoter):
                        specificWeight += voter.weight
            candidatesWithQuota = self.checkCandidateQuota(quota=quota, cand_pont_dict=currentCands)
            if (len(candidatesWithQuota) + len(electedCommittee) <= k):
                for c in candidatesWithQuota:
                    electedCommittee.append(c)
                    for voter in currentCandsSupporters[c]:
                        voter.weight = ((len(currentCandsSupporters[c]) - quota)/len(currentCandsSupporters[c])) * voter.weight
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
                        voter.weight = ((len(currentCandsSupporters[cands]) - quota)/len(currentCandsSupporters[cands])) * voter.weight
            currJ += 1
            # avoid out range checking. If quota wasnt reached then something went wrong in ballot process
            # this shouldnt happen unless people entered in votes with no candidates elected
            # this is saftey incase someone enters voters incorrectly to avoid breaking by out of index
            if (currJ == self.num_cands):
                print(electedCommittee)
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

        # check weights
        if self.weight <= 0:
            raise ValueError("Weight should be a number > 0.")


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
