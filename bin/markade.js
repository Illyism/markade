#!/usr/bin/env node

var program = require('commander');
var pkg = require("../package.json");
 
program
  .version(pkg.version);

program
  .command('init [directory]')
  .description('Initialize a markade directory')
  .action(function(directory, options){
    options.cli = true;
    require("../lib/init")(directory, options);
  }).on("--help", function() {
    console.log('  Examples:');
    console.log();
    console.log('    $ markade init .');
    console.log('    $ markade init ~/blog/');
    console.log('    $ markade init /var/www/blog/');
    console.log();
  });

program
  .command('compile [directory]')
  .description('Compiles a markade directory')
  .action(function(directory, options){
    options.cli = true;
    require("../lib/compile")(directory, options);
  }).on("--help", function() {
    console.log('  Examples:');
    console.log();
    console.log('    $ markade compile .');
    console.log('    $ markade compile ~/blog/');
    console.log('    $ markade compile /var/www/blog/');
    console.log();
  });

program
  .command('server [directory]')
  .alias("watch")
  .description('Watches for changes and sets up a dev server')
  .option("-p --port <port>", "Sets the port", parseInt)
  .action(function(directory, options){
    options.cli = true;
    require("../lib/watch")(directory, options);
  }).on("--help", function() {
    console.log('  Examples:');
    console.log();
    console.log('    $ markade server .');
    console.log('    $ markade server -p 8080 /var/www/blog/');
    console.log();
  });

program
  .command('*')
  .action(function(){
    program.help();
  });

program.parse(process.argv);