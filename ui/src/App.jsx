/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { request, notify, localApi } from "@tfdidesign/smartcars3-ui-sdk";
import LiveFlights from "./pages/live-flights";
import Loading from "./components/loading";

function MainApp() {
  const [isLoading, setIsLoading] = useState(false);
  const [identity, setIdentity] = useState({});

  useEffect(() => {
    getIdentity();
  }, []);

  async function getIdentity() {
    setIsLoading(true);
    try {
      const response = await request({
        url: "http://localhost:7172/api/identity",
        method: "GET",
      });

      setIdentity(response);
    } catch (error) {
      notify("com.cav.live-flights", null, null, {
        message: "Failed to fetch identity.",
        type: "warning",
      });
    }
    setIsLoading(false);
  }

  if (isLoading) return <Loading />;

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LiveFlights
            identity={identity} // Pass identity explicitly
          />
        }
      />
    </Routes>
  );
}

export default MainApp;
