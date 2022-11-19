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
    firstOne = splitData[0]
    strippedString = stripReg(firstOne)
    numCandidates = len(re.findall('[0-9]+',strippedString))
    listOfVoters = []
    for i in splitData:
        print(i)
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
        listOfVoters.extend([dict(newSetVoter)] * int(numVoters))
    ### list of dictionary of voters we can send to get results
    results = getResults(listOfVoters, data.voteRule, data.numWinners)
    responseBody = {
        "results": results,
        "numVoters": totalVoters,
        "numCandidates": numCandidates,
        "uniqueVotes": uniqueVoters,
    }
    return toJsonResponse(200, responseBody)

def getResults(listOfVotes, rule, numWinners):
    #TODO return results
    convertMethod = RULE_MAP[rule]
    print("profile for ", rule, " to be converted to: ", convertMethod)
    print("total num of winners: ", numWinners)
    print("voters: ", listOfVotes)
    if (convertMethod == "earProfile"):
        profile = convertToEarProfile(listOfVotes, int(numWinners))
        results = profile.earResult()
        print(results)
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
        print(cands, ballots)
        election_results = pyrankvote.single_transferable_vote(cands, ballots, int(numWinners))
        winners = election_results.get_winners()
        print(election_results)
        electedCommittee = []
        for winner in winners:
            electedCommittee.append(str(winner))
        return electedCommittee
    else:
        print("wrong voting method")
    return toJsonResponse(200, {})

def getBallotResults(conn, ballotId, userFbId):
    secondSqlQueryString = "SELECT vote_object_string FROM voteschema.voteTable WHERE ballot_id = %s"
    firstSqlQueryString = "SELECT ballot_owner, voting_rule, committee_size, live_results, closed FROM voteschema.ballot WHERE id = %s"
    cur = conn.cursor()
    try:
        cur.execute(firstSqlQueryString, (ballotId,))
        (ballotOwner, voteRule, commSize, live, closed) = cur.fetchone()
        if (not closed and not live):
            return toJsonResponse(401, {})
        cur.execute(secondSqlQueryString, (ballotId,))
        print(voteRule, commSize, ballotId)
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
