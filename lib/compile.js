var c = require("./colors");
var path = require("path");
var fs = require("fs");
var q = require('q');

var readdir = q.denodeify(fs.readdir);

function checkJson(directory) {
  var deferred = q.defer();
  var filePath = path.resolve(directory, "markade.json")
  fs.readFile(filePath, "utf-8", function (error, res) {
    if (error) {
      deferred.reject(new Error(error));
    } else {
      var json = JSON.parse(res);

      json.time = new Date();
      json.root = directory;
      json.templateDir = path.resolve(json.root, json.directories.template);
      json.dataDir = path.resolve(json.root, json.directories.data);
      json.outputDir = path.resolve(json.root, json.directories.output);

      if (json.directories &&
          json.directories.output && json.directories.template &&
          json.directories.data) deferred.resolve(json);
      else deferred.reject(new Error("Bad structure"));
    }
  });
  return deferred.promise;
}


function EmptyDirError(msg) {
  this.message = msg;
  this.code = 10;
}

function parseJson(markade) {
  var deferred = q.defer();
  // console.log(markade);

  var templates = [];
  
  readdir(markade.templateDir)
    .done(function(templates) {
      if (templates.length == 0) deferred.reject(new EmptyDirError("Nothing to do"));
      else deferred.resolve(templates);
    }, function(err) {
      console.error(err, markade);
      deferred.reject(err);
    })

  return deferred.promise;
}


module.exports = function(directory, options) {
  var output = options.output;
  directory = directory || ".";

  console.info("Looking for markade.json...");
  checkJson(directory)
    .then(function(json) {
      return parseJson(json)
        .then(function(templates) {
          templates = templates.filter(function(temp) {
            return temp[0] != "_"
          })
          require("./templates")(templates, json);
        }, function(err) {
          if (err.code == 10) console.log("  %s✔ Nothing to do %s%s", c.bldgrn, c.txtrst, json.templateDir);
          else console.error(err);
        })
    }, function(err) {
      var filePath = path.resolve(directory, "markade.json");
      console.error("  %s❌ NOT FOUND %s%s", c.bldred, c.txtrst, filePath);
      process.exit(-1);
    })
}