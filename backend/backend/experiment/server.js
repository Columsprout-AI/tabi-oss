const app = require("./experiment-app");

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`Experiment service is running on port ${PORT}`);
});
