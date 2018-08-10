/* 
 * Request Handlers
 */

// Depnedencies
const _data = require("./data")
const helpers = require("./helpers")

// Define the Handlers
let handlers = {}

// User Handler
handlers.users = (data, callback) => {
  const acceptableMethods = ["get", "post", "put", "delete"]
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback)
  } else {
    callback(405)
  }
}

// Container for user sub methods
handlers._users = {}

// Users - post
handlers._users.post = (data, callback) => {
  // check that all required fields are filled out
  console.log(data)
  const firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName
      : false
  const lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName
      : false

  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone
      : false

  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password
      : false

  const tosAgreement =
    typeof data.payload.tosAgreement == "boolean" &&
    data.payload.tosAgreement == true
      ? true
      : false
  console.log(firstName, lastName, phone, password, tosAgreement)
  if (firstName && lastName && phone && password && tosAgreement) {
    // make sure user does not exist
    _data.read("users", phone, (err, data) => {
      if (err) {
        // Hash the password
        const hashedPassword = helpers.hash(password)

        if (hashedPassword) {
          // create user object
          const user = {
            firstName,
            lastName,
            phone,
            hashedPassword,
            tosAgreement
          }
          _data.create("users", phone, user, err => {
            if (!err) {
              callback(200)
            } else {
              console.log(err)
              callback(500, { Error: "Could not create new user" })
            }
          })
        } else {
          callback(500, { Error: "Could Not Hash the user's password" })
        }
      } else {
        callback(400, { Error: "A user with phone number already exists" })
      }
    })
  } else {
    callback(400, { Error: "Missing Required Fields" })
  }
}
// Users - Get
// required data: phone
// optional data: none
// @TODO only let an authenticate user access thier object, dont let them access anyone elses
handlers._users.get = (data, callback) => {
  // check that the phone number is valid
  const phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false

  if (phone) {
    _data.read("users", phone, (err, data) => {
      if (!err && data) {
        // removed the hased password before retuning it requestor
        delete data.hashedPassword
        callback(200, data)
      } else {
        callback(404)
      }
    })
  } else {
    callback(400, { Error: "Missing Required Field" })
  }
}
// Users - put
// Require data: phone
// Optional data: firsName, lastName, password -- one must be present
// @TODO only let an authenticate user update their own object, dont let them update anyone elses
handlers._users.put = (data, callback) => {
  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false

  // check for optional fields
  const firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName
      : false
  const lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName
      : false

  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password
      : false

  // error if phone is invalid
  if (phone) {
    if (firstName || lastName || password) {
      // look up the user
      _data.read("users", phone, (err, userData) => {
        if (!err && userData) {
          if (firstName) {
            userData.firstName = firstName
          }
          if (lastName) {
            userData.lastName = lastName
          }
          if (password) {
            userData.hashedPassword = helpers.hash(password)
          }
          // store updates
          _data.update("users", phone, userData, err => {
            if (!err) {
              callback(200)
            } else {
              console.log(err)
              callback(500, { Error: "Could Not Update The User" })
            }
          })
        } else {
          callback(400, { Error: "The specified user does not exist" })
        }
      })
    } else {
      callback(400, { Error: "Missing fields to update" })
    }
  } else {
    callback(400, { Error: "Missing Require Field" })
  }
}

// Users - delete
// Required data: phone
//@TODO only let an authenticate user delete their user, not anyone else
//@TODO delete any other files associated to the user
handlers._users.delete = (data, callback) => {
  // check that phone number is valid
  const phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false

  if (phone) {
    _data.read("users", phone, (err, data) => {
      if (!err && data) {
        _data.delete("users", phone, err => {
          if (!err) {
            callback(200)
          } else {
            console.log(err)
            callback(500, { Error: "Could not delete the specified user" })
          }
        })
      } else {
        callback(400, { Error: "Could not find the specified user" })
      }
    })
  } else {
    callback(400, { Error: "Missing Required Field" })
  }
}
// sample handler
handlers.sample = (data, callback) => {
  // callback a http status code, and a payload object
  callback(418, { name: "sample handler" })
}
// Ping Handler
handlers.ping = (data, callback) => {
  callback(200)
}
handlers.notFound = (data, callback) => {
  callback(404)
}

// Export the handlers
module.exports = handlers
