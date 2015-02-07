var readline = require('readline');
var path = require("path");
var fs = require("fs");
var q = require('q');

var c = require("./colors");
var util = require("./util");

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// **Handled first** - Set up path variables here and returns them.
function check(directory, options) {
  var deferred = q.defer();

  var dir = path.resolve(process.cwd(), directory);
  console.log("\nSetting up in %s%s%s:", c.bldcyn, dir, c.txtrst);

  // **data**: All the markdown / yaml files.
  var dataPath =  path.resolve(dir, options.templates || "data");
  // **template**: All the Jade files.
  var templatePath =  path.resolve(dir, options.templates || "templates");
  // **output**: Static directory that includes HTML files.
  var outputPath =  path.resolve(dir, options.output || "public");
  // **css/js**: Additional directories that are created in the output directory.
  var cssPath =  path.resolve(dir, options.output || "public", "css");
  var jsPath =  path.resolve(dir, options.output || "public", "js");

  console.log("  %s%s", c.bldwht, dir); // Markade root directory
  console.log("  %s%s", c.bldwht, dataPath);
  console.log("  %s%s", c.bldwht, templatePath);
  console.log("  %s%s", c.bldwht, outputPath);
  console.log("  %s%s", c.bldwht, cssPath);
  console.log("  %s%s%s", c.bldwht, jsPath, c.txtrst);

  var json = {
    data: dataPath,
    template: templatePath,
    output: outputPath,
    css: cssPath,
    js: jsPath,
    root: dir
  };

  // And a confirmation is asked in the command line.
  rl.question("\n» Is that okay? ["+c.bldylw+"yes"+c.txtrst+"] " , function(answer) {
    if (answer == "y" || answer == "yes" || answer == "sure" || answer == "yup")
      deferred.resolve(json)
    else if (typeof answer == "undefined" || answer.length == 0)
      deferred.resolve(json)
    else {
      deferred.reject(false);
    }
  });

  return deferred.promise;
}

// **Handled Second** - Makes all the directories as confirmed.
function writeDirectories(result) {
  var deferred = q.defer();
  util.mkdir(result.root)
    .then(function() {return util.mkdir(result.template)})
    .then(function() {return util.mkdir(result.data)})
    .then(function() {return util.mkdir(result.output)})
    .then(function() {return util.mkdir(result.js)})
    .then(function() {return util.mkdir(result.css)})
    .fail(function(err) {
      deferred.reject(new Error(err));
    })
    .done(function(result) {
      deferred.resolve();
    })
  return deferred.promise;
}

// **Handled Third** - Writes the markade.json file.
function writeFiles(result) {
  var json = {};
  json.name = "Sample Markade Site";
  json.directories = {
    "output": path.relative(result.root, result.output),
    "template": path.relative(result.root, result.template),
    "data": path.relative(result.root, result.data)
  }
  json.templates = {
    "index.jade": ["index.md", "second.md"]
  }

  var filePath = path.resolve(result.root, "markade.json");
  return util.writefile(filePath, JSON.stringify(json, null, 2));
}

// **Handled Last** -  Copies the sample files for a hello world page.
function copySamples(result) {
  var sampleDir = path.resolve( __dirname, "..", "sample");
  var srcFiles = ["style.css", "index.jade", "index.md", "second.md"]
  var targFiles = [
    path.resolve(result.css, "style.css"),
    path.resolve(result.template, "index.jade"),
    path.resolve(result.data, "index.md"),
    path.resolve(result.data, "second.md"),
  ]
  var proms = []

  for (var i=0; i<srcFiles.length; i++)
    proms.push(util.copy(path.resolve(sampleDir, srcFiles[i]), targFiles[i]))

  return q(proms);
}


function init(directory, options) {
  check(directory, options)
    .then(function(result) {
      return writeDirectories(result)
        .then(function() {return writeFiles(result)})
        .then(function() {return copySamples(result)})
        .allResolved()
        .done(function(num) {
          var whereami = path.relative(process.cwd(), result.root);
          console.log("\n%s  ✔%s Now run %s%s %s%s",
            c.bldgrn, c.txtrst,
            c.bldcyn, "markade compile", whereami, c.txtrst);
          process.exit(0);
        });
    }, function(err) {
      rl.close();
      process.exit(0);
    })
}

module.exports = function(directory, options) {
  var output = options.output;
  directory = directory || process.cwd();

  console.log("This tool will assist you with making a Markade directory.")
  console.log("\nIt will set up a "+c.bldcyn+"markade.json"+c.txtrst+" file with some defaults and")
  console.log("set up a basic "+c.bldcyn+"Hello World"+c.txtrst+" page.")
  console.log("\nPress ^C at any time to quit.")

  if (directory == process.cwd()) {
    rl.question("\n» Where do you want to initialize? ["+c.bldylw+directory+c.txtrst+"]? ",
      function(answer) {
        directory = answer || directory;
        init(directory, options);
    });
  } else {
    init(directory, options);
  }
}