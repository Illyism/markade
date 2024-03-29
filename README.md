<h1 align="center">
  <br>
  <img width="450" src="https://github.com/Illyism/markade/assets/304283/60ef3113-3de3-4aab-b5f5-12e16b67ed82" alt="markade">
  <br>
  <br>
</h1>

**A static site generator using [Pug](https://github.com/pugjs/pug), [Markdown](https://help.github.com/articles/markdown-basics/) and [YAML](http://www.yaml.org/)**


## Installation


```bash
  npm install -g markade
```

## Usage

```bash
  markade -h
    init [directory]                Initialize a markade directory
    compile [directory]             Compiles a markade directory
    watch [options] [directory]     Watches for changes and sets up a dev server
```

### Init

1. *(Optional)* Make a new directory.
2. To initialize, run `markade init <directory>`. This will create a markade.json file and copy over the sample templates and data.
3. You can edit the markade.json file as you wish, such as the paths for outut, template or data.

### Compile

1. *(Optional)* Move into your directory.
2. To compile, run `markade compile <directory>`. This will look for markade.json you created earlier then look for data files in the data directory you specified and compare them against the templates in the following way:
  1. A YAML variable `template: file.jade` specified.
  2. Templates defined in your markade.json in a templates object. `"templates": {"file.jade": "file.md"}`
  3. If none found, it defaults to a file with the same name in the template directory. 
3. Then it will write the file in the same relative path as your data file in your output directory in the following way:
  1. A YAML variable `output: file.xml` specified.
  2. The same name and relative path as your data file: `data/about/index.md` -> `public/about/index.html`.

### Watch and Server

1. To watch for changes and run a server, run `markade watch <directory>`

## License

MIT © [illyism](http://il.ly)
