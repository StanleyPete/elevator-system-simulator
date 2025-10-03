# Elevator System Simulator
---
## 🛠 Tech Stack

**Frontend (fe/):**
- React
- Vite
- TypeScript
- WebSockets (Socket.IO Client)

**Backend (be/):**
- NestJS
- TypeScript
- WebSockets (Socket.IO)

## ⚡Prerequisites

Before running the project, make sure you have the following installed:

- Node.js (v22)
- Git

## ⚡ Installation

Follow these steps to set up and run the project locally:

### 1. Clone the repository
```bash
git clone https://github.com/StanleyPete/elevator-system-simulator
cd elevator-system-simulator
````

### 2. Install all dependencies
```bash
npm run install-all
````

## ⚡ Running
The backend and frontend need to run in separate terminals. 
Make sure backend is run first.
### 1. Start the Backend
Open the first terminal and navigate to the backend folder:
```bash
cd be
npm run start
````
### 2. Start the FrontEnd
```bash
cd fe
npm run dev
````
### 3. Open the application
Once both backend and frontend are running, open your browser and go to:
```bash
http://localhost:5173
````

## 🛠 Implemented Solutions
### 1. Frontend
- *Note: I'm not a designer, so the UI is functional but intentionally simple.*
- React + Vite + TypeScript for fast, modern frontend development.
- Socket.IO Client to receive real-time updates from the backend.
- Displays elevator positions, requests, and movement in a visual UI.
### 2. Backend
- NestJS for scalable and structured server architecture.
- Written in TypeScript for type safety and better maintainability.
- Handles elevator logic, requests queue, and WebSocket connections.
### 3. Real-time Communication
- Used Socket.IO on both backend and frontend for real-time communication between elevators and the UI.
- Ensures instant updates of elevator positions and requests without page reloads.
### 4. Project Structure
- **Monorepo setup** with separate `be/` and `fe/` folders, managed from a root `package.json`.
- Scripts to install dependencies and run both frontend and backend easily.

## 🚀 Elevator System Features & Optimizations

- **Dynamic Floors and Elevators**  
  The frontend sends settings (`totalFloors`, `numberOfElevators`) to the backend, allowing the system to support any number of floors and elevators.  
  The backend automatically maps elevators and their starting positions, making this solution scalable for both a 10-floor building and a 100-floor skyscraper with multiple elevators.
  - *Note: The frontend visualization is currently limited to 10 floors and 3 elevators for display purposes.*

- **Intelligent Internal Panel Queue**  
  Requests from elevator internal panels are sorted based on the elevator’s current direction. For example, if the elevator is moving up, new requests in the same direction are added in ascending order, reducing unnecessary floor skipping.

- **Multiple-Click Prevention**  
  Floor call buttons and internal panel buttons are blocked from repeated activation until the request is fulfilled. Button color indicates pending calls on the frontend.

- **Safe Handling of Current Floor Requests**  
  If an elevator is already on the requested floor, clicking the button does nothing and does not turn it green, avoiding unnecessary signals or visual bugs.

- **Separate WebSocket Events**  
  The backend emits distinct events: `elevatorUpdate`, `elevatorStopped`, and `panelButtonReset`. This allows the frontend to accurately update elevator states and button statuses while minimizing unnecessary data transfer.

- **Optimized Queue for Dynamic Requests**  
  Floor requests in the queue are sorted efficiently, allowing elevators to serve calls in order without sudden direction changes or inefficient floor jumps.

- **User-Friendly and Predictable**  
  These improvements make the system flexible, predictable, and intuitive, while the backend logic reflects real-world elevator behavior more accurately.




