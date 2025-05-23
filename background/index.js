const axios = __non_webpack_require__("axios");
const { log } = require("@tfdidesign/smartcars3-background-sdk");

let scIdentity = null;

module.exports = {
  onStart: async (identity) => {
    scIdentity = identity;

    try {
      const res = await axios.get("http://localhost:7172/api/config");
      config = res.data.config;

      await getAirports(null);
      await getAircrafts(null);
    } catch (err) {
      log("Error while getting config", "error", err);
    }
  },
  routes: {
    get: {
      flights: {
        description: "Endpoint to list live flights",
        handler: async (req, res) => {
          try {
            let params = {};

            const response = await axios({
              url: `${scIdentity.airline.settings.scriptURL}flights/liveFlights`,
              method: "GET",
              params: params,
              headers: {
                Authorization: `Bearer ${scIdentity.va_user.session}`,
              },
            });

            return res.json(response.data);
          } catch (error) {
            log("Error while getting live flight list", "error", error);
            return res.status(500).json({});
          }
        },
      },
      map_style: {
        description: "Endpoint to retrieve map style",
        handler: async (req, res) => {
          try {
            let params = {};

            const response = await axios({
              url: `${scIdentity.airline.settings.scriptURL}pilot/map_style`,
              method: "GET",
              params: params,
              headers: {
                Authorization: `Bearer ${scIdentity.va_user.session}`,
              },
            });

            return res.json(response.data);
          } catch (error) {
            log("Error while retrieving map style", "error", error);
            return res.status(500).json({});
          }
        },
      },
      path_data: {
        description: "Endpoint to retrieve path data",
        handler: async (req, res) => {
          try {
            let params = { ...req.query }; // Include all query parameters

            const response = await axios({
              url: `${scIdentity.airline.settings.scriptURL}flights/path_data`,
              method: "GET",
              params: params,
              headers: {
                Authorization: `Bearer ${scIdentity.va_user.session}`,
              },
            });

            return res.json(response.data);
          } catch (error) {
            log("Error while retrieving path data", "error", error);
            return res.status(500).json({});
          }
        },
      },
      chatMessages: {
        description: "Endpoint to retrieve chat messages",
        handler: async (req, res) => {
          try {
            let params = {};

            const response = await axios({
              url: `${scIdentity.airline.settings.scriptURL}flights/chatMessages`,
              method: "GET",
              params: params,
              headers: {
                Authorization: `Bearer ${scIdentity.va_user.session}`,
              },
            });

            return res.json(response.data);
          } catch (error) {
            log("Error while retrieving chat messages", "error", error);
            return res.status(500).json({});
          }
        },
      },
    },
    post: {
      sendMessage: {
        description: "Endpoint to send a chat message",
        handler: async (req, res) => {
          try {
            const formData = new URLSearchParams();
            formData.append("message", req.body.message);

            const response = await axios({
              url: `${scIdentity.airline.settings.scriptURL}flights/sendMessage`,
              method: "POST",
              data: formData.toString(),
              headers: {
                Authorization: `Bearer ${scIdentity.va_user.session}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
            });

            return res.status(response.status).json(response.data);
          } catch (error) {
            log("Error while sending chat message", "error", error);
            return res.status(500).json({ error: "Failed to send message" });
          }
        },
      },
    },
  },
};
