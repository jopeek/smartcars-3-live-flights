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
import Flight from "../components/flight.jsx";

const baseUrl = "http://localhost:7172/api/com.cav.flight-center/";

const Bids = (props) => {
  const [logBookInstalled, setLogBookInstalled] = useState(false);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [expandedFlight, setExpandedFlight] = useState(null);
  const [bidFlights, setBidFlights] = useState([]);
  const [recoverableFlight, setRecoverableFlight] = useState(null);
  const [width, setWidth] = useState(0);
  const widthRef = useRef(null);

  const getBidFlights = async () => {
    setBidsLoading(true);
    try {
      const response = await request({
        url: baseUrl + "bookings",
        method: "GET",
        params: {
          nocache: true,
        },
      });

      setBidFlights(response);
    } catch (error) {
      setBidFlights([]);

      notify("flight-center", null, null, {
        message: "Failed to get dispatched flights",
        type: "danger",
      });
    }
    await getRecoverableFlight();
    setBidsLoading(false);
  };

  const unbookFlight = async (bidID) => {
    try {
      await request({
        url: `${baseUrl}unbook-flight`,
        method: "POST",
        data: {
          bidID: bidID,
        },
      });

      getBidFlights();
    } catch (error) {
      notify("flight-center", null, null, {
        message: "Failed to delete dispatch",
        type: "danger",
      });
    }
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
    getBidFlights();
    isLogbookInstalled();
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

  async function getRecoverableFlight() {
    try {
      // Using request and not localApi because we want to ignore errors
      const recoverableFlight = await request(
        "http://localhost:7172/api/com.cav.flight-center/recoverable",
        "GET"
      );

      if (!!recoverableFlight) {
        setRecoverableFlight(recoverableFlight);
      }
    } catch (error) {
      // Ignore errors
    }
  }

  async function isLogbookInstalled() {
    try {
      const plugins = await localApi("api/plugins/installed");

      if (!!plugins.find((plugin) => plugin.id === "com.tfdidesign.logbook")) {
        setLogBookInstalled(true);
      }
    } catch (error) {
      setLogBookInstalled(false);
    }
  }

  function navigateToPireps() {
    return localApi("api/navigate", "POST", {
      pluginID: "com.tfdidesign.logbook",
    });
  }

  return (
    <div className="root-container">
      <div className="grid grid-cols-10 mb-3 mx-8">
        <h2 className="color-accent-bkg col-span-10">My Dispatched Flights</h2>
      </div>

      <div className="mt-3 mx-8">
        <div className="flex flex-row">
          <div className="flex place-items-left">
            {logBookInstalled && (
              <div>
                <button
                  onClick={navigateToPireps}
                  className="button button-solid"
                >
                  <span className="inline-flex">
                    <FontAwesomeIcon icon={faPlaneArrival} className="mr-1" style={{ marginTop: "2px" }} />
                    View PIREPS
                  </span>
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-grow place-items-end content-end justify-end">
            <Link className="inline-link" to="/search-flights/">
              <div className="button button-solid">
                <span className="inline-flex">
                  <FontAwesomeIcon icon={faCalendar} className="mr-1" style={{ marginTop: "2px" }} />
                  Dispatch Schedule
                </span>
              </div>
            </Link>

            <Link className="inline-link" to="/search-tours/">
              <div className="button button-solid ml-3">
                <span className="inline-flex">
                  <FontAwesomeIcon icon={faGlobe} className="mr-1" style={{ marginTop: "2px" }} />
                  Dispatch Tour
                </span>
              </div>
            </Link>

            <Link className="inline-link" to="/search-events/">
              <div className="button button-solid ml-3">
                <span className="inline-flex">
                  <FontAwesomeIcon icon={faCalendarDay} className="mr-1" style={{ marginTop: "2px" }} />
                  Dispatch Event
                </span>
              </div>
            </Link>

            <Link className="inline-link" to="/create-flight/">
              <div className="button button-solid ml-3">
                <span className="inline-flex">
                  <FontAwesomeIcon icon={faSuitcase} className="mr-1" style={{ marginTop: "2px" }} />
                  Dispatch Charter
                </span>
              </div>
            </Link>

            <div
              onClick={() => !bidsLoading && !props.loading && getBidFlights()}
              className="button button-hollow ml-3"
            >
              <span
                className={bidsLoading || props.loading ? "animate-spin" : ""}
              >
                <FontAwesomeIcon icon={faRefresh} />
              </span>
            </div>
          </div>
        </div>
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
        {bidFlights.length > 0 && props.airports.length > 0 ? (
          bidFlights.map((bidFlight) => (
            <div key={bidFlight.bidID} style={{ width: `${width}px` }}>
              <Flight
                weightUnits={props.weightUnits}
                altitudeUnits={props.altitudeUnits}
                landingDistanceUnits={props.landingDistanceUnits}
                airports={props.airports}
                aircraft={props.aircraft}
                setExpandedFlight={setExpandedFlight}
                expanded={expandedFlight === bidFlight.bidID}
                flight={{
                  ...bidFlight,
                  aircraft: [],
                  defaultAircraft: bidFlight.aircraft,
                }}
                unbookFlight={unbookFlight}
                simBriefInstalled={props.simBriefInstalled}
                getBidFlights={getBidFlights}
                recoverableFlight={recoverableFlight}
                currentFlightData={props.currentFlightData}
                canbid={true}
              />
            </div>
          ))
        ) : (
          <div className="data-table-row p-3 mt-3 mr-8">
            You have no dispatched flights.
          </div>
        )}
      </div>
    </div>
  );
};

const FlightCenter = ({ identity, currentFlightData }) => {
  const [weightUnits, setWeightUnits] = useState("KGS");
  const [altitudeUnits, setAltitudeUnits] = useState("ft");
  const [landingDistanceUnits, setLandingDistanceUnits] = useState("m");
  const [airports, setAirports] = useState([]);
  const [aircraft, setAircraft] = useState([]);
  const [simBriefInstalled, setSimBriefInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const pluginData = identity?.airline?.plugins?.find(
    (p) => p.id === "com.cav.flight-center"
  );

  useEffect(() => {
    isSimBriefInstalled();
    getUnits();
  }, []);

  async function getUnits() {
    try {
      const settings = await localApi("api/settings", "GET");

      setWeightUnits(settings.core.weightUnits);
      setAltitudeUnits(settings.core.altitudeUnits);
      setLandingDistanceUnits(settings.core.landingDistanceUnits);
    } catch (error) {
      notify("logbook", null, null, {
        message: "Failed to retrieve settings",
        type: "danger",
      });
    }
  }

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

  const getAirports = async () => {
    try {
      const response = await request({
        url: baseUrl + "airports",
        method: "GET",
      });
      setAirports(response);
    } catch (error) {
      notify("flight-center", null, null, {
        message: "Failed to fetch airports",
        type: "danger",
      });
    }
  };

  const getAircraft = async () => {
    try {
      const response = await request({
        url: baseUrl + "aircrafts",
        method: "GET",
      });
      setAircraft(response);
    } catch (error) {
      notify("flight-center", null, null, {
        message: "Failed to fetch aircraft",
        type: "danger",
      });
    }
  };

  useEffect(() => {
    const getData = async () => {
      setIsLoading(true);
      await getAirports();
      await getAircraft();
      setIsLoading(false);
    };

    getData();
  }, []);

  return (
    <Bids
      loading={isLoading}
      airports={airports}
      aircraft={aircraft}
      simBriefInstalled={simBriefInstalled}
      pluginSettings={pluginData?.appliedSettings}
      weightUnits={weightUnits}
      altitudeUnits={altitudeUnits}
      landingDistanceUnits={landingDistanceUnits}
      currentFlightData={currentFlightData}
    />
  );
};

export default FlightCenter;
