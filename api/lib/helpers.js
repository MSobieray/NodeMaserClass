/* 
* Helper Utilities
*/

// Dependencies

const crypto = require("crypto")
const config = require("./config")
// Helper container
const helpers = {}

// Hash SHA256
helpers.hash = str => {
  if (typeof str == "string" && str.length > 0) {
    const hash = crypto
      .createHmac("sha256", config.hashingSecret)
      .update(str)
      .digest("hex")

    return hash
  }
}

// Parse a Json string to an object
helpers.parseJsonToObject = str => {
  try {
    const obj = JSON.parse(str)
    return obj
  } catch (e) {
    return {}
  }
}

// Create string of random alphanumeric charaters of a given lenght
helpers.createRandomString = strLength => {
  strLength = typeof strLength == "number" && strLength > 0 ? strLength : false
  if (strLength) {
    // define all the possible characters that could go into a string
    const possibleCharacters = "abcdefghijklmnopqrstuvwxyz0123456789"
    // start the final string
    let str = ""
    for (let i = 1; i <= strLength; i++) {
      // get a random character
      let randomCharacter = possibleCharacters.charAt(
        Math.floor(Math.random() * possibleCharacters.length)
      )
      // append the character to the final string
      str += randomCharacter
    }

    return str
  } else {
    return false
  }
}
// Export Helpers

module.exports = helpers
