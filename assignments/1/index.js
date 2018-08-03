/* 
* Node master class Homework Assignment 1
*/

// Dependencies
const http = require("http")
const url = require("url")

// HTTP Server
const httpServer = http.createServer((req, res) => {
  // Request Data
  const parsedUrl = url.parse(req.url, true)
  const path = parsedUrl.pathname
  const trimmedPath = path.replace(/^\/+|\/+$/g, "")

  // Router
  const routeHandler =
    typeof router[trimmedPath] !== "undefined"
      ? router[trimmedPath]
      : handlers.notFound

  routeHandler("", (statusCode, payload) => {
    // Return the response
    res.setHeader("Content-Type", "application/json")
    res.writeHead(200)
    // send a response
    res.end()

    console.log("Response Sent")
  })
})

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
