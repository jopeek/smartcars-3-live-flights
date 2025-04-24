/*  eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { request, notify } from "@tfdidesign/smartcars3-ui-sdk";
import { faRefresh, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import MapContainer from "../components/map";
import Select from "react-select"; // Import react-select

const baseUrl = "http://localhost:7172/api/com.cav.live-flights/";

const LiveFlightTable = (props) => {
  const [flightsLoading, setFlightsLoading] = useState(false);
  const [flights, setFlights] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false); // Sidebar state
  const [chatMessages, setChatMessages] = useState([]); // Chat messages
  const [newMessage, setNewMessage] = useState(""); // New message input
  const [lastMessageCount, setLastMessageCount] = useState(0); // Track the last number of messages
  const [hasNewMessages, setHasNewMessages] = useState(false); // Track if there are new messages
  const [autocompleteOptions, setAutocompleteOptions] = useState([]); // Options for autocomplete
  const [autocompleteVisible, setAutocompleteVisible] = useState(false); // Autocomplete visibility
  const [isSendDisabled, setIsSendDisabled] = useState(false); // State to track button disabled state
  const mapRef = useRef(null);
  const chatMessagesRef = useRef(null); // Reference for chat messages container
  const inputRef = useRef(null); // Reference for the input box
  const dropdownRef = useRef(null); // Reference for the dropdown container

  const getFlights = async () => {
    setFlightsLoading(true);
    try {
      const response = await request({
        url: baseUrl + "flights",
        method: "GET",
        params: {},
      });

      setFlights(response); // Update the flights state with the response data
      setAutocompleteOptions(
        response.map((flight) => flight.pilotnameRaw).sort((a, b) => a.localeCompare(b))
      ); // Extract and sort pilot names alphabetically
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

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      setIsSendDisabled(true); // Disable the button
      try {
        await request({
          url: baseUrl + "sendMessage",
          method: "POST",
          data: { message: newMessage },
        });
        setNewMessage(""); // Clear the input field
        await getChatMessages(); // Fetch updated chat messages
      } catch (error) {
        console.error("Error sending message:", error);
        notify("live-flights", null, null, {
          message: "Failed to send message",
          type: "danger",
        });
      } finally {
        setIsSendDisabled(false); // Re-enable the button after messages are updated
      }
    }
  };

  const handleInputChange = (value) => {
    setNewMessage(value);

    // Show the dropdown only if "@" is the last character
    if (value.endsWith("@")) {
      setAutocompleteVisible(true);

      // Manually focus the dropdown
      setTimeout(() => {
        const dropdown = document.querySelector('[role="listbox"]'); // Query the dropdown by its role
        if (dropdown) {
          //dropdown.setAttribute("tabindex", "-1"); // Make it focusable
          dropdown.focus();
        }
      }, 0);
    } else {
      setAutocompleteVisible(false); // Close the dropdown if "@" is not the last character
    }
  };

  const handleAutocompleteSelect = (selectedOption) => {
    const atIndex = newMessage.lastIndexOf("@");
    const updatedMessage =
      newMessage.substring(0, atIndex) + selectedOption.value + " "; // Replace the @ and add the selected text
    setNewMessage(updatedMessage);
    setAutocompleteVisible(false); // Hide the dropdown after selection
    inputRef.current.focus(); // Return focus to the input box
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !isSendDisabled) {
      handleSendMessage(); // Trigger the send message function
    }
  };

  useEffect(() => {
    // Load lastMessageCount from localStorage on component mount
    const storedMessageCount = localStorage.getItem("lastMessageCount");
    if (storedMessageCount) {
      setLastMessageCount(parseInt(storedMessageCount, 10));
    }
  }, []);

  const updateMessageCount = () => {
    if (isSidebarExpanded) {
      setLastMessageCount(chatMessages.length); // Update the last message count when the sidebar is expanded
      setHasNewMessages(false); // Reset the highlight
      localStorage.setItem("lastMessageCount", chatMessages.length); // Persist to localStorage
    } else if (chatMessages.length > lastMessageCount) {
      setHasNewMessages(true); // Highlight the toggle button if there are new messages
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

  useEffect(() => {
    updateMessageCount(); // Check for new messages whenever chatMessages or sidebar state changes
  }, [chatMessages, isSidebarExpanded]);

  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom(); // Scroll to the bottom whenever chatMessages change
  }, [chatMessages]);

  useEffect(() => {
    if (isSidebarExpanded) {
      scrollToBottom(); // Scroll to the bottom when the sidebar is expanded
    }
  }, [isSidebarExpanded]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current !== event.target
      ) {
        setAutocompleteVisible(false); // Close the dropdown if clicking outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const highlightPilotName = (message, pilotName) => {
    const regex = new RegExp(`(${pilotName})`, "gi");
    return message.replace(regex, '<span class="highlight">$1</span>');
  };

  const toggleSidebar = () => {
    setIsSidebarExpanded((prev) => {
      const newState = !prev;
      if (newState) {
        setTimeout(() => {
          inputRef.current?.focus(); // Focus the chat textbox when the sidebar is opened
        }, 0);
      }
      return newState;
    });
  };

  return (
    <div className="root-container flex">
      {/* Sidebar */}
      <div
        className={`sidebar ${
          isSidebarExpanded ? "expanded" : "collapsed"
        }`}
      >
        <div
          className={`toggle-button ${hasNewMessages ? "highlight" : ""}`} // Add highlight class if there are new messages
          onClick={toggleSidebar} // Use the new toggleSidebar function
          title="Toggle Chat Messages" // Tooltip added
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FontAwesomeIcon icon={isSidebarExpanded ? faChevronLeft : faChevronRight} />
        </div>
        {isSidebarExpanded && (
          <div className="sidebar-content">
            <div className="chat-messages hide-scrollbar" ref={chatMessagesRef}>
              {chatMessages.length > 0 ? (
                chatMessages.map((messageObj, index) => {
                  const isHighlighted =
                    props.identity?.va_user?.pilotRaw &&
                    messageObj.message.includes(props.identity.va_user.pilotRaw);
                  
                  return (
                    <div
                      key={messageObj.messageId || index}
                      className={`chat-message ${
                        props.identity &&
                        props.identity.va_user &&
                        messageObj.pilotId === props.identity.va_user.dbID
                          ? "own-message"
                          : "other-message"
                      } ${
                        isHighlighted
                          ? "highlighted-message"
                          : ""
                      }`}
                    >
                      <span
                        dangerouslySetInnerHTML={{
                          __html: messageObj.pilot || "Unknown Pilot",
                        }}
                      ></span>
                      <span
                        dangerouslySetInnerHTML={{
                          __html: highlightPilotName(
                            messageObj.message,
                            props.identity?.va_user?.pilotRaw || ""
                          ),
                        }}
                      ></span>
                      <div className="timestamp">
                        {new Date(messageObj.timestamp).toLocaleString()}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-messages">No messages yet</div>
              )}
            </div>
            <div className="chat-input" style={{ position: "relative" }}>
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyPress={handleKeyPress} // Add key press handler
                placeholder="Type a message..."
                style={{ flexGrow: 1, padding: "5px", marginRight: "10px" }}
              />
              {autocompleteVisible && (
                <div
                  ref={dropdownRef}
                  style={{ position: "absolute", bottom: "100%", left: 0, zIndex: 1000, width: "100%" }}
                >
                  <Select
                    options={autocompleteOptions.map((option) => ({ value: option, label: option }))}
                    onChange={handleAutocompleteSelect}
                    placeholder="Select a pilot"
                    menuIsOpen={true} // Keep the dropdown open
                    autoFocus={true} // Automatically focus the dropdown
                    onMenuClose={() => setAutocompleteVisible(false)} // Ensure dropdown closes properly
                    menuPlacement="top" // Make the dropdown drop "up"
                    className="pilot-autocomplete"
                    styles={{
                      menu: (provided) => ({ ...provided, zIndex: 1000 }),
                      control: (provided) => ({ ...provided, display: "none" }), // Hide the default input box of react-select
                    }}
                  />
                </div>
              )}
              <button
                onClick={handleSendMessage}
                disabled={isSendDisabled}
                className={`btn ${isSendDisabled ? "btn-disabled" : ""}`}
              >
                {`${isSendDisabled ? "Sending ..." : "Send Message"}`}
              </button>
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
                  className="text-left flex items-center" style={{ wordBreak: "break-all" }}
                  dangerouslySetInnerHTML={{ __html: flight.flightnum }}
                ></div>
                <div
                  className="text-left col-span-2 flex items-center"
                  dangerouslySetInnerHTML={{ __html: flight.pilot }}
                ></div>
                <div
                  className="text-left flex items-center" style={{ wordBreak: "break-all" }}
                  dangerouslySetInnerHTML={{ __html: flight.depicao }}
                ></div>
                <div
                  className="text-left flex items-center" style={{ wordBreak: "break-all" }}
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
                <div className="text-left flex items-center" style={{ wordBreak: "break-all" }}>
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
