import React, { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const baseUrl = "http://localhost:7172/api/com.cav.live-flights/";

const MapComponent = () => {
  const [mapStyle, setMapStyle] = useState(null); // Holds map style data
  const [mapData, setMapData] = useState([]); // Holds marker data for the map
  const [loading, setLoading] = useState(false); // Tracks loading state

  // Initialize Leaflet extensions for marker rotation and feature groups
  useEffect(() => {
    const originalSetPos = L.Marker.prototype._setPos; // Store the original method

    L.Marker.addInitHook(function () {
      const iconOptions = this.options.icon && this.options.icon.options;
      const iconAnchor = iconOptions && iconOptions.iconAnchor;
      this.options.rotationOrigin =
        this.options.rotationOrigin ||
        (iconAnchor
          ? `${iconAnchor[0]}px ${iconAnchor[1]}px`
          : "center bottom");
      this.options.rotationAngle = this.options.rotationAngle || 0;
    });

    L.Marker.include({
      _setPos: function (pos) {
        originalSetPos.call(this, pos); // Call the original method
        if (this.options.rotationAngle) {
          this._icon.style[
            L.DomUtil.TRANSFORM
          ] = `translate3d(${pos.x}px, ${pos.y}px, 0px) rotate(${this.options.rotationAngle}deg)`;
          this._icon.style[L.DomUtil.TRANSFORM + "Origin"] =
            this.options.rotationOrigin;
        }
      },
    });

    L.Map.include({
      getFeatureGroupById: function (id) {
        let featureGroup = null;
        this.eachLayer((layer) => {
          if (layer instanceof L.FeatureGroup && layer.id === id) {
            featureGroup = layer;
          }
        });
        return featureGroup;
      },
    });
  }, []);

  // Fetches map tile styling from an API endpoint
  const parseMapTiles = async () => {
    try {
      const response = await axios.get(baseUrl + "map_style", {
        params: {
          nocache: true,
        },
      });
      setMapStyle(response.data); // Set map style data
    } catch (error) {
      console.error("Error fetching map style:", error);
    }
  };

  // Processes raw map data into a usable format
  const processMapData = useCallback((data) => {
    return data.map((item) => ({
      lat: parseFloat(item.presLat), // Convert latitude to float
      lng: parseFloat(item.presLong), // Convert longitude to float
      rotationAngle: item.statHdg || 0, // Include rotation angle for markers
      icon: item.icon, // Include icon URL for markers
      popupContent: generatePopupContent(item), // Generate popup content
      departure: [item.startLat, item.startLong], // Departure coordinates
      arrival: [item.arrLat, item.arrLong], // Arrival coordinates
    }));
  }, []);

  // Fetches map data (e.g., markers) from an API endpoint
  const getMapData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(baseUrl + "map_data", {
        params: {
          nocache: true,
        },
      });
      const parsedData = processMapData(response.data); // Process the data
      setMapData(parsedData);
    } catch (error) {
      console.error("Error fetching map data:", error);
      setMapData([]);
    } finally {
      setLoading(false);
    }
  }, [processMapData]);

  // Generates popup content based on data properties
  const generatePopupContent = (item) => {
    return `
        <div class="flex items-center">
            ${item.flightNumber}
        </div>
        <div class="flex items-center">
            ${item.depIcaoPretty} 
            <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="1em" height="1em" viewBox="0 0 24 24" data-icon="mdi:arrow-right-thin" class="iconify iconify--mdi">
                <path fill="currentColor" d="M14 16.94v-4H5.08l-.03-2.01H14V6.94l5 5Z"></path>
            </svg> 
            ${item.arrIcaoPretty}
        </div>
        <div class="flex items-center">
            ${item.pilot}
        </div>
        <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="1em" height="1em" viewBox="0 0 24 24" data-icon="material-symbols-light:altitude-outline" class="iconify iconify--material-symbols-light">
                <path fill="currentColor" d="M18.5 12V7.108l-2.1 2.08l-.688-.688L19 5.212L22.288 8.5l-.688.714l-2.1-2.1V12zM2.904 20.173l4.192-5.615l3.462 4.615h8.538l-5-6.65l-3 3.993l-.634-.843l3.634-4.846l7 9.346zm8.192-1"></path>
            </svg>Altitude: ${item.statAltitude} <span class="fs-7 fw-lighter" style="margin-left: 0.2rem; margin-right: 0.2rem;">ft</span>
        </div>
        <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="1em" height="1em" viewBox="0 0 24 24" data-icon="mdi:compass-outline" class="iconify iconify--mdi">
                <path fill="currentColor" d="m7 17l3.2-6.8L17 7l-3.2 6.8zm5-5.9a.9.9 0 0 0-.9.9a.9.9 0 0 0 .9.9a.9.9 0 0 0 .9-.9a.9.9 0 0 0-.9-.9M12 2a10 10 0 0 1 10 10a10 10 0 0 1-10 10A10 10 0 0 1 2 12A10 10 0 0 1 12 2m0 2a8 8 0 0 0-8 8a8 8 0 0 0 8 8a8 8 0 0 0 8-8a8 8 0 0 0-8-8"></path>
            </svg>Heading: ${item.statHdg} <span class="fs-7 fw-lighter" style="margin-left: 0.2rem; margin-right: 0.2rem;">°</span>
        </div>
        <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="1em" height="1em" viewBox="0 0 20 20" data-icon="fluent:top-speed-20-regular" class="iconify iconify--fluent">
                <path fill="currentColor" d="M5.416 4.71A6.97 6.97 0 0 1 9.5 3.017V4.5a.5.5 0 0 0 1 0V3.018A7 7 0 0 1 16.93 9H15a.5.5 0 0 0 0 1h2a7.17 7.17 0 0 1-2.211 5.17a.5.5 0 0 0 .686.727A8.17 8.17 0 0 0 18 10a8 8 0 1 0-16 0c0 2.295 1.02 4.44 2.563 5.897a.5.5 0 0 0 .686-.728C3.895 13.89 3 12.003 3 10h2a.5.5 0 1 0 0-1H3.07a6.97 6.97 0 0 1 1.64-3.583l1.436 1.437a.5.5 0 0 0 .708-.708zm8.033 1.097a.5.5 0 0 1 .746.638l-.11.196a344 344 0 0 1-1.214 2.126a124 124 0 0 1-.99 1.69a29 29 0 0 1-.384.628c-.1.157-.198.306-.27.39a1.5 1.5 0 0 1-2.282-1.948c.072-.084.203-.205.343-.328c.15-.133.343-.296.56-.479c.436-.364.982-.81 1.515-1.24a295 295 0 0 1 1.91-1.532z"></path>
            </svg>Ground Speed: ${item.statSpeed} <span class="fs-7 fw-lighter" style="margin-left: 0.2rem; margin-right: 0.2rem;">kt</span>
        </div>
        <div class="flex items-center">
            ${item.aircraftTypeId}
        </div>
        <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="1em" height="1em" viewBox="0 0 24 24" data-icon="material-symbols:share-eta" class="iconify iconify--material-symbols">
                <path fill="currentColor" d="M10.025 24q-2.075 0-3.9-.788t-3.187-2.15t-2.15-3.187T0 14q0-2.075.788-3.9t2.15-3.187t3.187-2.15t3.9-.788q.25 0 .488.013t.487.037v2q-.25-.025-.488-.038t-.487-.012q-3.35 0-5.687 2.338T2 14q0 3.325 2.338 5.663T10.025 22q3.325 0 5.663-2.337T18.025 14h2q0 2.05-.787 3.875t-2.15 3.188t-3.175 2.15t-3.888.787m3.275-5.3L9 14.4V9h2v4.6l3.7 3.7zm8.55-6.7q-.575-3.55-3-6.163T13 2.35V.3q4.275.925 7.263 4.125T23.874 12zm-4.075 0q-.475-1.875-1.737-3.3T13 6.55V4.425q2.575.8 4.425 2.838t2.4 4.737z"></path>
            </svg>ETA: ${item.eta} <span class="fs-7 fw-lighter" style="margin-left: 0.2rem; margin-right: 0.2rem;">HH:MM</span> DTG: ${item.dtg} <span class="fs-7 fw-lighter" style="margin-left: 0.2rem; margin-right: 0.2rem;">nm</span>
        </div>
        <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="1em" height="1em" viewBox="0 0 24 24" data-icon="mdi:progress-helper" class="iconify iconify--mdi">
                <path fill="currentColor" d="M13 2v2c4.39.54 7.5 4.53 6.96 8.92A8.014 8.014 0 0 1 13 19.88v2c5.5-.6 9.45-5.54 8.85-11.03C21.33 6.19 17.66 2.5 13 2m-2 0c-1.96.18-3.81.95-5.33 2.2L7.1 5.74c1.12-.9 2.47-1.48 3.9-1.68zM4.26 5.67A9.8 9.8 0 0 0 2.05 11h2c.19-1.42.75-2.77 1.64-3.9zM2.06 13c.2 1.96.97 3.81 2.21 5.33l1.42-1.43A8 8 0 0 1 4.06 13zm5 5.37l-1.39 1.37A10 10 0 0 0 11 22v-2a8 8 0 0 1-3.9-1.63z"></path>
            </svg>${item.statStage}
        </div>
    `;
  };

  // UseEffect to load map styles and data on component mount
  useEffect(() => {
    parseMapTiles();
    getMapData();
  }, [getMapData]);

  if (loading) return <div>Loading map...</div>; // Show loading indicator

  return (
    <div>
      <MapContainer
        center={[0, 0]}
        zoom={2}
        style={{ height: "100vh", width: "100%" }}
      >
        {/* Render map tiles */}
        {mapStyle && (
          <TileLayer url={mapStyle.url} attribution={mapStyle.attribution} />
        )}

        {/* Render map markers */}
        {mapData.map((marker, index) => (
            <>
          <Marker
            key={index}
            position={[marker.lat, marker.lng]}
            icon={L.divIcon({
              className: "custom-marker",
              html: `<img src='${marker.icon}' style='width: 2.5rem; filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.5));'/>`,
              iconAnchor: [5, 23],
            })}
            rotationAngle={marker.rotationAngle}
          >
            <Popup>
              <div dangerouslySetInnerHTML={{ __html: marker.popupContent }} />
            </Popup>
          </Marker>
          {/* Render dashed line between departure and arrival */}
          {marker.departure && marker.arrival && (
              <Polyline
                positions={[marker.departure, marker.arrival]}
                pathOptions={{ color: "#999999", dashArray: "5, 5", weight: 2 }}
              />
            )}
          </>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
