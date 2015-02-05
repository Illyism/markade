var c = require("./colors");
var readline = require('readline');
var path = require("path");
var fs = require("fs");
var q = require('q');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function mkdir(dir) {
  var deferred = q.defer();
  fs.mkdir(dir, function (error, res) {
    if (error && error.code != "EEXIST") {
      console.error("  %s❌ %s%s", c.bldred, c.txtrst, error);
      deferred.reject(new Error(error));
    } else {
      console.log("  %s✔ %s%s", c.bldgrn, c.txtrst, dir);
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
      console.log("  %s✔ %s%s", c.bldgrn, c.txtrst, to);
      deferred.resolve(to);
    });
  return deferred.promise;
}

function explain() {
  console.log("This utility will walk you through making a markade directory.")
  console.log("\nIt will set up a "+c.bldcyn+"markade.json"+c.txtrst+" file with defaults")
  console.log("and set up a basic "+c.bldcyn+"Hello World"+c.txtrst+" page.")
  console.log("\nPress ^C at any time to quit.")
}

function check_dir(directory, options) {
  var dir = path.resolve(process.cwd(), directory);
  console.log("\nSetting up in %s%s%s:", c.bldcyn, dir, c.txtrst);

  var outputPath =  path.resolve(dir, options.output || "public");
    var cssPath =  path.resolve(dir, options.output || "public", "css");
    var jsPath =  path.resolve(dir, options.output || "public", "js");
  var templatePath =  path.resolve(dir, options.templates || "templates");
  var dataPath =  path.resolve(dir, options.templates || "data");
  console.log("  %s%s", c.bldwht, dir);
  console.log("  %s%s", c.bldwht, templatePath);
  console.log("  %s%s", c.bldwht, dataPath);
  console.log("  %s%s", c.bldwht, outputPath);
    console.log("   %s%s", c.bldwht, cssPath);
    console.log("   %s%s%s", c.bldwht, jsPath, c.txtrst);

  var result = {
    output: outputPath,
    css: cssPath,
    js: jsPath,
    template: templatePath,
    data: dataPath,
    root: dir,
  }

  rl.question("\n» Is that okay? ["+c.bldylw+"yes"+c.txtrst+"] " , function(answer) {
    if (answer == "y" || answer == "yes" || answer == "sure" || answer == "yup")
      init(result)
    else if (typeof answer == "undefined" || answer.length == 0)
      init(result)
    else
      rl.close();
  });
}

function writeDirectories(result) {
  var deferred = q.defer();
  mkdir(result.root)
    .then(function() {return mkdir(result.template)})
    .then(function() {return mkdir(result.data)})
    .then(function() {return mkdir(result.output)})
    .then(function() {return mkdir(result.js)})
    .then(function() {return mkdir(result.css)})
    .fail(function(err) {
      deferred.reject(new Error(err));
    })
    .done(function(result) {
      deferred.resolve();
    })
  return deferred.promise;
}

function writeFiles(result) {
  var deferred = q.defer();

  var markade = {};
  markade.name = "Sample Markade Site";
  markade.directories = {
    "output": path.relative(result.root, result.output),
    "template": path.relative(result.root, result.template),
    "data": path.relative(result.root, result.data)
  }

  var filePath = path.resolve(result.root, "markade.json");
  fs.writeFile(filePath, JSON.stringify(markade, null, 2), function(error, res) {
    if (error && error.code != "EEXIST") {
      console.error("  ❌ %s", error);
      deferred.reject(new Error(error));
    } else {
      console.log("\n  %s✔ %s%s", c.bldgrn, c.txtrst, filePath);
      deferred.resolve(res);
    }
  })

  return deferred.promise;
}

function copySamples(result) {
  var sampleDir = path.resolve( __dirname, "..", "sample");
  var srcFiles = ["style.css", "index.jade", "index.md"]
  var targFiles = [
    path.resolve(result.css, "style.css"),
    path.resolve(result.template, "index.jade"),
    path.resolve(result.data, "index.md"),
  ]
  var proms = []

  for (var i=0; i<srcFiles.length; i++)
    proms.push(copy(path.resolve(sampleDir, srcFiles[i]), targFiles[i]))

  return q(proms);
}

function init(result) {
  writeDirectories(result)
  .then(function() {return writeFiles(result)})
  .then(function() {return copySamples(result)})
  .allResolved()
  .done(function(num) {
    var whereami = path.relative(process.cwd(), result.root)
    console.log("\n%s  ✔%s Now run %s%s %s%s",
      c.bldgrn, c.txtrst,
      c.bldcyn, "markade compile", whereami, c.txtrst)

    process.exit(0);
  });
}

module.exports = function(directory, options) {
  var output = options.output;
  directory = directory || process.cwd();

  explain();

  if (directory == process.cwd()) {
    rl.question("\n» Where do you want to initialize? ["+c.bldylw+directory+c.txtrst+"]? ",
      function(answer) {
        directory = answer || directory;
        check_dir(directory, options);
    });
  } else {
    check_dir(directory, options);
  }
}