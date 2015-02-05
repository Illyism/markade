#!/usr/bin/env node

var program = require('commander');
 
program
  .version('0.0.1')

program
  .command('init [directory]')
  .alias("setup")
  .description('Initialize a markade directory')
  .action(function(directory, options){
    require("./lib/init")(directory, options);
  }).on("--help", function() {
    console.log('  Examples:');
    console.log();
    console.log('    $ markade init .');
    console.log('    $ markade init ~/blog/');
    console.log('    $ markade init /var/www/blog/');
    console.log();
  })

program
  .command('compile [directory]')
  .alias("setup")
  .description('Compiles a markade directory')
  .action(function(directory, options){
    require("./lib/compile")(directory, options);
  }).on("--help", function() {
    console.log('  Examples:');
    console.log();
    console.log('    $ markade compile .');
    console.log('    $ markade compile ~/blog/');
    console.log('    $ markade compile /var/www/blog/');
    console.log();
  })

program.parse(process.argv);