const config = require("./src/config");
const createServer = require("./src/server/createServer");

const app = createServer();

app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
});
