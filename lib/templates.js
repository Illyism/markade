var c = require("./colors");
var path = require("path");
var fs = require("fs");
var q = require('q');

var marked = require("meta-marked");
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

function Parser(templates, markade) {
  this.templates = templates;
  this.markade = markade;
  this.data = data = templates.map(function(item) {
    var _data = path.basename(item, ".jade") + ".md";
    var _output = path.basename(item, ".jade") + ".html";
    var _templatePath = path.resolve(markade.templateDir, item);
    return {
      template: item,
      jade: jade.compileFile(_templatePath),
      data: _data,
      output: _output,
      templatePath: _templatePath,
      dataPath: path.resolve(markade.dataDir, _data),
      outputPath: path.resolve(markade.outputDir, _output)
    }
  })

  var catchBlock = function(content) {
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

    for(var key in blocks) {
      if(blocks.hasOwnProperty(key)) {
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

  this.start = function() {
    this.data.forEach(function(item) {
      readfile(item.dataPath)
        .then(function(content) {
          return catchBlock(content);
        }, function(err) {
          console.error("  %s❌ %s%s", c.bldred, c.txtrst, err);
        })
        .then(function(markfile) {
          return q.fcall(function () {
            return item.jade({
              meta: markfile.normal.meta,
              html: markfile.normal.html,
              blocks: markfile
            });
          });
        }, function(err) {
          console.error("  %s❌ %s%s", c.bldred, c.txtrst, err);
        })
        .then(function(html) {
          return writefile(item.outputPath, html)
        }, function(err) {
          console.error("  %s❌ %s%s", c.bldred, c.txtrst, err);
        })
        .then(function() {
          console.log("  %s✔ Compiled %s%s + %s = %s", c.bldgrn, c.txtrst, item.data, item.template, item.output);
        }, function(err) {
          console.error("  %s❌ %s%s", c.bldred, c.txtrst, err);
        })
    })
  }
}


module.exports = function(templates, markade) {
  try {
    var parser = new Parser(templates, markade);
    parser.start();
  } catch(err) {
    console.error(err);
  }
}