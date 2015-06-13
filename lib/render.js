var path = require("path");
var fs = require("fs");
var q = require('q');

var jade = require("jade");
var yaml = require("js-yaml");
var marked = require("marked");

var c = require("./colors");
var util = require("./util");

// Locates the template file to use, in order:
function determineTemplate(item, markFile, json) {
  
  // **1.** .md data file with a `template: file.jade` defined.
  if (markFile && markFile.normal && markFile.normal.meta && markFile.normal.meta.template) {
    return path.resolve(json.templateDir, markFile.normal.meta.template);
  }
  
  // **2.** Globally defined in the templates object in markade config
  if (json.templates) {
    var temp =  Object.keys(json.templates).filter(function(template) {
      if (json.templates[template].indexOf(item.dataFile) >= 0)
        return path.resolve(json.templateDir, template);
    });
  }
  
  // **3.** If none found, it defaults to a file with the same name in the template directory. 
  var _template = path.basename(item.data, ".md") + ".jade";
  return path.resolve(json.templateDir, item.directory, _template);
}


// Catch all the blocks encapsulated in blocks with `key` as key.
// and make an object based on this to be used in the templates.
// ```
//   @ key
//    # Normal Markdown content
//   @ end
// ```
function render(content) {
  var deferred = q.defer();

  var blockType = "normal";
  var lines = content.split("\n");
  var blocks = {};
  for (var i=0; i<lines.length; i++) {
    var line = lines[i];

    if (line.substr(0,1) == "@") {
      blockType = line.substr(1).trim();
      if (blockType === "end") blockType = "normal";
      continue;
    }
    if (blocks[blockType])
      blocks[blockType] += line + "\n";
    else
      blocks[blockType] = line + "\n";
  }

  for (var key in blocks) {
    if (blocks.hasOwnProperty(key)) {
      try {
        blocks[key] = metaMarked(blocks[key]);
      } catch(err) {
        return deferred.reject(new Error(err));
      }
    }
    deferred.resolve(blocks);
  }

  return deferred.promise;
}

function renderSync(content) {
  var blockType = "normal";
  var lines = content.split("\n");
  var blocks = {};

  for (var i=0; i<lines.length; i++) {
    var line = lines[i];
    if (line.substr(0,1) == "@") {
      blockType = line.substr(1).trim();
      if (blockType === "end") blockType = "normal";
      continue;
    }
    if (blocks[blockType])
      blocks[blockType] += line + "\n";
    else
      blocks[blockType] = line + "\n";
  }

  for (var key in blocks)
    if (blocks.hasOwnProperty(key))
      blocks[key] = metaMarked(blocks[key]);
  return blocks;
}

// Splits the given string into a meta section and a markdown section
// if a meta section is present, else returns null
function splitInput(str) {
  if (str.slice(0, 3) !== '---') return;

  var matcher = /\n(\.{3}|-{3})/g;
  var metaEnd = matcher.exec(str);

  return metaEnd && [str.slice(0, metaEnd.index), str.slice(matcher.lastIndex)];
}

// [Based on meta-marked](https://github.com/j201/meta-marked)
var metaMarked = function(src, opt, callback) {
  if (Object.prototype.toString.call(src) !== '[object String]')
    throw new TypeError('First parameter must be a string.');
  src = src.trim();
  var mySplitInput = splitInput(src);

  return mySplitInput ?  {
      meta : yaml.safeLoad(mySplitInput[0]),
      html : marked(mySplitInput[1], opt, callback)
    } : {
      meta : null,
      html : marked(src, opt, callback)
    };
};
metaMarked.__proto__ = marked;

// The complilation routine.
function start(data, json) {
  if (typeof data == "string")
    data = [data];

  data = data.map(function(item) {
    var _relative = path.dirname(path.relative(json.dataDir, item));
    var _output = path.basename(item, ".md") + ".html";
    return {
      directory: _relative,
      data: item,
      output: _output,
      dataPath: path.resolve(json.dataDir, _relative, item),
      outputPath: path.resolve(json.outputDir, _relative, _output)
    };
  });

  function logError(err) {
    util.error("  %s❌ %s%s", c.bldred, c.txtrst, err);
  }

  data.forEach(function(item) {

    // Get the content from each data file.
    util.readfile(item.dataPath)
      .then(function(content) {
        util.info("- Parsing: %s%s%s", c.bldpur, item.dataPath, c.txtrst);
        return render(content);
      })
      .then(function(markFile) {
        return q.fcall(function () {
          // Change output location if specified in data file
          if (markFile.normal.meta && markFile.normal.meta.output) {
            item.output = markFile.normal.meta.output;
            item.outputPath = path.resolve(json.outputDir, item.directory, markFile.normal.meta.output);
            console.log(item.output, item.outputPath);
          }

          var template = item.template = determineTemplate(item, markFile, json);
          util.info("  Using template: %s", template);

          // Determine and compile the template
          try {
            var jadeFn = jade.compileFile(template);

            // Render to HTML.
            return jadeFn({
              $: markFile.normal.meta,
              html: markFile.normal.html,
              blocks: markFile,
              $$: markFile,
              markade: json
            });
          } catch(err) {
            if (err.code === "ENOENT") {
              throw new Error("There is no defined jade file for this markdown document");
            } else {
              throw err; // rethrow
            }
          }
        });
      })
      .then(function(html) {
        // Write the HTML file.
        return util.writefile(item.outputPath, html);
      })
      .then(function() {
        util.log("  %s✔ Compiled %s%s + %s = %s", c.bldgrn, c.txtrst, item.data, item.template, item.output);
      })
      .then(null, logError);
  });
}


function singleStart(data, template, options, callback) {
  try {
  render(data)
    .then(function(markFile) {
      if (template === false || template === null)
      return q.fcall(function() {
        return markFile;
      });


      return q.fcall(function () {
        var jadeFn = jade.compile(template, options.jade);
        return jadeFn({
          $: markFile.normal.meta,
          html: markFile.normal.html,
          blocks: markFile,
          $$: markFile,
          markade: options
        });
      });
    })
    .then(function(html) {
      callback(null, html);
    }, function(err) {
      callback(err);
    });
  } catch(err) {
    callback(err);
  }
}


module.exports = function(arg1, arg2, arg3, arg4) {
  if (typeof arg3 == "function" || typeof arg4 == "function") {
    // arg1: markdown + yaml file
    // arg2: jade file
    // arg3: callback || options
    // arg4: callback
    if (arg4) {
      if (arg3.log) util.setLogger(arg3.log);
      return singleStart(arg1, arg2, arg3, arg4);
    } else {
      return singleStart(arg1, arg2, {}, arg4);
    }
  }
  if (arg2) {
    // arg1: data files
    // arg2: markade config object
    // arg3: options
    if (arg3) {
      if (arg3.cli) util.setLogger("info");
      if (arg3.log) util.setLogger(arg3.log);
    }
    return start(arg1, arg2);
  }

  return renderSync(arg1);
};