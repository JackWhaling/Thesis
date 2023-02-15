CREATE SCHEMA voteSchema;

CREATE TABLE voteSchema.ballot (
	id BIGSERIAL NOT NULL PRIMARY KEY
	ballot_name VARCHAR(100) NOT NULL,
	live_results BOOLEAN NOT NULL,
	password TEXT NOT NULL,
	ballot_owner BIGSERIAL NOT NULL,
	
	CONSTRAINT fk_owner FOREIGN KEY(ballot_owner) REFERENCES voteschema.voter(id)
)

CREATE TABLE voteschema.voter (
	id BIGSERIAL NOT NULL PRIMARY KEY
	email TEXT NOT NULL UNIQUE
)

CREATE TABLE voteschema.vote (
	voter_id text,
	ballot_id BIGSERIAL,
	vote_object_string text,
	passcode text,
	primary key (voter_id, ballot_id),
	CONSTRAINT fk_voter FOREIGN KEY(voter_id) REFERENCES voteschema.voter(fb_key),
	CONSTRAINT fk_ballot FOREIGN KEY(ballot_id) REFERENCES voteSchema.ballot(id)
)