/* 
* Primary file for API
*/

// Dependencies
const http = require('http');
const url = require('url');
const stringDecoder = require('string_decoder').StringDecoder

// the server should respond to all requests with a string
const server = http.createServer((req, res) => {
    // get url and parse it
    const parsedUrl = url.parse(req.url, true);
    // get path from url
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query sting as an object
    const queryStringObject = parsedUrl.query;

    // get http method
    const method = req.method.toLowerCase();

    // get the headers as an object 
    const headers = req.headers;
    
    // get the payload, if any
    const decoder = new stringDecoder('utf-8');

    let buffer = '';

    req.on('data', (data) => {
        buffer += decoder.write(data);
    });
    req.on('end', () => {
        buffer += decoder.end();

        // send a response 
        res.end('Hello World\n');
    
        // log the request path
        console.log("Request received with this payload", buffer);
    })
})
// start the server, and have it listen on port 3000
server.listen(3000, () => {
    console.log('We Are Listening On Port 3000')
})