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
// Export Helpers

module.exports = helpers
