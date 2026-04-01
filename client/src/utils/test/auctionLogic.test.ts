import { describe, expect, it } from "vitest";
import {
  applyAuctionEndedEvent,
  applyNewBidEvent,
  isAuctionEnded,
  isSnipeBid,
  registerBidEvent,
  validateBid,
  type Auction,
} from "./auctionLogic";

describe("auctionLogic", () => {
  describe("validateBid", () => {
    it("fails when bidder name is empty", () => {
      const result = validateBid({
        bidder: "   ",
        amount: 120,
        currentBid: 100,
      });

      expect(result).toEqual({
        valid: false,
        error: "Bid must include your name.",
      });
    });

    it("fails when amount is not higher than current bid", () => {
      const result = validateBid({
        bidder: "Dean",
        amount: 100,
        currentBid: 100,
      });

      expect(result).toEqual({
        valid: false,
        error: "Bid must be higher than current bid.",
      });
    });

    it("passes when bidder name is present and amount is higher", () => {
      const result = validateBid({
        bidder: "Dean",
        amount: 101,
        currentBid: 100,
      });

      expect(result).toEqual({
        valid: true,
        error: "",
      });
    });
  });

  describe("registerBidEvent", () => {
    it("accepts a new bid id the first time", () => {
      const seenBidIds = new Set<string>();

      const result = registerBidEvent(seenBidIds, "bid-1");

      expect(result.isDuplicate).toBe(false);
      expect(seenBidIds.has("bid-1")).toBe(true);
    });

    it("detects a duplicate bid id the second time", () => {
      const seenBidIds = new Set<string>(["bid-1"]);

      const result = registerBidEvent(seenBidIds, "bid-1");

      expect(result.isDuplicate).toBe(true);
      expect(seenBidIds.size).toBe(1);
    });
  });

  describe("isAuctionEnded", () => {
    it("returns true when status is ended", () => {
      const result = isAuctionEnded({
        status: "ended",
        endsAt: 9999999999999,
        now: 1000,
      });

      expect(result).toBe(true);
    });

    it("returns true when auction time already passed", () => {
      const result = isAuctionEnded({
        status: "active",
        endsAt: 1000,
        now: 1001,
      });

      expect(result).toBe(true);
    });

    it("returns false when auction is active and time has not passed", () => {
      const result = isAuctionEnded({
        status: "active",
        endsAt: 5000,
        now: 1000,
      });

      expect(result).toBe(false);
    });
  });

  describe("isSnipeBid", () => {
    const baseAuction: Auction = {
      id: "a1",
      title: "Vintage Clock",
      image: "🕰️",
      currentBid: 200,
      currentBidder: "Dana",
      endsAt: 0,
      status: "active",
      winner: null,
    };

    it("returns true for an active auction with less than 10 seconds left", () => {
      const result = isSnipeBid({
        auction: {
          ...baseAuction,
          endsAt: 9000,
        },
        now: 1000,
      });

      expect(result).toBe(true);
    });

    it("returns false when more than 10 seconds remain", () => {
      const result = isSnipeBid({
        auction: {
          ...baseAuction,
          endsAt: 20000,
        },
        now: 1000,
      });

      expect(result).toBe(false);
    });

    it("returns false for ended auctions", () => {
      const result = isSnipeBid({
        auction: {
          ...baseAuction,
          status: "ended",
          endsAt: 9000,
        },
        now: 1000,
      });

      expect(result).toBe(false);
    });
  });

  describe("applyNewBidEvent", () => {
    it("updates only the matching auction", () => {
      const auctions: Auction[] = [
        {
          id: "a1",
          title: "Clock",
          image: "🕰️",
          currentBid: 100,
          currentBidder: "Alice",
          endsAt: 10000,
          status: "active",
          winner: null,
        },
        {
          id: "a2",
          title: "Lamp",
          image: "💡",
          currentBid: 50,
          currentBidder: null,
          endsAt: 10000,
          status: "active",
          winner: null,
        },
      ];

      const updated = applyNewBidEvent({
        auctions,
        event: {
          bid_id: "bid-22",
          auctionId: "a2",
          bidder: "Dean",
          amount: 75,
        },
      });

      expect(updated).toEqual([
        {
          id: "a1",
          title: "Clock",
          image: "🕰️",
          currentBid: 100,
          currentBidder: "Alice",
          endsAt: 10000,
          status: "active",
          winner: null,
        },
        {
          id: "a2",
          title: "Lamp",
          image: "💡",
          currentBid: 75,
          currentBidder: "Dean",
          endsAt: 10000,
          status: "active",
          winner: null,
        },
      ]);
    });
  });

  describe("applyAuctionEndedEvent", () => {
    it("moves the matching auction to ended state and sets winner/final price", () => {
      const auctions: Auction[] = [
        {
          id: "a1",
          title: "Clock",
          image: "🕰️",
          currentBid: 100,
          currentBidder: "Alice",
          endsAt: 10000,
          status: "active",
          winner: null,
        },
      ];

      const updated = applyAuctionEndedEvent({
        auctions,
        event: {
          auctionId: "a1",
          winner: "Dean",
          finalPrice: 180,
        },
      });

      expect(updated).toEqual([
        {
          id: "a1",
          title: "Clock",
          image: "🕰️",
          currentBid: 180,
          currentBidder: "Dean",
          endsAt: 10000,
          status: "ended",
          winner: "Dean",
        },
      ]);
    });
  });
});