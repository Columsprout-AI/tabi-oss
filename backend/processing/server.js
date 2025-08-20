const app = require("./processing-app");
const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
  console.log(`Processing service is running on port ${PORT}`);
});
