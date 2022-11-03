CREATE SCHEMA voteSchema;

CREATE TABLE voteSchema.ballot (
	id BIGSERIAL NOT NULL PRIMARY KEY,
	ballot_name VARCHAR(100) NOT NULL,
	live_results BOOLEAN NOT NULL,
	password TEXT NOT NULL,
	ballot_owner BIGSERIAL NOT NULL,
	
	CONSTRAINT fk_owner FOREIGN KEY(ballot_owner) REFERENCES voteSchema.voter(id)
);

CREATE TABLE voteSchema.voter (
	id BIGSERIAL NOT NULL PRIMARY KEY,
	email TEXT NOT NULL

);

CREATE TABLE voterSchema.vote (
	voter_id BIGSERIAL,
	ballot_id BIGSERIAL,
	PRIMARY KEY (voter_id, ballot_id),
	CONSTRAINT fk_voter FOREIGN KEY(voter_id) REFERENCES voteSchema.voter(id),
	CONSTRAINT fk_ballot FOREIGN KEY(ballot_id) REFERENCES voteSchema.ballot(id)
);