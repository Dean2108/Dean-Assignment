# AI Usage Documentation & Reflections (PROMPTS.md)

# Note 
 Throughout the development process I consulted several AI tools as brainstorming and problem-solving assistants. This document does not include every interaction, but instead highlights the most meaningful prompts and questions that helped unblock development or influenced key technical decisions in the project

## 1. Component Architecture & State Synchronization (Timer & UI)
**The Prompt I used:** "ok lets start with the AuctionItemCard. the props are: itemName, Image, itemId, CurrentBid, CurrentBidder, TimerToEnd, winner... [detailed layout instructions]... yes i want you to build for me the auction catalog: i want to see first on the upper left side with a colored dot what is my server status... under that i want to see 2 sections first one in active auctions currently running and second section of finished auctions."

**What I expected:** A responsive grid layout and a structured `AuctionItemCard` component, along with a timer mechanism to handle the countdown.

**What I got:** The AI provided a good visual scaffolding using Flexbox/Grid and separated the lists into 'Active' and 'Finished'. However, for the timer, it suggested a naive approach using `setInterval` to decrement a local state variable every second.

**What I changed/learned/Reflections:** accuracy matters. Relying on setInterval to mutate state causes drift (especially if the browser tab goes to the background). I discarded the AI's timer logic and implemented a robust delta-calculation mechanism that compares Date.now() against the server's endsAt timestamp on every tick, ensuring perfect synchronization regardless of main-thread blocking. I also had to implement dynamic state derivation so items automatically move to the "Finished" section when the calculated time reaches zero.

Another issue I discovered during development was unnecessary re-renders. Initially, the timer logic lived inside the auction card component, which meant every clock tick triggered a re-render of the entire card. Since the timer updates every second, this created avoidable rendering overhead across the catalog. To optimize this, I extracted the timer into a dedicated Timer component. This isolates the frequent state updates to a small subtree and prevents the rest of the auction card (image, bid button, etc.) from re-rendering on every tick, significantly reducing unnecessary renders.

---

## 2. SSE Connection, Deduplication & Auto-Reconnect Strategy
**The Prompt I used:** "ok now its time to do the sse service and to handle all of the problems i will remid you: [pasted requirements for SSE, auto-reconnect, and duplicate handling]... i need also add dedup.ts"

**What I expected:** A robust service layer handling the `EventSource` connection, listening for `new_bid` and `auction_ended`, filtering out `heartbeat` events, and managing the 45-second drops.

**What I got:** The AI generated a basic `useEffect` with an `EventSource` instantiation. It included standard event listeners and a simple array `.find()` check for deduplication. 

**What I changed/learned/Reflections:** The AI's solution was too basic for the "chaos" of this mock server. 
1. **Reconnection:** The AI didn't handle the 45s connection drops properly. I had to manually engineer an `onerror` handler with an auto-reconnect mechanism (exponential backoff) and ensure it fetches a fresh list of auctions (`/api/auctions`) upon reconnecting to bridge any data gaps.
2. **Deduplication:** Checking an array with `.find()` on every incoming SSE event is O(n) and inefficient for rapid updates. I created a dedicated `dedup.ts` utility utilizing a `Set` to store processed `bid_id`s, ensuring O(1) lookups and preventing duplicate DOM renders when the server sends identical events.

---

## 3. Handling Network Delays & Race Conditions (400 / 409)
**The Prompt I used:** "ok lets handle 400 and 409 also i need to add spinner for waiting utill my bid is accepted or not"

**What I expected:** An async `POST /api/bid` function with loading state management and error handling for the specific assignment edge cases (outbid during delay, auction ended).

**What I got:** A standard `try/catch` wrapper that toggled an `isLoading` state and alerted the `error.message`.

**What I changed/learned/Reflections:** The AI didn't fully grasp the UX implications of the server's 800-2500ms intentional delay. I implemented a more sophisticated UI feedback loop. When a 400 status is returned (meaning a bot outbid the user while their request was in-flight), I ensure the UI immediately reflects the *new* highest bid from the server response and prompts the user to try again. For 409 (auction ended during bid), I immediately lock the bid button and trigger the "finished" state UI. The AI's generic error handling wasn't enough; the errors had to drive business logic and state transitions.

---

## 4. Modal Interactions & Real-Time Updates
**The Prompt I used:** "ok i need the next modal window: biding history: when i click on the name or image i want you to open history modal that show the starting biding and then show a rout of the biding and the bider and it will end with the winner biding and bidder in green"

**What I expected:** A modal component that fetches `/api/auctions/:id` on mount and displays the bidding trajectory.

**What I got:** A static modal that fetched the history once and rendered the list.

**What I changed/learned/Reflections:** The AI created a stale closure. If a user kept the history modal open, it wouldn't reflect new bids arriving via the SSE stream in the background. I refactored the component to subscribe to the global auction state, ensuring the history list appends new bids dynamically while the modal is open, without requiring the user to close and reopen it.

---

## 5. Decoupling Logic for Unit Testing
**The Prompt I used:** "I want you to explore the full context of the visual studio code i procided you with, and i want you to run me the following unit test ### 6. Unit Tests... make sure you go over all project files for context and let me know if you have anything missing"

**What I expected:** 5 meaningful unit tests covering validation, duplicate detection, and countdown math.

**What I got:** The AI struggled to write tests initially because my early code had business logic tightly coupled inside React components (e.g., timer math inside the component body). 

**What I changed/learned/Reflections:** This prompt forced me to rethink my architecture. The AI's inability to easily test my components taught me to extract core logic into pure functions. I pulled the timer delta calculation, the bid validation rules, and the deduplication logic out into separate, framework-agnostic utility files. Once the logic was decoupled from the DOM manipulation, writing the tests (as requested by the assignment) became straightforward and the codebase became much cleaner.