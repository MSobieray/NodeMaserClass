/* 
* Node Master Class Homework Assignment 1
*/

// Dependencies
const http = require("http")
const url = require("url")
const stringDecoder = require("string_decoder").StringDecoder

// Create HTTP Server
const httpServer = http.createServer((req, res) => {
  // Collect Request Data
  const parsedUrl = url.parse(req.url, true)
  const path = parsedUrl.pathname
  const trimmedPath = path.replace(/^\/+|\/+$/g, "")

  // Handle the incoming payload (in this case not expecting anything)
  req.on("data", data => {})

  // Handle the Response
  req.on("end", () => {
    // Find Route Handler
    const routeHandler =
      typeof router[trimmedPath] !== "undefined"
        ? router[trimmedPath]
        : handlers.notFound

    // Create Data Object
    const data = {
      trimmedPath
    }

    // Call the Route Handler
    routeHandler(data, (statusCode, payload) => {
      // Use the status code called back by handler or default to 200
      statusCode = typeof statusCode == "number" ? statusCode : 200

      // Use the payload called back by the handler of default to {}
      payload = typeof payload == "object" ? payload : {}

      // Stringify the payload
      payloadString = JSON.stringify(payload)

      // Set the response type
      res.setHeader("Content-Type", "application/json")

      // Send the status code
      res.writeHead(statusCode)

      // Return the response
      res.end(payloadString)

      // Write to the logs
      console.log("Returning this response: ", statusCode, payloadString)
    })
  })
})

// Start the Server
httpServer.listen(3000, () => {
  console.log(`We Are Listening On Port 3000`)
})

// Route Handlers
const handlers = {}

handlers.hello = (data, callback) => {
  callback(418, { welcome: "you are a teapot" })
}
handlers.notFound = (data, callback) => {
  callback(404)
}

// Available Routes
const router = {
  hello: handlers.hello
}
