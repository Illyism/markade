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

function writefile(fp, html) {
  var deferred = q.defer();
  fs.writeFile(fp, html, function (error, res) {
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
    var _output = path.basename(item, ".md") + ".html";
    return {
      data: item,
      output: _output,
      dataPath: path.resolve(markade.dataDir, item),
      outputPath: path.resolve(markade.outputDir, _output)
    }
  })

  var determineTemplate = function(dataFile, markFile) {
    if (markFile.normal.meta.template) {
      return markFile.normal.meta.template;
    }
    if (markade.templates) {
      var temp =  Object.keys(markade.templates).filter(function(template) {
        if (markade.templates[template].indexOf(dataFile) >= 0) return template;
      })
    }
    return path.basename(dataFile, ".md") + ".jade";
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
            var template = item.template = determineTemplate(item.data, markFile);
            console.log("  Using template: %s", template);

            var jadeFn = jade.compileFile(path.resolve(markade.templateDir, template));

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
          return writefile(item.outputPath, html)
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