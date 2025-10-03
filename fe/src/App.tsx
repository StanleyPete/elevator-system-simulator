import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import type { SysSettings, ElevatorState } from "./types";
import "./App.css";

function App() {
  // settings: these settings are sent to the backend, which initializes and maps the elevators accordingly.
  // this allows the system to handle any number of floors and elevators dynamically
  const settings: SysSettings = {
    totalFloors: 10,
    numberOfElevators: 3
  }
  const [elevators, setElevators] = useState<ElevatorState[]>(() =>
    Array.from({ length: settings.numberOfElevators }, (_, i) => ({
      id: i,
      currentFloor: Math.floor(Math.random() * (settings.totalFloors + 1)),
      targetFloors: [],
      movingDirection: "idle",
    })))
  const [socket, setSocket] = useState<Socket | null>(null);
  const floors = ["Ground Floor", ...Array.from({ length: settings.totalFloors }, (_, i) => `Floor ${i + 1}`)];
  const [calls, setCalls] = useState(Array(floors.length).fill(false));
  const [panelCalls, setPanelCalls] = useState(Array.from({ length: 3 }, () => Array(floors.length).fill(false)));


  //CALL ELEVATOR FROM THE FLOOR (OUTSIDE AN ELEVATOR)
  const handleCallElevator = (floorIndex: number) => {
      // Check if any elevator is already on the requested floor
      const isElevatorOnFloor = elevators.some(e => e.currentFloor === floorIndex);
      if (isElevatorOnFloor) return; // do nothing if an elevator is already there

      setCalls((prev) => {
        if (prev[floorIndex]) return prev;
        const newCalls = [...prev];
        newCalls[floorIndex] = true;
        return newCalls;
      });

      if (socket) {
        socket.emit('call-elevator', { floor: floorIndex });
      }
};


 // INTERNAL PANEL HANDLER FOR EACH ELEVATOR
 const handlePanelCall = (elevatorIndex: number, floorIndex: number) => {
    // Igonre if an elevator is already on the floor requested
    if (elevators[elevatorIndex]?.currentFloor === floorIndex) return;

    // Ignore if button is already clicked
    if (panelCalls[elevatorIndex][floorIndex]) return;

    // Making the button clicked (green)
    setPanelCalls((prev) => {
      const newState = prev.map((arr) => [...arr]);
      newState[elevatorIndex][floorIndex] = true;
      return newState;
    });

    // Emiting an event to server
    if (socket) {
      socket.emit("panel-call", {
        elevatorId: elevatorIndex,
        floor: floorIndex
      });
    }
};
          
  // USE EFFECT EXECUTED ONLY ONCE WHEN COMPONENT MOUNTS, HENCE MAKE SURE TO RUN BACKEND FIRST
  useEffect(() => {
      const newSocket = io("http://localhost:4000");
      setSocket(newSocket);

      //Emit settings and current elevator positions once connected
      newSocket.on("connect", () => {
          newSocket.emit("initial-data", {
            totalFloors: settings.totalFloors,
            numberOfElevators: settings.numberOfElevators,
            positions: elevators.map((e) => e.currentFloor)
          });
      });

      newSocket.on("elevatorUpdate", (data: { 
          elevatorId: number; 
          currentFloor: number; 
          movingDirection: "up" | "down" | "idle"; 
        }) => {
          setElevators((prev) => prev.map((e) =>
            e.id === data.elevatorId
              ? {
                  ...e,
                  currentFloor: data.currentFloor,
                  movingDirection: data.movingDirection,
                  status: "moving" 
                }
              : e
          ));
      });

      newSocket.on("elevatorStopped", (data: { elevatorId: number; floor: number }) => {
          setElevators((prev) => prev.map((e) =>
            e.id === data.elevatorId
              ? {
                  ...e,
                  currentFloor: data.floor,
                  movingDirection: "idle",
                  status: "stopped" 
                }
              : e
          ));

          // turning off 'call elevator' button
          setCalls(prev => prev.map((callActive, floorIndex) => (callActive && floorIndex === data.floor ? false : callActive)));
      });

      newSocket.on("panelButtonReset", (data: { elevatorId: number; floor: number }) => {
          setPanelCalls((prev) => {
            const newState = prev.map((arr) => [...arr]);
            newState[data.elevatorId][data.floor] = false; // turning off internal panel button
            return newState;
          });
      });

      return () => {
        newSocket.disconnect();
      };
  }, []);

  return (
    <div className="app">
      {/* Building */}
      <div className="building-wrapper">
        <div className="building">
          <div className="roof"></div>
          <div className="shaft-container">
            {elevators.map((elevator, index) => (
              <div key={index} className="shaft">
                <div
                  className="elevator"
                  style={{bottom: `${elevator.currentFloor * (100 / floors.length)}%`, height: `${100 / floors.length}%`,}}
                >
                  {index + 1}
                </div>
                <div className="shaft-grid">
                  <div className="cross-horizontal"></div>
                  <div className="cross-vertical"></div>
                </div>
              </div>
            ))}
          </div>

          <div className="floors-container">
            {floors.map((_, idx) => (
              <div key={idx} className="floor-row">
                <div className="windows-left">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="window"></div>
                  ))}
                </div>

                <div className="shaft-space-row"></div>

                <div className="windows-right">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="window"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call Elevator Buttons */}
        <div className="floor-buttons-column">
          {floors.map((floorName, idx) => (
            <div key={idx} className="floor-row-button">
              <span className="floor-name">{floorName}</span>
              <button
                className="call-elevator"
                style={{ backgroundColor: calls[idx] ? "green" : "initial" }}
                onClick={() => handleCallElevator(idx)}
              >
                Call Elevator
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Elevator Internal Panels */}
      <div className="elevator-panels-column">
        {Array.from({ length: 3 }, (_, elevatorIndex) => (
         <div className="elevator-panel">
            <h4>Elevator {elevatorIndex + 1} Internal Panel</h4>

            <div className="panel-row">
              {/* Floor buttons */}
              <div className="panel-buttons">
                {floors.slice(1).reverse().map((_, floorIndex) => (
                  <button
                    key={floorIndex}
                    className="panel-floor-button"
                    style={{
                      backgroundColor: panelCalls[elevatorIndex][floors.length - 2 - floorIndex + 1]
                        ? "green"
                        : "#1a1a1a",
                    }}
                    onClick={() => handlePanelCall(elevatorIndex, floors.length - 2 - floorIndex + 1)}
                  >
                    {10 - floorIndex}
                  </button>
                ))}
                <button
                  className="panel-floor-button"
                  style={{
                    backgroundColor: panelCalls[elevatorIndex][0] ? "green" : "#1a1a1a",
                  }}
                  onClick={() => handlePanelCall(elevatorIndex, 0)}
                >
                  0
                </button>
              </div>

              {/* Direction and status */}
              <div 
                className="elevator-info" 
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>Direction:</span>
                  {elevators[elevatorIndex]?.movingDirection === "up" && (
                    <img src="/up.svg" alt="Up" width={20} height={20} />
                  )}
                  {elevators[elevatorIndex]?.movingDirection === "down" && (
                    <img src="/down.svg" alt="Down" width={20} height={20} />
                  )}
                  {elevators[elevatorIndex]?.movingDirection === "idle" && (
                    <img src="/idle.svg" alt="Idle" width={20} height={20} />
                  )}
                </div>
                <span>Status: {elevators[elevatorIndex]?.status ?? "stopped"}</span>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
