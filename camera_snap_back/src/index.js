const http = require("http");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const ip = require("ip");
const path = require("path");
const constants = require("./assets/constants")

class Application {

    #app;
    #httpServer;
    #ip = undefined;
    #port = 3030;

    // start server
    startServer = () => {
        this.#ip = ip.address();

        this.#setExpressServer();
        this.#setConfigs();
        this.#setRoutes();
    };

    // setup Express server for the first
    #setExpressServer = () => {
        const app = express();

        const server = http.createServer(app);

        this.#app = app;
        this.#httpServer = server;

        server.listen(this.#port, this.#ip, (err) => {
            if (err) {
                console.error("sever has error: ", err);

                return;
            }

            console.info(`Server Successfully Runs on Port: ${this.#port} and Host Name: ${this.#ip}`)

            console.log(`\nResult address: The result will be saved in ${constants.SAVING_ADDRESS}\n`);
        });
    };

    // setup configs of server
    #setConfigs = () => {
        // this.#app.use(cors());
        this.#app.use(express.static(path.join(__dirname, "/statics")))
        this.#app.use(bodyParser.json());
        this.#app.use(bodyParser.urlencoded({extended: true}));
    };

    // setup routes of application
    #setRoutes = () => {
        const routes = require("./Routes");

        this.#app.use(routes);
    };
}

module.exports = Application;