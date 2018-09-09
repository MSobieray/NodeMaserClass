/* 
* Primary file for API
*/

// Dependencies
const http = require("http");
const https = require("https");
const url = require("url");
const stringDecoder = require("string_decoder").StringDecoder;
const config = require("./lib/config");
const fs = require("fs");
const handlers = require("./lib/handlers");
const helpers = require("./lib/helpers");

// HTTP Server
const httpServer = http.createServer((req, res) => {
  unifiedServer(req, res);
});

httpServer.listen(config.httpPort, () => {
  console.log(
    `We Are Listening On Port ${config.httpPort} in ${config.envName} mode`
  );
});

// HTTPS Server
const SSLKeys = {
  key: fs.readFileSync("./https/key.pem"),
  cert: fs.readFileSync("./https/cert.pem")
};
const httpsServer = https.createServer(SSLKeys, (req, res) => {
  unifiedServer(req, res);
});

httpsServer.listen(config.httpsPort, () => {
  console.log(
    `We Are Listening On Port ${config.httpsPort} in ${config.envName} mode`
  );
});

const unifiedServer = (req, res) => {
  // get url and parse it
  const parsedUrl = url.parse(req.url, true);
  // get path from url
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, "");

  // Get the query sting as an object
  const queryStringObject = parsedUrl.query;

  // get http method
  const method = req.method.toLowerCase();

  // get the headers as an object
  const headers = req.headers;

  // get the payload, if any
  const decoder = new stringDecoder("utf-8");

  let buffer = "";

  req.on("data", data => {
    buffer += decoder.write(data);
  });
  req.on("end", () => {
    buffer += decoder.end();

    // choose route handler, if route not found use notFound handler
    const routeHandler =
      typeof router[trimmedPath] !== "undefined"
        ? router[trimmedPath]
        : handlers.notFound;

    // construct data object to send to handler

    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: helpers.parseJsonToObject(buffer)
    };
    // route the request to the handler in the router

    routeHandler(data, (statusCode, payload) => {
      // use the status code called back by handler of default to 200
      statusCode = typeof statusCode == "number" ? statusCode : 200;

      // use the payload called back by the handler of default to {}
      payload = typeof payload == "object" ? payload : {};

      // Stringify the payload
      payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      // send a response
      res.end(payloadString);

      console.log("Returning this response: ", statusCode, payloadString);
    });
  });
};

// Setup router

const router = {
  sample: handlers.sample,
  ping: handlers.ping,
  users: handlers.users,
  tokens: handlers.tokens,
  checks: handlers.checks
};
