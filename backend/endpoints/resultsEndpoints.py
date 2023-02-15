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


def getResultsRaw(data: models.BallotRaw):
    splitData = data.rawData.splitlines()
    totalVoters = 0
    # each split line is in the form n: {}, k, {m..n}
    # n is number of unique voters who voted with the following ballot
    # {} is an empty set in preference, k occurs when only one option is selected (not encased by a braces), and {m..n} are
    # a set of preferences with the same order. Within this set they are seperated by commas.
    # each preference order is split by a comma
    uniqueVoters = len(splitData)
    listOfVoters = []
    candidates = []
    candidateNames = []
    altCand = 1
    for i in splitData:
        if (re.match(r'# ALTERNATIVE NAME \d+: .*', i)):
            candidates.append(str(altCand))
            candidateName = re.search(r'# ALTERNATIVE NAME \d+: .*', i).group()
            candidateName = stripReg(candidateName,'', r'# ALTERNATIVE NAME \d+: ')
            candidateNames.append(candidateName)
            altCand += 1
            continue
        elif (re.match(r'#.*', i)):
            continue
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
    ### list of dictionary of voters we can send to get results
    results = getResults(listOfVoters, data.voteRule, data.numWinners)
    print(candidateNames)
    print(results)
    nameResults = []
    for result in results:
        print(result)
        nameResults.append(candidateNames[int(result) - 1])
    responseBody = {
        "results": nameResults,
        "numVoters": totalVoters,
        "numCandidates": len(candidates),
        "uniqueVotes": uniqueVoters,
    }
    return toJsonResponse(200, responseBody)

def getResults(listOfVotes, rule, numWinners):
    #TODO return results
    convertMethod = RULE_MAP[rule]
    if (convertMethod == "earProfile"):
        profile = convertToEarProfile(listOfVotes, int(numWinners))
        results = profile.earResult()
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
        print("wrong voting method")
    return toJsonResponse(200, {})

def getBallotResults(superdb: Client, ballotId, userFbId):
    voteInfoData = superdb.table("vote").select("vote_object_string").eq("ballot_id", ballotId).execute()
    ballotInfoData = superdb.table("ballot").select("ballot_owner, voting_rule, committee_size, live_results, closed").eq("id", ballotId)
    secondSqlQueryString = "SELECT vote_object_string FROM voteschema.vote WHERE ballot_id = %s"
    firstSqlQueryString = "SELECT ballot_owner, voting_rule, committee_size, live_results, closed FROM voteschema.ballot WHERE id = %s"
    cur = conn.cursor()
    try:
        cur.execute(firstSqlQueryString, (ballotId,))
        (ballotOwner, voteRule, commSize, live, closed) = cur.fetchone()
        if (not closed and not live):
            return toJsonResponse(401, {})
        cur.execute(secondSqlQueryString, (ballotId,))
        record = cur.fetchall()
        listOfVotes = []
        for row in record:
            (voteString,) =  row
            if (voteString == None):
                continue
            listOfVotes.append(json.loads(voteString))
        if (len(listOfVotes) < 2):
            return toJsonResponse(406, {})
        res = getResults(listOfVotes, voteRule, commSize)

        return toJsonResponse(200, {"results": res})
    except Exception as error:
        print(error)
        cur.close()
        return toJsonResponse(409, {})
