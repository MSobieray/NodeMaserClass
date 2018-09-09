/* 
 * Request Handlers
 */

// Depnedencies
const _data = require("./data");
const helpers = require("./helpers");
const config = require("./config");

// Define the Handlers
let handlers = {};

// User Handler
handlers.users = (data, callback) => {
  const acceptableMethods = ["get", "post", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for user sub methods
handlers._users = {};

// Users - post
handlers._users.post = (data, callback) => {
  // check that all required fields are filled out
  const firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName
      : false;

  const lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName
      : false;

  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone
      : false;

  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password
      : false;

  const tosAgreement =
    typeof data.payload.tosAgreement == "boolean" &&
    data.payload.tosAgreement == true
      ? true
      : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    // make sure user does not exist
    _data.read("users", phone, (err, data) => {
      if (err) {
        // Hash the password
        const hashedPassword = helpers.hash(password);

        if (hashedPassword) {
          // create user object
          const user = {
            firstName,
            lastName,
            phone,
            hashedPassword,
            tosAgreement
          };
          _data.create("users", phone, user, err => {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, { Error: "Could not create new user" });
            }
          });
        } else {
          callback(500, { Error: "Could Not Hash the user's password" });
        }
      } else {
        callback(400, { Error: "A user with phone number already exists" });
      }
    });
  } else {
    callback(400, { Error: "Missing Required Fields" });
  }
};
// Users - Get
// required data: phone
// optional data: none
handlers._users.get = (data, callback) => {
  // check that the phone number is valid
  const phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false;

  if (phone) {
    // get the tokens from the headers
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false;
    // verify the token is valid for the phone number
    handlers._tokens.verify(token, phone, tokenIsValid => {
      if (tokenIsValid) {
        _data.read("users", phone, (err, data) => {
          if (!err && data) {
            // removed the hased password before retuning it requestor
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, {
          Error: "Missing required token in header or token is invalid"
        });
      }
    });
  } else {
    callback(400, { Error: "Missing Required Field" });
  }
};
// Users - put
// Require data: phone
// Optional data: firsName, lastName, password -- one must be present
handlers._users.put = (data, callback) => {
  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;

  // check for optional fields
  const firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName
      : false;
  const lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName
      : false;

  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password
      : false;

  // error if phone is invalid
  if (phone) {
    // get the tokens from the headers
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false;
    // verify the token is valid for the phone number
    handlers._tokens.verify(token, phone, tokenIsValid => {
      if (tokenIsValid) {
        if (firstName || lastName || password) {
          // look up the user
          _data.read("users", phone, (err, userData) => {
            if (!err && userData) {
              if (firstName) {
                userData.firstName = firstName;
              }
              if (lastName) {
                userData.lastName = lastName;
              }
              if (password) {
                userData.hashedPassword = helpers.hash(password);
              }
              // store updates
              _data.update("users", phone, userData, err => {
                if (!err) {
                  callback(200);
                } else {
                  console.log(err);
                  callback(500, { Error: "Could Not Update The User" });
                }
              });
            } else {
              callback(400, { Error: "The specified user does not exist" });
            }
          });
        } else {
          callback(400, { Error: "Missing fields to update" });
        }
      } else {
        callback(403, {
          Error: "Missing required token in header or token is invalid"
        });
      }
    });
  } else {
    callback(400, { Error: "Missing Require Field" });
  }
};

// Users - delete
// Required data: phone
handlers._users.delete = (data, callback) => {
  // check that phone number is valid
  const phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false;

  if (phone) {
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false;
    // verify the token is valid for the phone number
    handlers._tokens.verify(token, phone, tokenIsValid => {
      if (tokenIsValid) {
        _data.read("users", phone, (err, userData) => {
          if (!err && userData) {
            _data.delete("users", phone, err => {
              if (!err) {
                // Delete Each Check Associated with the users
                const userChecks =
                  typeof userData.checks == "object" &&
                  userData.checks instanceof Array
                    ? userData.checks
                    : [];
                console.log(userChecks);
                const checksToDelete = userChecks.length;
                if (checksToDelete > 0) {
                  let checksDeleted = 0;
                  const deletionErrors = false;
                  // Loop through checks
                  userChecks.forEach(checkId => {
                    _data.delete("checks", checkId, err => {
                      if (err) {
                        deletionErrors = true;
                      }
                      checksDeleted++;
                      if (checksDeleted == checksToDelete) {
                        if (!deletionErrors) {
                          callback(200);
                        } else {
                          callback(500, {
                            Error:
                              "Error encountered while trying to delete the users checks. All checks may not have be deleted form the system successfully"
                          });
                        }
                      }
                    });
                  });
                } else {
                  callback(200);
                }
              } else {
                console.log(err);
                callback(500, { Error: "Could not delete the specified user" });
              }
            });
          } else {
            callback(400, { Error: "Could not find the specified user" });
          }
        });
      } else {
        callback(403, {
          Error: "Missing required token in header or token is invalid"
        });
      }
    });
  } else {
    callback(400, { Error: "Missing Required Field" });
  }
};

// TOKENS
// User Handler
handlers.tokens = (data, callback) => {
  const acceptableMethods = ["get", "post", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};
// TOKENS Container
handlers._tokens = {};

// Required data: phone, password
// Optionla data: none
handlers._tokens.post = (data, callback) => {
  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone
      : false;

  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password
      : false;

  if (phone && password) {
    // look up user who matches phone
    _data.read("users", phone, (err, userData) => {
      if (!err && userData) {
        // hash sent pw and compare to users pw
        const hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedPassword) {
          // if valid create a new token with random name and set experation with 1hr
          const tokenID = helpers.createRandomString(20);
          const expires = Date.now() + 1000 * 60 * 60;
          const tokenObject = {
            phone,
            tokenID,
            expires
          };

          // store token
          _data.create("tokens", tokenID, tokenObject, err => {
            if (!err) {
              callback(200, tokenObject);
            } else {
              console.log(err);
              callback(500, { Error: "Could not create new token" });
            }
          });
        } else {
          callback(400, {
            Error: "Password did not match the specified users stored password"
          });
        }
      } else {
        callback(400, { Error: "Could not find user" });
      }
    });
  } else {
    callback(400, { Error: "Missing Required Fields" });
  }
};

// Required data: id
// Optional data: none
handlers._tokens.get = (data, callback) => {
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    _data.read("tokens", id, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Missing Required Field" });
  }
};
// Require data: id, extends
// Optional data: none
handlers._tokens.put = (data, callback) => {
  const id =
    typeof data.payload.id == "string" && data.payload.id.trim().length == 20
      ? data.payload.id
      : false;

  const extend =
    typeof data.payload.extend == "boolean" && data.payload.extend == true
      ? true
      : false;

  if (id && extend) {
    _data.read("tokens", id, (err, tokenData) => {
      if (!err && tokenData) {
        // check if token is expired
        if (tokenData.expires > Date.now()) {
          // set the experation an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          // store the new update
          _data.update("tokens", id, tokenData, err => {
            if (!err) {
              callback(200);
            } else {
              callback(500, { Error: "Could not update tokens experation" });
            }
          });
        } else {
          callback(400, {
            Error: "Token is already expired please create a new one"
          });
        }
      } else {
        callback(400, { Error: "Token Does Not Exist" });
      }
    });
  } else {
    callback(400, { Error: "Missing Require Fields or invalid field" });
  }
};

handlers._tokens.delete = (data, callback) => {
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    _data.read("tokens", id, (err, data) => {
      if (!err && data) {
        _data.delete("tokens", id, err => {
          if (!err) {
            callback(200);
          } else {
            console.log(err);
            callback(500, { Error: "Could not delete the specified token" });
          }
        });
      } else {
        callback(400, { Error: "Could not find the specified token" });
      }
    });
  } else {
    callback(400, { Error: "Missing Required Field" });
  }
};

// Verify a given token id is valid for the given user
handlers._tokens.verify = (id, phone, callback) => {
  // lookup token
  _data.read("tokens", id, (err, tokenData) => {
    if (!err && tokenData) {
      // check that token is for given user and not expired
      if (tokenData.phone == phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

// Check Handlers
handlers.checks = (data, callback) => {
  const acceptableMethods = ["get", "post", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Checks container
handlers._checks = {};

// Checks - post
// Required data: protcol, url, methods, successCode, timeoutSeconds
handlers._checks.post = (data, callback) => {
  // Validate Inputs
  const protocol =
    typeof data.payload.protocol == "string" &&
    ["http", "https"].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;

  const url =
    typeof data.payload.url == "string" && data.payload.url.length > 0
      ? data.payload.url
      : false;

  const method =
    typeof data.payload.method == "string" &&
    ["get", "put", "post", "delete"].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;

  const successCodes =
    typeof data.payload.successCodes == "object" &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;

  const timeoutSeconds =
    typeof data.payload.timeoutSeconds == "number" &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;

  if (protocol && url && method && successCodes && timeoutSeconds) {
    // get token from headers
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false;

    _data.read("tokens", token, function(err, tokenData) {
      if (!err && tokenData) {
        const userPhone = tokenData.phone;

        //look up user
        _data.read("users", tokenData.phone, (err, userData) => {
          if (!err && userData) {
            const userChecks =
              typeof userData.checks == "object" &&
              userData.checks instanceof Array
                ? userData.checks
                : [];

            // verify number of checks is less than maxChecks
            if (userChecks.length < config.maxChecks) {
              //Create random id for the check
              const checkId = helpers.createRandomString(20);

              // Create the check object, and incluid the user's phone
              const checkObject = {
                id: checkId,
                userPhone,
                protocol,
                url,
                method,
                successCodes,
                timeoutSeconds
              };

              _data.create("checks", checkId, checkObject, err => {
                if (!err) {
                  // Add the check id to the user object
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  // Save the new user data
                  _data.update("users", userPhone, userData, err => {
                    if (!err) {
                      // Return the data about the new check
                      callback(200, checkObject);
                    } else {
                      callback(500, {
                        Error: "Could not update the user with the new check"
                      });
                    }
                  });
                } else {
                  callback(500, {
                    Error: "Could not create the new check"
                  });
                }
              });
            } else {
              callback(400, {
                Error:
                  "User has the maximum number of checks (" +
                  config.maxChecks +
                  ")"
              });
            }
          } else {
            callback(403);
          }
        });
      } else {
        callback(403);
      }
    });
  } else {
    callback(400, { Error: "Missing inputs or they are invalid" });
  }
};

// Checks - get
// Request data : id
// Optional data : none
handlers._checks.get = (data, callback) => {
  // check that the phone number is valid
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    // Look up check
    _data.read("checks", id, (err, checkData) => {
      if (!err && checkData) {
        // get the tokens from the headers
        const token =
          typeof data.headers.token == "string" ? data.headers.token : false;
        // verify the token is valid for and belongs to the user who created the checks
        handlers._tokens.verify(token, checkData.userPhone, tokenIsValid => {
          if (tokenIsValid) {
            // return the check data
            callback(200, checkData);
          } else {
            callback(403);
          }
        });
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Missing Required Field" });
  }
};
// Checks - put
// Required data : id
// Optional data : protocol, url, method, successCodes, timeoutSeconds (One must be sent)
handlers._checks.put = (data, callback) => {
  // Check for required fields
  const id =
    typeof data.payload.id == "string" && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;

  // Check for optional fields
  const protocol =
    typeof data.payload.protocol == "string" &&
    ["http", "https"].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;

  const url =
    typeof data.payload.url == "string" && data.payload.url.length > 0
      ? data.payload.url
      : false;

  const method =
    typeof data.payload.method == "string" &&
    ["get", "put", "post", "delete"].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;

  const successCodes =
    typeof data.payload.successCodes == "object" &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;

  const timeoutSeconds =
    typeof data.payload.timeoutSeconds == "number" &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;

  if (id) {
    if (protocol || url || method || successCodes || timeoutSeconds) {
      _data.read("checks", id, (err, checkData) => {
        if (!err && checkData) {
          const token =
            typeof data.headers.token == "string" ? data.headers.token : false;
          // verify the token is valid for and belongs to the user who created the checks
          handlers._tokens.verify(token, checkData.userPhone, tokenIsValid => {
            if (tokenIsValid) {
              // Update the check where necisary
              if (protocol) {
                checkData.protocol = protocol;
              }
              if (url) {
                checkData.url = url;
              }
              if (method) {
                checkData.method = method;
              }
              if (successCodes) {
                checkData.successCodes = successCodes;
              }
              if (timeoutSeconds) {
                checkData.timeoutSeconds = timeoutSeconds;
              }
              _data.update("checks", id, checkData, err => {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, { Error: "Could not update the check" });
                }
              });
            } else {
              callback(403);
            }
          });
        } else {
          callback(400, { Error: "Check id did not exsist" });
        }
      });
    } else {
      callback(400, { Error: "Misssing fields to update" });
    }
  } else {
    callback(400, { Error: "Missing Required Field" });
  }
};

// Checks - delete
// Reguired data : id
// Optional data : none
handlers._checks.delete = (data, callback) => {
  // check that phone number is valid
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    // Look up the check to delete
    _data.read("checks", id, (err, checkData) => {
      if (!err && checkData) {
        const token =
          typeof data.headers.token == "string" ? data.headers.token : false;
        // verify the token is valid for the phone number
        handlers._tokens.verify(token, checkData.userPhone, tokenIsValid => {
          if (tokenIsValid) {
            // Delete the checkData
            _data.delete("checks", id, err => {
              if (!err) {
                // Look up the user
                _data.read("users", checkData.userPhone, (err, userData) => {
                  if (!err && userData) {
                    const userChecks =
                      typeof userData.checks == "object" &&
                      userData.checks instanceof Array
                        ? userData.checks
                        : [];
                    // Remove the deleted checks from there list of check
                    const checkPosition = userChecks.indexOf(id);
                    if (checkPosition > -1) {
                      userChecks.splice(checkPosition, 1);
                      _data.update(
                        "users",
                        checkData.userPhone,
                        userData,
                        err => {
                          if (!err) {
                            callback(200);
                          } else {
                            console.log(err);
                            callback(500, {
                              Error: "Could not update the specified user"
                            });
                          }
                        }
                      );
                    } else {
                      callback(500, {
                        Error: "Could not find the check on the user object"
                      });
                    }
                  } else {
                    callback(500, {
                      Error: "Could not find the user created the check"
                    });
                  }
                });
              } else {
                callback(500, { Error: "Could not delete the check data" });
              }
            });
          } else {
            callback(403, {
              Error: "Missing required token in header or token is invalid"
            });
          }
        });
      } else {
        callback(400, { Error: "The Specified check ID does not exist" });
      }
    });
  } else {
    callback(400, { Error: "Missing Required Field" });
  }
};

// sample handler
handlers.sample = (data, callback) => {
  // callback a http status code, and a payload object
  callback(418, { name: "sample handler" });
};
// Ping Handler
handlers.ping = (data, callback) => {
  callback(200);
};
handlers.notFound = (data, callback) => {
  callback(404);
};

// Export the handlers
module.exports = handlers;
