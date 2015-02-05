var c = require("./colors");
var readline = require('readline');
var path = require("path");
var fs = require("fs");
var q = require('q');


module.exports = {
  checkJson: function (directory) {
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
}