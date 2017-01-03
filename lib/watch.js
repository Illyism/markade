var path = require("path");
var fs = require("fs");
var q = require('q');

var util = require("./util");
var markadeServer = require("markade-server");
var c = require("./colors");
var render = require("./render");
var compile = require("./compile");

module.exports = function(directory, options) {
  if (options ){
    if (options.cli) util.setLogger("info");
    if (options.log) util.setLogger(options.log);
  }

  directory = directory || process.cwd();
  directory = path.resolve(process.cwd(), directory);

  var port = options.port || 8080;
  var suppressBrowserLaunch = false;

  util.info("Looking for markade config in %s...", directory);

  util.checkConfig(directory)
    .then(function(json) {
      util.info("Launching in %s on %s", directory, port);
      markadeServer.change = function(filePath) {
        util.info(" %s%s%s", c.bldcyn, filePath, c.txtrst);

        var fileName = path.basename(filePath);
        if (fileName[0] == "_")
          compile(directory, options);
        else if (path.extname(filePath) == ".md")
          render(filePath, json);
        else if (path.extname(filePath) == ".pug")
          compile(directory, options);
      };
      markadeServer.start(port, json.root, json.outputDir, suppressBrowserLaunch);
    }, function(err) {
      util.error("%sNo markade config found in %s.%s", c.txtred, directory, c.txtrst);
      util.info("\nYou can initialize a markade directory using");
      util.info("  %s%s%s", c.bldcyn, "markade init", c.txtrst);
    });
};