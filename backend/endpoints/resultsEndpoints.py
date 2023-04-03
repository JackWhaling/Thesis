from operator import itemgetter
from random import randint
from fastapi import status, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import auth
from firebase_admin import exceptions
import models
import json
import os
import re
from helpers import RULE_MAP
from collections import defaultdict
from helpers import toJsonResponse
from dotenv import load_dotenv
from votingRules import convertToAbcProfile, convertToEarProfile, convertToStrict
from abcvoting import abcrules
from pyrankvote import Candidate, Ballot
import pyrankvote
from supabase import Client


def stripReg(string, char='', reg=r'\d+:\s*'):
    regex_sub = re.sub(reg, char, string)
    return (regex_sub)

def getResultsSpecificCall(superdb: Client, ballotId, userFbId):
    ballotInfoData = superdb.table("ballot").select("ballot_owner, voting_rule, committee_size, closed").eq("id", ballotId).execute()
    if (len(ballotInfoData.data) <= 0):
        return toJsonResponse(404, {})
    ballotObject = ballotInfoData.data[0]
    (ballotOwner, rule, size, closed) = itemgetter("ballot_owner", "voting_rule", "committee_size", "closed")(ballotObject)
    if (not closed):
        return toJsonResponse(401, {})
    if (rule != "EAR" and rule != "pav" and rule !="stv"):
        return getBallotResults(superdb, ballotId, userFbId) 
    voteInfoData = superdb.table("vote").select("vote_object_string, voter_id").eq("ballot_id", ballotId).execute()
    if (len(voteInfoData.data) <= 2):
        return toJsonResponse(402, {})
    votes = voteInfoData.data
    listOfVotes = []
    specialBallot = None
    for row in votes:
        (voteString, voterId) = itemgetter("vote_object_string", "voter_id")(row)
        if (voteString == None or voteString == "" or len(voteString) <= 2):
            continue
        listOfVotes.append(json.loads(voteString))
        if (userFbId == voterId):
            specialBallot = json.loads(voteString)
    if (len(listOfVotes) < 2):
        return toJsonResponse(406, {})
    if (specialBallot == None):
        return toJsonResponse(408, {})
    res, totalWeight, specificWeight, numVoters = getResultsSpecific(listOfVotes, rule, size, specialBallot)
    return toJsonResponse(200, {"results": res, "totalWeight": totalWeight, "personalWeight": specificWeight, "numVoters": numVoters})


def getResultsSpecific(listOfVotes, rule, size, specialBallot):
    if (rule == "EAR"):
        newSpecial = [[] for _ in range(len(specialBallot))]
        for candidate in specialBallot:
            newSpecial[specialBallot[candidate]].append(candidate)
        profile = convertToEarProfile(listOfVotes, int(size), newSpecial)
        results, totalWeight, specificWeight = profile.earResult()
        return results, totalWeight, specificWeight, len(profile.voters)
    if(rule == "stv"):
        newSpecial = [[] for _ in range(len(specialBallot))]
        for candidate in specialBallot:
            newSpecial[specialBallot[candidate]].append(candidate)
        profile = convertToEarProfile(listOfVotes, int(size), newSpecial)
        results, totalWeight, specificWeight = profile.stvResult()
        return results, totalWeight, specificWeight, len(profile.voters)
    if (rule == "pav"):        
        newSpecial = [[] for _ in range(len(specialBallot))]
        for candidate in specialBallot:
            newSpecial[specialBallot[candidate]].append(candidate)
        profile = convertToEarProfile(listOfVotes, int(size), newSpecial)
        results, totalWeight, specificWeight = profile.pavResult()
        return results, totalWeight, specificWeight, len(profile.voters)
    return [], 0, 0

def getResultsRaw(data: models.BallotRaw):
    splitData = data.rawData.splitlines()
    totalVoters = 0
    # each split line is in the form n: {}, k, {m..n}
    # n is number of unique voters who voted with the following ballot
    # {} is an empty set in preference, k occurs when only one option is selected (not encased by a braces), and {m..n} are
    # a set of preferences with the same order. Within this set they are seperated by commas.
    # each preference order is split by a comma
    uniqueVoters = 0
    listOfVoters = []
    candidates = []
    candidateNames = []
    altCand = 1
    specialVoterGroup = None
    for i in splitData:
        noted = False
        if (re.match(r'# ALTERNATIVE NAME \d+: .*', i)):
            candidates.append(str(altCand))
            candidateName = re.search(r'# ALTERNATIVE NAME \d+: .*', i).group()
            candidateName = stripReg(candidateName,'', r'# ALTERNATIVE NAME \d+: ')
            candidateNames.append(candidateName)
            altCand += 1
            continue
        elif (re.match(r'#.*', i)):
            continue
        uniqueVoters += 1
        if re.match(r'.*\*$', i):
            i = i.replace("*","")
            noted = True
        numVoters = re.search(r'\d+', i).group()
        totalVoters += int(numVoters)
        strippedVoters = stripReg(i)
        arrayOfVotes = [i.strip() for i in re.split(r',(?![^\{]*[\}])', strippedVoters)]
        ### we now have split up all preference sets
        level = 0
        newSetVoter = defaultdict(int)
        for j in arrayOfVotes:
            if (re.match(r'{.*}', j)):
                stringOfVotes = stripReg(j, '', r'{')
                stringOfVotes = stripReg(stringOfVotes, '', r'}')
                setOfVotes = stringOfVotes.split(",")
                for k in setOfVotes:
                    if k == '':
                        break
                    newSetVoter[k] = level
            else:
                newSetVoter[j] = level
            level += 1
        for cand in candidates:
            if cand not in newSetVoter:
                newSetVoter[cand] = level
        listOfVoters.extend([dict(newSetVoter)] * int(numVoters))
        if noted:
            specialVoterGroup = newSetVoter
    ### list of dictionary of voters we can send to get results
    if (specialVoterGroup == None):
        results = getResults(listOfVoters, data.voteRule, data.numWinners)
        nameResults = []
        for result in results:
            nameResults.append(candidateNames[int(result) - 1])
        responseBody = {
            "results": nameResults,
            "numVoters": totalVoters,
            "numCandidates": len(candidates),
            "uniqueVotes": uniqueVoters,
            "special": 0,
        }
        return toJsonResponse(200, responseBody)
    results, totalWeight, specificWeight, _ = getResultsSpecific(listOfVoters, data.voteRule, data.numWinners, specialVoterGroup)
    nameResults = []
    if (results == []):
        return toJsonResponse(404, {})
    for result in results:
        nameResults.append(candidateNames[int(result) - 1])
    responseBody = {
        "results": nameResults,
        "numVoters": totalVoters,
        "numCandidates": len(candidates),
        "uniqueVotes": uniqueVoters,
        "special": {"specificWeight": specificWeight, "totalWeight": totalWeight},
    }
    return toJsonResponse(200, responseBody)

def getResults(listOfVotes, rule, numWinners):
    #TODO return results
    convertMethod = RULE_MAP[rule]
    if (convertMethod == "earProfile"):
        profile = convertToEarProfile(listOfVotes, int(numWinners))
        results, _, _ = profile.earResult()
        return results
    elif (convertMethod == "abcProfile"):
        profile = convertToAbcProfile(listOfVotes, int(numWinners))
        candidateSetList = abcrules.compute(rule, profile, int(numWinners))[0]
        electedCommittee = []
        for cand in candidateSetList:
            electedCommittee.append(profile.cand_names[cand])
        return electedCommittee
    elif (convertMethod == "strictProfile"):
        (cands, ballots) = convertToStrict(listOfVotes)
        if (rule == "stv"):
            election_results = pyrankvote.single_transferable_vote(cands, ballots, int(numWinners))
            winners = election_results.get_winners()
        else:
            election_results = pyrankvote.preferential_block_voting(cands, ballots, int(numWinners))
            winners = election_results.get_winners()
        electedCommittee = []
        for winner in winners:
            electedCommittee.append(str(winner))
        return electedCommittee
    else:
        toJsonResponse(500, {})
    return toJsonResponse(200, {})

def getBallotResults(superdb: Client, ballotId, userFbId):
    ballotInfoData = superdb.table("ballot").select("ballot_owner, voting_rule, committee_size, live_results, closed").eq("id", ballotId).execute()
    if (len(ballotInfoData.data) <= 0):
        return toJsonResponse(404, {})
    ballotObject = ballotInfoData.data[0]
    (ballotOwner, rule, size, live, closed) = itemgetter("ballot_owner", "voting_rule", "committee_size", "live_results", "closed")(ballotObject)
    if (not closed and not live):
        return toJsonResponse(401, {})
    if (ballotOwner != userFbId):
        return toJsonResponse(403, {})
    voteInfoData = superdb.table("vote").select("vote_object_string").eq("ballot_id", ballotId).execute()
    if (len(voteInfoData.data) <= 2):
        return toJsonResponse(402, {})
    votes = voteInfoData.data
    listOfVotes = []
    for row in votes:
        (voteString) = itemgetter("vote_object_string")(row)
        if (voteString == None or voteString == "" or len(voteString) <= 2):
            continue
        listOfVotes.append(json.loads(voteString))
    if (len(listOfVotes) < 2):
        return toJsonResponse(406, {})
    res = getResults(listOfVotes, rule, size)
    return toJsonResponse(200, {"results": res})