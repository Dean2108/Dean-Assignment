import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { type Bid } from "../../api/auctionsApi";

// interface Bid {
//   bid_id: string;
//   bidder: string;
//   amount: number;
//   timestamp: number;
// }

interface Props {
  auctionTitle: string;
  history: Bid[];
  winner?: string | null;
  onClose: () => void;
}

export const BiddingHistoryModal = ({
  auctionTitle,
  history,
  winner,
  onClose,
}: Props) => {
  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString();
  };

  const sortedHistory = [...history].sort((a, b) => a.timestamp - b.timestamp);
  const lastBid = sortedHistory[sortedHistory.length - 1];

  return (
    <div className="modal show d-block" tabIndex={-1} role="dialog" aria-modal="true">
      <div className="modal-dialog modal-md modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Bidding History: {auctionTitle}</h5>

            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            />
          </div>

          <div className="modal-body">
            <ul className="list-group">
              {sortedHistory.length === 0 && (
                <li className="list-group-item text-center text-muted">
                  No bids yet
                </li>
              )}

              {sortedHistory.map((bid) => {
                const isWinner =
                  Boolean(winner) &&
                  Boolean(lastBid) &&
                  bid.bid_id === lastBid?.bid_id &&
                  bid.bidder === winner;

                return (
                  <li
                    key={bid.bid_id}
                    className={`list-group-item d-flex justify-content-between align-items-center ${isWinner ? "list-group-item-success fw-bold" : ""
                      }`}
                  >
                    <div>
                      <div>{bid.bidder}</div>
                      <small className="text-muted">{formatTime(bid.timestamp)}</small>
                    </div>

                    <span>₪{bid.amount}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      <div className="modal-backdrop show bg-transparent" onClick={onClose} />
    </div>
  );
};