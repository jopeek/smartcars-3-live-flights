/*  eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import { useState, useRef } from "react";
import { request, notify, localApi } from "@tfdidesign/smartcars3-ui-sdk";
import { useEffect } from "react";
import { useLayoutEffect } from "react";
import { Link } from "react-router-dom";
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

      setFlightsLoading(response);
    } catch (error) {
      setFlights([]);

      notify("live-flights", null, null, {
        message: "Failed to get dispatched flights",
        type: "danger",
      });
    }
    setFlightsLoading(false);
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
      <div className="grid grid-cols-10 mb-3 mx-8">
        <h2 className="color-accent-bkg col-span-10">Live Flights</h2>
      </div>

      <div
        ref={widthRef}
        className="grid grid-cols-10 data-table-header p-3 mt-3 mx-8"
      >
        <div className="text-left col-span-2">Flight Number</div>
        <div className="text-left">Departure</div>
        <div className="text-left">Arrival</div>
        <div className="text-left">Distance</div>
        <div className="text-left">Type</div>
        <div className="col-span-3 text-left">Aircraft</div>
      </div>

      <div id="tblBody" className="overflow-y-auto pl-8">
        {flights.length > 0 && props.airports.length > 0 ? (
          flights.map((flight) => (
            <div key={flight.bidID} style={{ width: `${width}px` }}>
              test
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

  return (
    <LiveFlightTable
      loading={isLoading}
    />
  );
};

export default LiveFlights;
