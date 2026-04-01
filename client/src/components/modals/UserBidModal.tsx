import React, { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { getTimeLeft, isEndingSoonCheck } from "../../utils/timer";

interface Props {
  auctionId: string;
  title: string;
  currentBid: number;
  endsAt: number;
  onClose: () => void;
  onBidPlaced: (bidder: string, amount: number) => Promise<void>;
}

export const UserBidModal = (props: Props) => {
  const [bidderName, setBidderName] = useState("");
  const [amount, setAmount] = useState<number>(props.currentBid + 1);
  const [timeLeftLabel, setTimeLeftLabel] = useState(() => getTimeLeft(props.endsAt));
  const [isEndingSoon, setIsEndingSoon] = useState(() => isEndingSoonCheck(props.endsAt, false));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (props.endsAt <= Date.now()) {
      setTimeLeftLabel("00:00");
      return;
    }

    const interval = setInterval(() => {
      const label = getTimeLeft(props.endsAt);
      const endingSoon = isEndingSoonCheck(props.endsAt, false);

      setTimeLeftLabel(label);
      setIsEndingSoon(endingSoon);

      if (label === "00:00") {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [props.endsAt]);

  const handleBid = async () => {
    if (!bidderName || amount <= props.currentBid) {
      setError("Please enter your name and a bid higher than the current one.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await props.onBidPlaced(bidderName, amount);
      props.onClose(); 
    } catch (err: any) {
      if (err.status === 400) {
        setError("Bid too low - someone just outbid you.");
      } else if (err.status === 409) {
        setError("Auction has already ended.");
      } else {
        setError("Failed to place bid. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isTimeUp = timeLeftLabel === "00:00";

  return (
    <div className="modal show d-block modal-overlay" tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <div className="modal-header">
            <h5 className="modal-title fs-3">{props.title}</h5>
            <button type="button" className="btn-close" onClick={props.onClose} aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <div className="d-flex justify-content-between fs-4 mb-3">
              <span>Current Bid:</span>
              <span className="fw-bold">₪{props.currentBid}</span>
            </div>
            
            <div className={`text-center py-2 rounded mb-3 ${isEndingSoon ? "bg-danger text-white" : "bg-light text-dark"}`}>
              <small className="d-block text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Time Left</small>
              <span className="fw-bold fs-5">{timeLeftLabel}</span>
            </div>

            <div className="mb-3">
              <label className="form-label d-flex small text-muted">Your Name</label>
              <input
                className="form-control"
                type="text"
                placeholder="John Doe"
                value={bidderName}
                onChange={(e) => setBidderName(e.target.value)}
                disabled={loading || isTimeUp}
              />
            </div>

            <div className="mb-3">
              <label className="form-label d-flex small text-muted">Your Bid (₪)</label>
              <input
                className="form-control"
                type="number"
                value={amount}
                min={props.currentBid + 1}
                onChange={(e) => setAmount(Number(e.target.value))}
                disabled={loading || isTimeUp}
              />
            </div>

            <button
              className={`btn w-100 fw-bold ${isTimeUp ? "btn-secondary" : "btn-primary"}`}
              onClick={handleBid}
              disabled={!bidderName || amount <= props.currentBid || isTimeUp || loading}>
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
              ) : isTimeUp ? "Auction Ended" : "Place Bid"}
            </button>

            {error && <p className="text-danger small mt-2 text-center">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};