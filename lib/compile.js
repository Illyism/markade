var path = require("path");

var c = require("./colors");
var util = require("./util");

module.exports = function(directory, options) {
  var output = options.output;
  directory = directory || process.cwd();

  console.log("Looking for markade.json in %s", directory);
  util.checkJson(directory)
    .then(function(json) {
      console.log("Compiling directory...");
      return util.scan(json.dataDir, ".md")
        .then(function(data) {
          data = data.filter(function(file) {
            return path.basename(file)[0] != "_"
          })
          require("./render")(data, json);
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