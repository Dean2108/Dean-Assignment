export type AuctionStatus = "active" | "ended";

export interface Auction {
  id: string;
  title: string;
  image: string;
  currentBid: number;
  currentBidder: string | null;
  endsAt: number;
  status: AuctionStatus;
  winner?: string | null;
}

export interface NewBidEventData {
  bid_id: string;
  auctionId: string;
  bidder: string;
  amount: number;
}

export interface AuctionEndedEventData {
  auctionId: string;
  winner: string | null;
  finalPrice: number;
}

export const validateBid = ({
  bidder,
  amount,
  currentBid,
}: {
  bidder: string;
  amount: number;
  currentBid: number;
}) => {
  const trimmedBidder = bidder.trim();

  if (!trimmedBidder) {
    return {
      valid: false,
      error: "Bid must include your name.",
    };
  }

  if (amount <= currentBid) {
    return {
      valid: false,
      error: "Bid must be higher than current bid.",
    };
  }

  return {
    valid: true,
    error: "",
  };
};

export const registerBidEvent = (seenBidIds: Set<string>, bidId: string) => {
  if (seenBidIds.has(bidId)) {
    return {
      isDuplicate: true,
      nextSeenBidIds: seenBidIds,
    };
  }

  seenBidIds.add(bidId);

  return {
    isDuplicate: false,
    nextSeenBidIds: seenBidIds,
  };
};

export const isAuctionEnded = ({
  status,
  endsAt,
  now,
}: {
  status?: AuctionStatus;
  endsAt: number;
  now?: number;
}) => {
  const currentTime = now ?? Date.now();
  return status === "ended" || endsAt <= currentTime;
};

export const isSnipeBid = ({
  auction,
  now,
}: {
  auction: Auction;
  now?: number;
}) => {
  const currentTime = now ?? Date.now();
  const msLeft = auction.endsAt - currentTime;

  return auction.status === "active" && msLeft > 0 && msLeft < 10000;
};

export const applyNewBidEvent = ({
  auctions,
  event,
}: {
  auctions: Auction[];
  event: NewBidEventData;
}) => {
  return auctions.map((auction) => {
    if (auction.id !== event.auctionId) {
      return auction;
    }

    return {
      ...auction,
      currentBid: event.amount,
      currentBidder: event.bidder,
    };
  });
};

export const applyAuctionEndedEvent = ({
  auctions,
  event,
}: {
  auctions: Auction[];
  event: AuctionEndedEventData;
}) => {
  return auctions.map((auction) =>
    auction.id === event.auctionId
      ? {
          ...auction,
          status: "ended" as const,
          winner: event.winner,
          currentBid: event.finalPrice,
          currentBidder: event.winner,
        }
      : auction
  );
};