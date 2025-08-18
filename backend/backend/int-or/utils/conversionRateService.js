const axios = require("axios");
require("dotenv").config();

let currentRate = null; // Cached conversion rate (USD to INR)

/**
 * Fetches the current conversion rate by retrieving USD and INR rates (against the default base, e.g., EUR)
 * from exchangeratesapi.io and then computing the USD-to-INR rate.
 */
async function updateConversionRate() {
  try {
    // Adjust the URL: remove base parameter and request both USD and INR rates.
    const url = `https://api.exchangeratesapi.io/v1/latest?access_key=${process.env.EXCHANGE_RATES_API_KEY}&symbols=USD,INR`;
    const response = await axios.get(url);

    if (
      response.data &&
      response.data.rates &&
      response.data.rates.USD &&
      response.data.rates.INR
    ) {
      // Since the API returns rates relative to the default base (often EUR), 
      // compute the USD to INR rate as (INR_rate / USD_rate)
      currentRate = response.data.rates.INR / response.data.rates.USD;
      console.log(`Conversion rate updated: 1 USD = ${currentRate} INR`);
      return currentRate;
    } else {
      throw new Error("Required conversion rates not found in API response");
    }
  } catch (error) {
    console.error("Error updating conversion rate:", error.message);
    // Optionally, you could retain the old rate or set a default value here.
    return currentRate;
  }
}

/**
 * Returns the currently cached conversion rate.
 */
function getCurrentRate() {
  return currentRate;
}

module.exports = {
  updateConversionRate,
  getCurrentRate,
};
