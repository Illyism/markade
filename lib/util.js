var c = require("./colors");
var readline = require('readline');
var path = require("path");
var fs = require("fs");
var q = require('q');

var marked = require("meta-marked");

function catchBlock(content) {
  var deferred = q.defer();

  var blockType = "normal";
  var lines = content.split("\n");
  var blocks = {}
  for (var i=0; i<lines.length; i++) {
    var line = lines[i];

    if (line.substr(0,1) == "@") {
      blockType = line.substr(1).trim();
      if (blockType === "end") blockType = "normal";
      continue;
    }
    if (blocks[blockType])
      blocks[blockType] += line + "\n"
    else
      blocks[blockType] = line + "\n";
  }

  for (var key in blocks) {
    if (blocks.hasOwnProperty(key)) {
      try {
        blocks[key] = marked(blocks[key]);
      } catch(err) {
        return deferred.reject(new Error(err));
      }
    }
    deferred.resolve(blocks);
  }

  return deferred.promise;
}

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

module.exports = {
  checkJson: checkJson,
  catchBlock: catchBlock
}