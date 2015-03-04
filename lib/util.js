var readline = require('readline');
var path = require("path");
var fs = require("fs");
var q = require('q');
var util = require('util');
var async = require('async');
var mkdirp = require("mkdirp");

var c = require("./colors");

function EmptyDirError(msg) {
  this.message = msg;
  this.code = 10;
}

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
    else if (results.length == 0)
      deferred.reject(new EmptyDirError("No markdown files found"));
    else
      deferred.resolve(results);
  })
  return deferred.promise;
}


function check(json) {
  json.time = new Date();
  json.templateDir = path.resolve(json.root, json.directories.template);
  json.dataDir = path.resolve(json.root, json.directories.data);
  json.outputDir = path.resolve(json.root, json.directories.output);

  if (!json.directories) return "No directories";
  if (!json.directories.output) return "No output directory";
  if (!json.directories.template) return "No template directory";
  if (!json.directories.data) return "No data directory";
  
  return true;
}

function checkConfig(directory) {
  var deferred = q.defer();
  var filePath = path.resolve(directory, "markade.js");
  try {
    var json = require(filePath);
    if (typeof json == "function") {
      json(function(err, json) {
        json.root = directory;
        var jsonCheck = check(json);
        if (jsonCheck === true) deferred.resolve(json);
        else deferred.reject(new Error(jsonCheck));
      });
    } else {
      json.root = directory;
      var jsonCheck = check(json);
      if (jsonCheck === true) deferred.resolve(json);
      else deferred.reject(new Error(jsonCheck));
    }
  } catch(err) {
    if (err.code && err.code == "MODULE_NOT_FOUND")
      return checkJson(directory);

    error(err.stack);
    deferred.reject(err);
  }
  return deferred.promise;
}

function checkJson(directory) {
  var deferred = q.defer();
  var filePath = path.resolve(directory, "markade.json")
  fs.readFile(filePath, "utf-8", function (error, res) {
    if (error) {
      error("  %s❌ CONFIG NOT FOUND %s%s", c.bldred, c.txtrst, directory);
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
        util.error("  %s❌ %s%s", c.bldred, c.txtrst, error);
        deferred.reject(new Error(error));
      } else {
        deferred.resolve(res);
      }
    })
  })

  return deferred.promise;
}

function readfile(fp) {
  var deferred = q.defer();
  fs.readFile(fp, "utf-8", function (error, res) {
    if (error) {
      util.error("  %s❌ %s%s", c.bldred, c.txtrst, error);
      deferred.reject(new Error(error));
    } else {
      deferred.resolve(res);
    }
  });
  return deferred.promise;
}

function mkdir(dir) {
  var deferred = q.defer();
  fs.mkdir(dir, function (error, res) {
    if (error && error.code != "EEXIST") {
      util.error("  %s❌ %s%s", c.bldred, c.txtrst, error);
      deferred.reject(new Error(error));
    } else {
      util.log("  %s✔ %s%s", c.bldgrn, c.txtrst, dir);
      deferred.resolve(res);
    }
  });
  return deferred.promise;
}

function copy(from, to) {
  var deferred = q.defer();
  fs.createReadStream(from)
    .pipe(fs.createWriteStream(to))
    .on("finish", function() {
      util.log("  %s✔ %s%s", c.bldgrn, c.txtrst, to);
      deferred.resolve(to);
    });
  return deferred.promise;
}


// Logging
var LOG_OFF = 0,
    LOG_WARN = 1,
    LOG_ERROR = 2,
    LOG_DEFAULT = 3,
    LOG_INFO = 4;

var shouldLog = LOG_DEFAULT;
function setLogger(type) {
  switch (type) {
    case "off": case false: case 0:
      shouldLog = LOG_OFF;
      break;
    case "warn": case 1:
      shouldLog = LOG_WARN;
      break;
    case "error": case 2:
      shouldLog = LOG_WARN;
      break;
    case "info": case 4:
      shouldLog = LOG_INFO;
      break;
    case "log": case 3: case true: default:
      shouldLog = LOG_DEFAULT;
      break;
  }
  return shouldLog;
}

function log() {
  if (shouldLog >= LOG_DEFAULT) process.stdout.write(util.format.apply(console, arguments) + '\n');
}
function info() {
  if (shouldLog >= LOG_INFO) process.stdout.write(util.format.apply(console, arguments) + '\n');
}
function warn() {
  if (shouldLog >= LOG_WARN) process.stderr.write(util.format.apply(console, arguments) + '\n');
}
function error() {
  if (shouldLog >= LOG_ERROR) process.stderr.write(util.format.apply(console, arguments) + '\n');
}


module.exports = {
  mkdir: mkdir,
  copy: copy,
  scan: scan,
  readfile: readfile,
  checkConfig: checkConfig,
  writefile: writefile,
  EmptyDirError: EmptyDirError,
  setLogger: setLogger,
  info: info,
  log: log,
  warn: warn,
  error: error
}
