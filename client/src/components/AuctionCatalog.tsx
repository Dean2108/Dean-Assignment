import { useEffect, useRef, useState } from "react";
import { AuctionItemCard } from "./AuctionItemCard";
import "./AuctionCatalog.css";
import { getAuctions, connectToAuctionStream, type AuctionItemDetails , type NewBidEventData , type AuctionEndedEventData } from "../api/auctionsApi";

type ServerStatus = "connected" | "disconnected" | "reconnecting";

export const AuctionCatalog = () => {
  const [auctionItems, setAuctionItems] = useState<AuctionItemDetails[]>([]);
  const [serverStatus, setServerStatus] = useState<ServerStatus>("disconnected");
  const [snipeAlerts, setSnipeAlerts] = useState<Record<string, boolean>>({});

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenBidIDsRef = useRef<Set<string>>(new Set());
  const snipeTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const fetchAuctions = async () => {
    try {
      const data = await getAuctions();
      setAuctionItems(data);
    } catch (err) {
      console.error("Error fetching auctions:", err);
    }
  };

  const triggerSnipeAlert = (auctionId: string) => {
    setSnipeAlerts(prev => ({
      ...prev,
      [auctionId]: true,
    }));

    const existingTimeout = snipeTimeoutsRef.current[auctionId];
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    snipeTimeoutsRef.current[auctionId] = setTimeout(() => {
      setSnipeAlerts(prev => ({
        ...prev,
        [auctionId]: false,
      }));

      delete snipeTimeoutsRef.current[auctionId];
    }, 8000);
  };

  useEffect(() => {
    const connect = () => {
      setServerStatus("reconnecting");

      const source = connectToAuctionStream();
      eventSourceRef.current = source;

      source.onopen = () => {
        setServerStatus("connected");
        fetchAuctions();
      };

      source.onerror = () => {
        setServerStatus("disconnected");
        source.close();

        reconnectTimeoutRef.current = setTimeout(() => {
          seenBidIDsRef.current.clear();
          connect();
        }, 2000);
      };

      source.addEventListener("new_bid", (e: Event) => {
        const messageEvent = e as MessageEvent;
        const data = JSON.parse(messageEvent.data) as NewBidEventData;

        if (seenBidIDsRef.current.has(data.bid_id)) {
          return;
        }

        seenBidIDsRef.current.add(data.bid_id);

        setAuctionItems(prev =>
          prev.map(auction => {
            if (auction.id !== data.auctionId) {
              return auction;
            }

            const msLeft = auction.endsAt - Date.now();
            const isSnipeBid = auction.status === "active" && msLeft > 0 && msLeft < 10000;

            if (isSnipeBid) {
              triggerSnipeAlert(auction.id);
            }

            return {
              ...auction,
              currentBid: data.amount,
              currentBidder: data.bidder,
            };
          })
        );
      });

      source.addEventListener("auction_ended", (e: Event) => {
        const messageEvent = e as MessageEvent;
        const data = JSON.parse(messageEvent.data) as AuctionEndedEventData;

        setAuctionItems(prev =>
          prev.map(auctionItem =>
            auctionItem.id === data.auctionId
              ? {
                  ...auctionItem,
                  status: "ended",
                  winner: data.winner,
                  currentBid: data.finalPrice,
                  currentBidder: data.winner,
                }
              : auctionItem
          )
        );

        setSnipeAlerts(prev => ({
          ...prev,
          [data.auctionId]: false,
        }));

        const timeout = snipeTimeoutsRef.current[data.auctionId];
        if (timeout) {
          clearTimeout(timeout);
          delete snipeTimeoutsRef.current[data.auctionId];
        }
      });

      source.addEventListener("heartbeat", () => {});
    };

    connect();
    fetchAuctions();

    return () => {
      eventSourceRef.current?.close();

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      Object.values(snipeTimeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  const activeAuctions = auctionItems.filter(auctionItem => auctionItem.status === "active");
  const endedAuctions = auctionItems.filter(auctionItem => auctionItem.status === "ended");

  return (
    <div className="container py-4 catalogContainer">
      <div className="d-flex align-items-center mb-4 serverStatus">
        <span className="fw-bold">
          {serverStatus === "connected" && "🟢 Connected"}
          {serverStatus === "disconnected" && "🔴 Disconnected"}
          {serverStatus === "reconnecting" && "🟡 Reconnecting"}
        </span>
      </div>

      <h1 className="appHeader text-dark-emphasis text-center mb-5">
        Noa&apos;s Vintage Shop Auctions
      </h1>

      <section className="border py-3 rounded">
        <h2 className="mb-4 fs-2 text-dark-emphasis">Active Auctions</h2>

        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          { activeAuctions.length > 0 ?
          (activeAuctions.map(auctionItem => (
            <div className="col" key={auctionItem.id}>
              <AuctionItemCard
                itemName={auctionItem.title}
                image={auctionItem.image}
                itemId={auctionItem.id}
                currentBid={auctionItem.currentBid}
                currentBidder={auctionItem.currentBidder}
                endsAt={auctionItem.endsAt}
                winner={auctionItem.winner || null}
                status={auctionItem.status}
                isSniping={Boolean(snipeAlerts[auctionItem.id])}
              />
            </div>
          )))
            :
            (
              <div className="align-items-center d-flex fw-bold justify-content-center w-100">All Auctions Ended</div>
            )
          }
        </div>
      </section>

      <hr className="my-5" />

      <section className="border py-3 rounded">
        <h2 className="mb-4 fs-2 text-dark-emphasis text-muted">Finished Auctions</h2>

        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          { endedAuctions.length > 0 ?
          (endedAuctions.map(auctionItem => (
            <div className="col" key={auctionItem.id}>
              <AuctionItemCard
                itemName={auctionItem.title}
                image={auctionItem.image}
                itemId={auctionItem.id}
                currentBid={auctionItem.currentBid}
                currentBidder={auctionItem.currentBidder}
                endsAt={auctionItem.endsAt}
                winner={auctionItem.winner || null}
                status={auctionItem.status}
                isSniping={false}
              />
            </div>
          )))
            :
            (
              <div className="align-items-center d-flex fw-bold justify-content-center w-100">All Auctions Active</div>
            )
            }
        </div>
      </section>
    </div>
  );
};