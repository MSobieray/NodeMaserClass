/* 
* CRUD Functions for our data
*/

const fs = require("fs")
const path = require("path")
const helpers = require("./helpers")

// Module to be exported

const lib = {}
// Get base directory
lib.baseDir = path.join(__dirname, "/../.data/")
// Write data to a file
lib.create = (dir, file, data, callback) => {
  // open file to be writen
  fs.open(lib.baseDir + dir + "/" + file + ".json", "wx", function(
    err,
    fileDescriptor
  ) {
    if (!err && fileDescriptor) {
      // convert data to string
      const stringData = JSON.stringify(data)

      // Write to the file and close it
      fs.writeFile(fileDescriptor, stringData, function(err) {
        if (!err) {
          fs.close(fileDescriptor, function(err) {
            if (!err) {
              callback(false)
            } else {
              callback("Error closing file")
            }
          })
        } else {
          callback("Error writing to new file")
        }
      })
    } else {
      callback("could not create new file, it may already exist")
    }
  })
}

// read from a file
lib.read = (dir, file, callback) => {
  fs.readFile(lib.baseDir + dir + "/" + file + ".json", "utf8", function(
    err,
    data
  ) {
    if (!err && data) {
      const parsedData = helpers.parseJsonToObject(data)
      callback(false, parsedData)
    } else {
      callback(err, data)
    }
  })
}

// update file with new data

lib.update = (dir, file, data, callback) => {
  //open file for writing
  fs.open(lib.baseDir + dir + "/" + file + ".json", "r+", function(
    err,
    fileDescriptor
  ) {
    if (!err && fileDescriptor) {
      const stringData = JSON.stringify(data)

      // Truncate file content
      fs.truncate(fileDescriptor, function(err) {
        if (!err) {
          // write to file and close it
          fs.writeFile(fileDescriptor, stringData, function(err) {
            if (!err) {
              fs.close(fileDescriptor, function(err) {
                if (!err) {
                  callback(false)
                } else {
                  callback("error closing file")
                }
              })
            } else {
              callback("error writing to exisitng file")
            }
          })
        } else {
          callback("Error truncating file")
        }
      })
    } else {
      callback("could not open file for updating, it might not exist")
    }
  })
}

// delete file
lib.delete = (dir, file, callback) => {
  // unlink the file
  fs.unlink(lib.baseDir + dir + "/" + file + ".json", function(err) {
    if (!err) {
      callback(false)
    } else {
      callback("error deleting the file")
    }
  })
}

// Export the lib object
module.exports = lib
