const cron = require("node-cron");
const { updateConversionRate } = require("./conversionRateService");

// Schedule the job to run daily at midnight (UTC)
// Cron pattern: '0 0 * * *' runs at 00:00 every day.
cron.schedule("0 0 * * *", async () => {
  console.log("Running daily conversion rate update job...");
  await updateConversionRate();
});

// Optionally, update the conversion rate immediately when the application starts.
updateConversionRate();
