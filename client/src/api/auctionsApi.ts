
export const API_BASE_URL = "http://localhost:3005";

export interface Bid {
  bid_id: string;
  bidder: string;
  amount: number;
  timestamp: number;
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

export type AuctionStatus = "active" | "ended";

export interface AuctionItemDetails {
  id: string;
  title: string;
  image: string;
  currentBid: number;
  currentBidder: string | null;
  endsAt: number;
  status: AuctionStatus;
  winner?: string | null;
}

export interface AuctionDetailsResponse {
  id: string;
  title: string;
  image: string;
  currentBid: number;
  currentBidder: string | null;
  endsAt: number;
  startPrice?: number;
  status: AuctionStatus;
  bidHistory: Bid[];
  winner?: string | null;
}

export const getAuctions = async (): Promise<AuctionItemDetails[]> => {
  const res = await fetch(`${API_BASE_URL}/api/auctions`);
  if (!res.ok) {
    throw new Error(`Failed to fetch auctions: ${res.status}`);
  }
  return res.json();
};

export const getAuctionDetails = async (auctionId: string): Promise<AuctionDetailsResponse> => {
  const res = await fetch(`${API_BASE_URL}/api/auctions/${auctionId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch auction history: ${res.status}`);
  }
  return res.json();
};

export const placeBid = async (auctionId: string, bidder: string, amount: number): Promise<Response> => {
  return fetch(`${API_BASE_URL}/api/bid`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ auctionId, bidder, amount }),
  });
};

export const connectToAuctionStream = (): EventSource => {
  return new EventSource(`${API_BASE_URL}/api/stream`);
};