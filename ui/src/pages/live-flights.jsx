/*  eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { request, notify } from "@tfdidesign/smartcars3-ui-sdk";
import { faRefresh, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import MapContainer from "../components/map";

const baseUrl = "http://localhost:7172/api/com.cav.live-flights/";

const LiveFlightTable = (props) => {
  const [flightsLoading, setFlightsLoading] = useState(false);
  const [flights, setFlights] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false); // Sidebar state
  const [chatMessages, setChatMessages] = useState([]); // Chat messages
  const [newMessage, setNewMessage] = useState(""); // New message input
  const mapRef = useRef(null);

  const getFlights = async () => {
    setFlightsLoading(true);
    try {
      const response = await request({
        url: baseUrl + "flights",
        method: "GET",
        params: {},
      });

      setFlights(response); // Update the flights state with the response data
    } catch (error) {
      console.error("Error fetching flights:", error);
      setFlights([]); // Set flights to an empty array in case of an error
      notify("live-flights", null, null, {
        message: "Failed to get live flights",
        type: "danger",
      });
    }
    setFlightsLoading(false); // Stop the loading spinner
  };

  const getChatMessages = async () => {
    try {
      const response = await request({
        url: baseUrl + "chatMessages",
        method: "GET",
        params: {},
      });

      setChatMessages(response); // Update the chat messages state with the response data
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      notify("live-flights", null, null, {
        message: "Failed to get chat messages",
        type: "danger",
      });
    }
  };

  const setHeight = (elID) => {
    const el = document.getElementById(elID);
    if (!!!el) return;
    const newHeight = getHeight();
    el.style.height = newHeight + "px";
  };

  const getHeight = () => {
    const viewHeight = window.innerHeight;
    const marginBottom = 0;
    const newHeight = (viewHeight - marginBottom) / 2;
    return newHeight;
  };

  const onWindowResize = () => {
    //setHeight("tblBody");
    setHeight("mapContainer");
  };

  const handleRowClick = (flight) => {
    setSelectedFlight(flight);
    if (mapRef.current) {
      mapRef.current.selectMarker(flight);
      window.scrollTo(0, 0); // Scroll to the top of the window
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setChatMessages([...chatMessages, newMessage]);
      setNewMessage("");
    }
  };

  useEffect(() => {
    getFlights();
    getChatMessages(); // Fetch chat messages on component mount
    const interval = setInterval(() => {
      getFlights();
      getChatMessages(); // Refresh chat messages periodically
    }, 60000); // Reload data every 60 seconds

    return () => clearInterval(interval); // Clear interval on component unmount
  }, []);

  useLayoutEffect(() => {
    //setHeight("tblBody");
    setHeight("mapContainer");
  }, []);

  useEffect(() => {
    window.addEventListener("resize", onWindowResize);
    onWindowResize();
    return (_) => {
      window.removeEventListener("resize", onWindowResize);
    };
  });

  return (
    <div className="root-container flex">
      {/* Sidebar */}
      <div
        className={`sidebar ${
          isSidebarExpanded ? "expanded" : "collapsed"
        }`}
      >
        <div
          className="toggle-button"
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          title="Toggle Chat Messages" // Tooltip added
          style={{ display: "flex", alignItems: "center", justifyContent: "center" }} // Center alignment
        >
          <FontAwesomeIcon icon={isSidebarExpanded ? faChevronLeft : faChevronRight} />
        </div>
        {isSidebarExpanded && (
          <div className="sidebar-content">
            <div className="chat-messages">
              {chatMessages.length > 0 ? (
                chatMessages.map((messageObj, index) => (
                  <div
                    key={messageObj.messageId || index}
                    className={`chat-message ${
                      props.identity &&
                      props.identity.va_user &&
                      messageObj.pilotId === props.identity.va_user.dbID
                        ? "own-message"
                        : "other-message"
                    }`}
                  >
                    <span
                      dangerouslySetInnerHTML={{
                        __html: messageObj.pilot || "Unknown Pilot",
                      }}
                    ></span>
                    : {messageObj.message}
                    <div className="timestamp">
                      {new Date(messageObj.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-messages">No messages yet</div>
              )}
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
              />
              <button onClick={handleSendMessage}>Send Message</button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="main-content flex-grow">
        <div className="mb-3 mx-8">
          <div className="flex flex-row justify-between w-full">
            <div>
              <h2 className="color-accent-bkg col-span-12">Live Flights</h2>
            </div>
            <div>
              <div
                onClick={() => !flightsLoading && !props.loading && getFlights()}
                className="button button-hollow"
                style={{ marginLeft: "auto" }}
              >
                <span
                  className={
                    flightsLoading || props.loading ? "animate-spin" : ""
                  }
                >
                  <FontAwesomeIcon icon={faRefresh} />
                </span>
              </div>
            </div>
          </div>
        </div>

        {flights && flights.length > 0 && (
          <div id="mapContainer" className="grid-cols-12 mb-3 mx-8 map">
            <span className="color-accent-bkg col-span-12">
              <MapContainer
                center={[51.505, -0.09]}
                zoom={13}
                style={{ height: "50vh", width: "100%" }}
                ref={mapRef}
                mapData={flights}
              />
            </span>
          </div>
        )}

        <div className="grid grid-cols-12 data-table-header p-3 mt-3 mx-8">
          <div className="text-left">Flight Number</div>
          <div className="text-left col-span-2">Pilot</div>
          <div className="text-left">Dep ICAO</div>
          <div className="text-left">Arr ICAO</div>
          <div className="text-left col-span-2">Aircraft</div>
          <div className="text-left col-span-2">Type</div>
          <div className="text-left">Phase</div>
          <div className="text-left">DTG</div>
          <div className="text-left">ETA</div>
        </div>

        <div id="tblBody" className="pl-8">
          {flights.length > 0 ? (
            flights.map((flight) => (
              <div
                key={flight.id}
                className="data-table-row grid grid-cols-12 p-3 mt-1 mr-8 border-b liveFlightRow"
                onClick={() => handleRowClick(flight)}
              >
                <div
                  className="text-left flex items-center"
                  dangerouslySetInnerHTML={{ __html: flight.flightnum }}
                ></div>
                <div
                  className="text-left col-span-2 flex items-center"
                  dangerouslySetInnerHTML={{ __html: flight.pilot }}
                ></div>
                <div
                  className="text-left flex items-center"
                  dangerouslySetInnerHTML={{ __html: flight.depicao }}
                ></div>
                <div
                  className="text-left flex items-center"
                  dangerouslySetInnerHTML={{ __html: flight.arricao }}
                ></div>
                <div
                  className="text-left col-span-2 flex items-center"
                  dangerouslySetInnerHTML={{ __html: flight.aircraft }}
                ></div>
                <div
                  className="text-left col-span-2 flex items-center"
                  dangerouslySetInnerHTML={{ __html: flight.type }}
                ></div>
                <div className="text-left flex items-center">{flight.phase}</div>
                <div className="text-left flex items-center">
                  {flight.distremain}{" "}
                  <span
                    className="fs-7 fw-lighter"
                    style={{ marginLeft: "0.2rem", marginRight: "0.2rem" }}
                  >
                    nm
                  </span>
                </div>
                <div className="text-left flex items-center">
                  {flight.timeremain}{" "}
                  <span
                    className="fs-7 fw-lighter"
                    style={{ marginLeft: "0.2rem", marginRight: "0.2rem" }}
                  >
                    HH:MM
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="data-table-row p-3 mt-3 mr-8">
              There are currently no live flights.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LiveFlights = ({ identity }) => {
  const [isLoading] = useState(false);

  return <LiveFlightTable loading={isLoading} identity={identity} />;
};

export default LiveFlights;
