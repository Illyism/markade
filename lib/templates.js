var c = require("./colors");
var path = require("path");
var fs = require("fs");
var q = require('q');
var util = require("./util");

var jade = require("jade");

function readfile(fp) {
  var deferred = q.defer();
  fs.readFile(fp, "utf-8", function (error, res) {
    if (error) {
      console.error("  %s❌ %s%s", c.bldred, c.txtrst, error);
      deferred.reject(new Error(error));
    } else {
      deferred.resolve(res);
    }
  });
  return deferred.promise;
}

function Parser(data, markade) {
  this.data = data;
  if (typeof this.data == "string")
    this.data = [data];
  this.markade = markade;
  this.data = data = this.data.map(function(item) {
    var _relative = path.dirname(path.relative(markade.dataDir, item));
    var _output = path.basename(item, ".md") + ".html";
    return {
      directory: _relative,
      data: item,
      output: _output,
      dataPath: path.resolve(markade.dataDir, _relative, item),
      outputPath: path.resolve(markade.outputDir, _relative, _output)
    }
  })

  // console.log(this.data);

  var determineTemplate = function(item, markFile) {
    if (markFile && markFile.normal && markFile.normal.meta && markFile.normal.meta.template) {
      return path.resolve(markade.templateDir, markFile.normal.meta.template);
    }
    if (markade.templates) {
      var temp =  Object.keys(markade.templates).filter(function(template) {
        if (markade.templates[template].indexOf(item.dataFile) >= 0) return path.resolve(markade.templateDir, template);
      })
    }
    var _template = path.basename(item.data, ".md") + ".jade";
    return path.resolve(markade.templateDir, item.directory, _template);
  }

  this.start = function() {
    this.data.forEach(function(item) {
      readfile(item.dataPath)
        .then(function(content) {
          console.log("- Parsing: %s%s%s", c.bldpur, item.dataPath, c.txtrst);
          return util.catchBlock(content);
        }, function(err) {
          console.error("  %s❌ %s%s", c.bldred, c.txtrst, err);
          console.error(err.stack);
        })
        .then(function(markFile) {
          return q.fcall(function () {
            var template = item.template = determineTemplate(item, markFile);
            console.log("  Using template: %s", template);

            var jadeFn = jade.compileFile(template);

            return jadeFn({
              $: markFile.normal.meta,
              html: markFile.normal.html,
              blocks: markFile
            });
          });
        }, function(err) {
          console.error("  %s❌ %s%s", c.bldred, c.txtrst, err);
          console.error(err.stack);
        })
        .then(function(html) {
          return util.writefile(item.outputPath, html)
        }, function(err) {
          console.error("  %s❌ %s%s", c.bldred, c.txtrst, err);
          console.error(err.stack);
        })
        .then(function() {
          console.log("  %s✔ Compiled %s%s + %s = %s", c.bldgrn, c.txtrst, item.data, item.template, item.output);
        }, function(err) {
          console.error("  %s❌ %s%s", c.bldred, c.txtrst, err);
          console.error(err.stack);
        })
    })
  }
}


module.exports = function(data, markade) {
  try {
    var parser = new Parser(data, markade);
    parser.start();
  } catch(err) {
    console.error("  %s❌ %s%s", c.bldred, c.txtrst, err);
    console.error(err.stack)
  }
}