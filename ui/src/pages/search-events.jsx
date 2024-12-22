/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import { request, notify, localApi } from "@tfdidesign/smartcars3-ui-sdk";
import { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faInfoCircle,
  faRefresh,
} from "@fortawesome/free-solid-svg-icons";
import Flight from "../components/flight";

const baseUrl = "http://localhost:7172/api/com.cav.flight-center/";

const SearchEventsContent = (props) => {
  const [flightsLoading, setFlightsLoading] = useState(false);
  const [simBriefInstalled, setSimBriefInstalled] = useState(false);
  const [expandedFlight, setExpandedFlight] = useState(-1);
  const [flights, setFlights] = useState([]);
  const [width, setWidth] = useState(0);
  const widthRef = useRef(null);

  useEffect(() => {
    isSimBriefInstalled();
  }, []);

  async function isSimBriefInstalled() {
    try {
      const plugins = await localApi("api/plugins/installed");

      if (!!plugins.find((plugin) => plugin.id === "com.tfdidesign.simbrief")) {
        setSimBriefInstalled(true);
      }
    } catch (error) {
      setSimBriefInstalled(false);
    }
  }

  const getFlights = async () => {
    setFlightsLoading(true);
    try {
      let params = {};

      const response = await request({
        url: `${baseUrl}searchEvents`,
        params: {
          ...params,
          cacheBuster: new Date().getTime(), // Add a cache-busting parameter
        },
        method: "GET",
      });

      if (Array.isArray(response)) {
        setFlights(response);
      } else {
        setFlights([]);
        notify("com.cav.flight-center", null, null, {
          message: "Error parsing flights",
          type: "danger",
        });
      }
    } catch (error) {
      notify("com.cav.flight-center", null, null, {
        message: "Failed to fetch flights",
        type: "danger",
      });
    }
    setFlightsLoading(false);
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

  const setHeight = (elID) => {
    const el = document.getElementById(elID);
    if (!!!el) return;
    const viewHeight = window.innerHeight;
    const elOffTop = el.offsetTop;
    const marginBottom = 0;
    const newHeight = viewHeight - elOffTop - marginBottom;
    el.style.height = newHeight + "px";
  };

  const sortedFlights = flights !== null ? [...flights] : [];

  return (
    <div className="root-container">
      <div className="mb-3 mx-8">
        <table>
          <tbody>
            <tr>
              <td>
                <Link className="inline-link" to="/">
                  <div className="p-3 interactive interactive-shadow">
                    <FontAwesomeIcon icon={faArrowLeft} />
                  </div>
                </Link>
              </td>
              <td>
                <div className="ml-3">
                  <h3>Flight Center</h3>
                  <h2 className="color-accent-bkg">Search Events</h2>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mb-3 mx-8">
        <div className="info-alert flex-grow" role="alert">
          <FontAwesomeIcon
            icon={faInfoCircle}
            className="mr-2"
            style={{ fontSize: "1rem", marginTop: "2px" }}
          />
          <div className="info-alert-content">
            You will see all upcoming events, but only flights for events that
            are currently active can be dispatched.
          </div>
        </div>
        <div
          onClick={() => !flightsLoading && !props.loading && getFlights()}
          className="button button-hollow ml-3"
          style={{ height: "100%" }}
        >
          <span
            className={flightsLoading || props.loading ? "animate-spin" : ""}
          >
            <FontAwesomeIcon icon={faRefresh} />
          </span>
        </div>
      </div>

      <div className="mx-8 mt-3">
        <h4>
          {sortedFlights.length > 0
            ? sortedFlights.length >= 100
              ? "100+ Events Found"
              : sortedFlights.length > 1
              ? sortedFlights.length + " Events Found"
              : "1 Event Found"
            : "No Events Found"}
        </h4>
      </div>

      <div
        ref={widthRef}
        className="grid grid-cols-10 data-table-header p-3 mt-3 mx-8"
      >
        <div className="col-span-2 interactive">Event</div>
        <div className="text-left interactive">Date & Time</div>
        <div className="text-left interactive">Flight Number</div>
        <div className="text-left interactive">Departure</div>
        <div className="text-left interactive">Arrival</div>
        <div className="text-left interactive">Aircraft</div>
        <div className="text-right col-span-2"></div>
      </div>

      <div id="tblBody" className="overflow-y-auto pl-8">
        {props.aircraft.length > 0 && sortedFlights.length > 0 ? (
          sortedFlights.map((flight) => (
            <div style={{ width: `${width}px` }} key={flight.id}>
              <Flight
                airports={props.airports}
                aircraft={props.aircraft}
                setExpandedFlight={setExpandedFlight}
                expanded={expandedFlight === flight.id}
                flight={{
                  ...flight,
                  aircraft: [],
                  defaultAircraft: flight.aircraft,
                }}
                simBriefInstalled={simBriefInstalled}
                currentFlightData={props.currentFlightData}
                source="event"
                canbid={flight.active}
              />
            </div>
          ))
        ) : (
          <div className="data-table-row p-3 mt-3 mr-8">
            No flights matching the search parameters were found or the results
            are still loading. Please be patient.
          </div>
        )}
      </div>
    </div>
  );
};

const SearchEvents = ({ identity, currentFlightData }) => {
  const [aircraft, setAircraft] = useState([]);
  const [airports, setAirports] = useState([]);

  const pluginData = identity?.airline?.plugins?.find(
    (p) => p.id === "com.cav.flight-center"
  );

  const getAirports = async () => {
    try {
      const response = await request({
        url: `${baseUrl}airports`,
        method: "GET",
      });
      setAirports(response);
    } catch (error) {
      notify("com.cav.flight-center", null, null, {
        message: "Failed to fetch airports",
        type: "danger",
      });
    }
  };

  const getAircraft = async () => {
    try {
      const response = await request({
        url: `${baseUrl}aircrafts`,
        method: "GET",
      });

      response.sort((a, b) => a.name.localeCompare(b.name));

      setAircraft(response);
    } catch (error) {
      notify("com.cav.flight-center", null, null, {
        message: "Failed to fetch aircraft",
        type: "danger",
      });
    }
  };

  useEffect(() => {
    getAircraft();
    getAirports();
  }, []);

  return (
    <SearchEventsContent
      airports={airports}
      aircraft={aircraft}
      pluginSettings={pluginData?.appliedSettings}
      currentFlightData={currentFlightData}
    />
  );
};

export default SearchEvents;
