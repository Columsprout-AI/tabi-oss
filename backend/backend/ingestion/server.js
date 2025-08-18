const app = require("./ingestion-app");

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Ingestion service is running on port ${PORT}`);
});
