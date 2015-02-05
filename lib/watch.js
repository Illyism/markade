var c = require("./colors");
var path = require("path");
var fs = require("fs");
var q = require('q');
var util = require("./util");

var parseTemplate = require("./templates");
var compile = require("./compile");
var markadeServer = require("markade-server");

module.exports = function(directory, options) {
  var output = options.output;
  directory = directory || process.cwd();
  directory = path.resolve(process.cwd(), directory)

  var port = options.port || 8080
  var suppressBrowserLaunch = false

  console.log("Looking for markade.json in %s...", directory);

  util.checkJson(directory)
    .then(function(json) {
      console.log("Launching in %s on %s", directory, port);
      markadeServer.change = function(filePath) {
        console.log(" %s%s%s", c.bldcyn, filePath, c.txtrst);

        var fileName = path.basename(filePath);
        if (fileName[0] == "_")
          compile(directory, options);
        else if (path.extname(filePath) == ".jade")
          parseTemplate(fileName, json);
        else if (path.extname(f,ilePath) == ".md")
          parseTemplate(path.basename(filePath, ".md") + ".jade", json);
      }
      markadeServer.start(port, json.root, json.outputDir, suppressBrowserLaunch);
    }, function(err) {
      console.error("%sNo markade.json found in %s.%s", c.txtred, directory, c.txtrst);
      console.log("\nYou can initialize a markade directory using");
      console.log("  %s%s%s", c.bldcyn, "markade init", c.txtrst)
    })
}