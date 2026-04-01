import { useEffect, useState } from "react";
import "./AuctionItemCard.css";
import { UserBidModal } from "./modals/UserBidModal";
import { BiddingHistoryModal } from "./modals/BiddingHistoryModal";
import { AuctionCountdownBadge } from "./AuctionCountdownBadge";
import { placeBid, getAuctionDetails, type Bid, type AuctionStatus } from "../api/auctionsApi";

interface Props {
  itemName: string;
  image: string;
  itemId: string;
  currentBid: number;
  currentBidder: string | null;
  endsAt: number;
  winner?: string | null;
  status?: AuctionStatus;
  isSniping?: boolean;
}

export const AuctionItemCard = ({
  itemName,
  image,
  itemId,
  currentBid,
  currentBidder,
  endsAt,
  winner,
  status,
  isSniping = false,
}: Props) => {
  const [isEnded, setIsEnded] = useState(status === "ended" || endsAt <= Date.now());
  const [isShowModal, setIsShowModal] = useState(false);
  const [isShowHistory, setIsShowHistory] = useState(false);
  const [bidHistory, setBidHistory] = useState<Bid[]>([]);
  const [bidWinner, setBidWinner] = useState<string | null>(winner ?? null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    setIsEnded(status === "ended" || endsAt <= Date.now());
  }, [status, endsAt]);

  const handleBidPlaced = async (bidder: string, amount: number) => {
    try {
      const res = await placeBid(itemId, bidder, amount);

      if (res.status === 400) {
        const data: { currentBid: number } = await res.json();
        alert(`Bid too low. Current bid is ₪${data.currentBid}`);
        return;
      }

      if (res.status === 409) {
        alert("Auction ended while you were bidding!");
        setIsEnded(true);
        setIsShowModal(false);
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to place bid: ${res.status}`);
      }

      setIsShowModal(false);
    } catch (err) {
      console.error(err);
      alert("Error placing bid. Try again.");
    }
  };

  const handleOpenHistory = async () => {
    try {
      setIsLoadingHistory(true);

      const data = await getAuctionDetails(itemId);

      setBidHistory(Array.isArray(data.bidHistory) ? data.bidHistory : []);
      setBidWinner(data.winner ?? data.currentBidder ?? winner ?? null);
      setIsShowHistory(true);
    } catch (err) {
      console.error(err);
      alert("Failed to load bidding history.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  return (
    <>
      <div className={`card h-100 shadow-sm border-0 w-auto ${isSniping ? "snipe-card" : ""}`}>
        <div className="card-body d-flex flex-column text-center">
          <h3
            className="card-title h5 mb-3 d-flex align-items-center justify-content-center"
            role="button"
          >
            {itemName}
          </h3>

          <div
            className="display-4 mb-3"
            role="button"
          >
            {image}
          </div>

          {isSniping && !isEnded && (
            <div className="alert alert-warning py-2 mb-3 fw-bold d-flex flex-column" role="alert">
              <span className="mb-1">⚠️ Snipe Alert!</span> 
              <span>Last-second bid placed</span>
            </div>
          )}

          <div className="mt-auto">
            {!isEnded ? (
              <>
                <div className="bidRow fw-bold mb-2 p-2 bg-light rounded">
                  ₪{currentBid} -{" "}
                  <small className="text-muted">
                    {currentBidder || "No bids yet"}
                  </small>
                </div>

                <AuctionCountdownBadge endsAt={endsAt} isEnded={isEnded} />

                <button
                  className="btn btn-primary w-100 fw-bold"
                  onClick={() => setIsShowModal(true)}>
                  Place Bid
                </button>
              </>
            ) : (
              <div className="alert alert-secondary py-2 mb-0">
                <small className="d-block text-uppercase fw-bold">Winner</small>
                {winner || currentBidder || "No winner"}
              </div>
            )}
          </div>

          <button
            className="btn btn-link mt-3 p-0"
            onClick={handleOpenHistory}
            disabled={isLoadingHistory}
          >
            {isLoadingHistory ? "Loading history..." : "View bidding history"}
          </button>
        </div>
      </div>

      {isShowModal && (
        <UserBidModal
          auctionId={itemId}
          title={itemName}
          currentBid={currentBid}
          endsAt={endsAt}
          onClose={() => setIsShowModal(false)}
          onBidPlaced={handleBidPlaced}
        />
      )}

      {isShowHistory && (
        <BiddingHistoryModal
          onClose={() => setIsShowHistory(false)}
          auctionTitle={itemName}
          history={bidHistory}
          winner={bidWinner}
        />
      )}
    </>
  );
};