/*  eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import { useState, useRef } from "react";
import { request, notify, localApi } from "@tfdidesign/smartcars3-ui-sdk";
import { useEffect } from "react";
import { useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import MapContainer from "../components/map";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendar,
  faCalendarDay,
  faGlobe,
  faPlaneArrival,
  faRefresh,
  faSuitcase,
} from "@fortawesome/free-solid-svg-icons";

const baseUrl = "http://localhost:7172/api/com.cav.live-flights/";

const LiveFlightTable = (props) => {
  const [logBookInstalled, setLogBookInstalled] = useState(false);
  const [flightsLoading, setFlightsLoading] = useState(false);
  const [expandedFlight, setExpandedFlight] = useState(null);
  const [flights, setFlights] = useState([]);
  const [recoverableFlight, setRecoverableFlight] = useState(null);
  const [width, setWidth] = useState(0);
  const widthRef = useRef(null);

  const getFlights = async () => {
    setFlightsLoading(true);
    try {
      const response = await request({
        url: baseUrl + "flights",
        method: "GET",
        params: {
          nocache: true,
        },
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

  const setHeight = (elID) => {
    const el = document.getElementById(elID);
    if (!!!el) return;
    const viewHeight = window.innerHeight;
    const elOffTop = el.offsetTop;
    const marginBottom = 0;
    const newHeight = viewHeight - elOffTop - marginBottom;
    el.style.height = newHeight + "px";
  };

  const updateWidth = () => {
    if (!widthRef.current) return;
    setWidth(widthRef.current.offsetWidth);
  };

  const onWindowResize = () => {
    setHeight("tblBody");
    updateWidth();
  };

  useEffect(() => {
    getFlights();
  }, []);

  useLayoutEffect(() => {
    setHeight("tblBody");
    updateWidth();
  }, []);

  useEffect(() => {
    window.addEventListener("resize", onWindowResize);
    onWindowResize();

    return (_) => {
      window.removeEventListener("resize", onWindowResize);
    };
  });

  return (
    <div className="root-container">
      <div className="grid grid-cols-12 mb-3 mx-8">
        <h2 className="color-accent-bkg col-span-12">Live Flights</h2>
      </div>

      <div className="grid grid-cols-12 mb-3 mx-8 map">
        <span className="color-accent-bkg col-span-12">
          <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: "100vh", width: "100%" }} />
        </span>
      </div>

      <div
        ref={widthRef}
        className="grid grid-cols-12 data-table-header p-3 mt-3 mx-8"
      >
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

      <div id="tblBody" className="overflow-y-auto pl-8">
        {flights.length > 0 ? (
          flights.map((flight) => (
            <div
              key={flight.id}
              className="data-table-row grid grid-cols-12 p-3 mt-1 mr-8 border-b"
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
                {flight.distremain} <span class="fs-7 fw-lighter">nm</span>
              </div>
              <div className="text-left flex items-center">
                {flight.timeremain} <span class="fs-7 fw-lighter">HH:MM</span>
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
  );
};

const LiveFlights = ({ identity }) => {
  const [isLoading, setIsLoading] = useState(false);

  return <LiveFlightTable loading={isLoading} />;
};

export default LiveFlights;
