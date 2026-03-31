# Noa's Vintage Shop Auctions 🛍️

A real-time auction platform frontend built with React and TypeScript. Users can browse active auctions, place bids, view bidding history, and receive live updates via Server-Sent Events (SSE).

---

## Features

- **Real-time updates** — live bid and auction-end events streamed from the server via SSE
- **Snipe detection** — alerts users when a bid is placed in the last 10 seconds of an auction
- **Live countdown timers** — per-auction countdowns that turn red when time is running out (< 30s)
- **Bidding history modal** — view the full bid history for any auction, with the winner highlighted
- **Auto-reconnect** — automatically reconnects to the SSE stream if the connection drops
- **Duplicate-bid deduplication** — prevents the same SSE event from being applied twice

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Language | TypeScript |
| Styling | Bootstrap 5 + custom CSS |
| Testing | Vitest |
| Build tool | Vite (inferred) |
| API transport | REST + Server-Sent Events |

---

## Project Structure

```
src/
├── api/
│   └── auctionsApi.ts          # API calls and TypeScript types
├── components/
│   ├── AuctionCatalog.tsx       # Main catalog with SSE connection logic
│   ├── AuctionCatalog.css
│   ├── AuctionItemCard.tsx      # Individual auction card
│   ├── AuctionItemCard.css
│   ├── AuctionCountdownBadge.tsx # Live countdown timer component
│   └── modals/
│       ├── UserBidModal.tsx     # Modal for placing a bid
│       ├── UserBidModal.css
│       └── BiddingHistoryModal.tsx # Modal for viewing bid history
├── utils/
│   ├── auctionLogic.ts          # Pure business logic (bid validation, state updates)
│   ├── auctionLogic.test.ts
│   ├── timer.ts                 # Timer formatting utilities
│   └── timer.test.ts
├── App.tsx
└── main.tsx
```

---

## Getting Started


# Development Approach & Thought Process
My development process began with understanding the assignment itself before diving into the implementation. I first read through the project description and requirements without looking at the server code. The goal of this first pass was to gain a high-level understanding of the system: what the application should do, what the main components are, and how the user is expected to interact with it.

After this initial overview, I performed a second, deeper reading of the requirements. During this stage I started designing the application's architecture. I outlined the pages and components I would need, thought about how they would interact with each other, and identified the key aspects that required special attention (such as real-time updates, auction state changes, and UI responsiveness).

Once I had a clear architectural direction, I moved on to studying the server implementation. This allowed me to better understand how the backend works, how the API behaves, and what data structures and events the frontend would need to handle.

With this understanding in place, I began implementing the application component by component. During this stage I occasionally consulted AI tools as a development aid. I used them mainly for brainstorming, generating initial structural ideas, or suggesting a basic implementation starting point. However, every piece of code was carefully reviewed and refined. I adjusted naming conventions, improved clarity, ensured the logic matched the requirements, and verified that the implementation avoided unnecessary renders and followed clean, readable patterns so that the codebase would be easy to understand and maintain.

After completing the core functionality, I moved into a final refinement phase. This included reviewing the entire codebase again, improving naming consistency, polishing the UI, and ensuring visual consistency across the application. I focused on creating a clean and intuitive user experience so that a user encountering the system for the first time can immediately understand how to interact with it. Layout, spacing, colors, and visual hierarchy were adjusted to ensure the interface feels cohesive, readable, and easy to navigate.

### Prerequisites

- Node.js 18+
- A running backend API on `http://localhost:3005`

### Installation

```bash
npm install
```

### Running the app

```bash
npm run dev
```

### Running tests

```bash
cd client
npm test
```

---

## API

The frontend connects to a backend at `http://localhost:3005`. The base URL is configured in `src/api/auctionsApi.ts`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auctions` | List all auctions |
| `GET` | `/api/auctions/:id` | Get auction details + bid history |
| `POST` | `/api/bid` | Place a bid |
| `GET` | `/api/stream` | SSE stream for live events |

### SSE Events

| Event | Payload | Description |
|---|---|---|
| `new_bid` | `{ bid_id, auctionId, bidder, amount }` | A new bid was placed |
| `auction_ended` | `{ auctionId, winner, finalPrice }` | An auction has ended |
| `heartbeat` | — | Keepalive ping |

---

## Key Behaviors

**Snipe Alert** — if a bid arrives when less than 10 seconds remain on an active auction, the card flashes a snipe warning for 8 seconds.

**Server Status Indicator** — a colored dot (🟢 / 🟡 / 🔴) shows the current SSE connection state. The app automatically retries every 2 seconds on disconnect.

**Bid Validation** — client-side validation requires a non-empty bidder name and an amount strictly greater than the current bid. The server also validates and returns `400` (bid too low) or `409` (auction ended) as needed..