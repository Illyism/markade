var path = require("path");

var c = require("./colors");
var util = require("./util");

module.exports = function(directory, options) {
  directory = directory || process.cwd();

  if (options) {
    if (options.cli) util.setLogger("info");
    if (options.log) util.setLogger(options.log);
  }

  util.info("Looking for markade config in %s", directory);
  util.checkConfig(directory)
    .then(function(json) {
      util.info("Compiling directory...");
      return util.scan(json.dataDir, ".md")
        .then(function(data) {
          data = data.filter(function(file) {
            return path.basename(file)[0] != "_";
          });
          require("./render")(data, json, options);
        }, function(err) {
          if (err.code == 10) util.log("  %s✔ Nothing to do %s%s", c.bldgrn, c.txtrst, json.dataDir);
          else util.error(err);
        });
    }, function(err) {
      process.exit(-1);
    });
};