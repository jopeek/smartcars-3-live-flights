const axios = __non_webpack_require__("axios");
const { log } = require("@tfdidesign/smartcars3-background-sdk");

let scIdentity = null;
let config = null;

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
    },
    post: {
    },
  },
};
