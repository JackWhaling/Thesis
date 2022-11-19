import React, { useState } from "react";
import { Modal } from "react-bootstrap";

interface IGetResultsModal {
  show: boolean,
  hideModal: any,
  getBallotInfo: any,
  error: string | null,
}

const GetResultsModal = ({show, hideModal, getBallotInfo, error}: IGetResultsModal) => {
  const [passcode, setPasscode] = useState<string>('')

  const handleChange = (e: any) => {
    e.preventDefault()
    setPasscode(e.target.value)
  }

  return (
      <Modal show={show} onHide={hideModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Enter ballot passcode to get more info
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div
            className="input"
          >
            <input
              className="input__field"
              name="ballotPass"
              type="text"
              placeholder="Ballot Passcode"
              onChange={(e) => {
                handleChange(e);
              }}
              value={passcode}
            />
            <div className="cut cut-xl"></div>
            <label className="input__label">Ballot Passcode</label>
          </div>
          {error && <label>Incorrect passcode</label>}
        </Modal.Body>
        <Modal.Footer>
          <input type="submit" value="Vote!" onClick={(e) => {getBallotInfo(e, passcode)}}/>
        </Modal.Footer>
      </Modal>
  )
}

export default GetResultsModal;
