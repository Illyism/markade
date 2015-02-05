var c = require("./colors");
var path = require("path");
var fs = require("fs");
var q = require('q');
var util = require("./util");

var readdir = q.denodeify(fs.readdir);


function EmptyDirError(msg) {
  this.message = msg;
  this.code = 10;
}

function parseJson(markade) {
  var deferred = q.defer();
  // console.log(markade);

  var data = [];
  
  readdir(markade.dataDir)
    .done(function(data) {
      if (data.length == 0) deferred.reject(new EmptyDirError("Nothing to do"));
      else deferred.resolve(data);
    }, function(err) {
      console.error(err, markade);
      deferred.reject(err);
    })

  return deferred.promise;
}


module.exports = function(directory, options) {
  var output = options.output;
  directory = directory || process.cwd();

  console.log("Looking for markade.json in %s", directory);
  util.checkJson(directory)
    .then(function(json) {
      console.log("Compiling directory...");
      return parseJson(json)
        .then(function(data) {
          data = data.filter(function(file) {
            return file[0] != "_"
          })
          require("./templates")(data, json);
        }, function(err) {
          if (err.code == 10) console.log("  %s✔ Nothing to do %s%s", c.bldgrn, c.txtrst, json.dataDir);
          else console.error(err);
        })
    }, function(err) {
      var filePath = path.resolve(directory, "markade.json");
      console.error("  %s❌ NOT FOUND %s%s", c.bldred, c.txtrst, filePath);
      process.exit(-1);
    })
}