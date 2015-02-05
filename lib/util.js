var c = require("./colors");
var readline = require('readline');
var path = require("path");
var fs = require("fs");
var q = require('q');
var async = require('async');
var mkdirp = require("mkdirp");

var marked = require("meta-marked");


function _scan(dir, suffix, callback) {
  fs.readdir(dir, function(err, files) {
     var returnFiles = [];
     async.each(files, function(file, next) {
       var filePath = dir + '/' + file;
       fs.stat(filePath, function(err, stat) {
         if (err) {
           return next(err);
         }
         if (stat.isDirectory()) {
           _scan(filePath, suffix, function(err, results) {
             if (err) {
               return next(err);
             }
             returnFiles = returnFiles.concat(results);
             next();
           })
         }
         else if (stat.isFile()) {
           if (file.indexOf(suffix, file.length - suffix.length) !== -1) {
             returnFiles.push(filePath);
           }
           next();
         }
       });
     }, function(err) {
       callback(err, returnFiles);
     });
   });
};

function scan(dir, suffix) {
  var deferred = q.defer();
  _scan(dir, suffix, function(err, results) {
    if (err) 
      deferred.reject(new Error(err));
    else
      deferred.resolve(results);
  })
  return deferred.promise;
}

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


function writefile(fp, contents) {
  var deferred = q.defer();

  mkdirp(path.dirname(fp), function (err) {
    if (err) return deferred.reject(err)
    fs.writeFile(fp, contents, function(error, res) {
      if (error) {
        console.error("  %s❌ %s%s", c.bldred, c.txtrst, error);
        deferred.reject(new Error(error));
      } else {
        deferred.resolve(res);
      }
    })
  })

  return deferred.promise;
}

module.exports = {
  scan: scan,
  checkJson: checkJson,
  catchBlock: catchBlock,
  writefile: writefile
}