# customize-engine-handlebars 

[![NPM version](https://badge.fury.io/js/customize-engine-handlebars.svg)](http://badge.fury.io/js/customize-engine-handlebars)
[![Travis Build Status](https://travis-ci.org/bootprint/customize-engine-handlebars.svg?branch=master)](https://travis-ci.org/bootprint/customize-engine-handlebars)
[![Coverage Status](https://img.shields.io/coveralls/bootprint/customize-engine-handlebars.svg)](https://coveralls.io/r/bootprint/customize-engine-handlebars)
[![Greenkeeper badge](https://badges.greenkeeper.io/bootprint/customize-engine-handlebars.svg)](https://greenkeeper.io/)

> Use handlebars as engine for customize


# Installation

```
npm install customize-engine-handlebars
```

## Usage

The following examples demonstrate how to use this module. The following files are involved:

<pre><code>
├── config-module.js
├── example-merge.js
├── example-partial-names.js
├── example-source-locators.js
├── example-targetFile.js
├── example.js
├── hb-helpers.js
├── hb-preprocessor.js
├─┬ partials-targetFile/
│ └── footer.hbs
├─┬ partials/
│ └── footer.hbs
├─┬ partials2/
│ └── footer.hbs
└─┬ templates/
  ├─┬ subdir/
  │ └── text3.txt.hbs
  ├── text1.txt.hbs
  └── text2.txt.hbs
</code></pre>

### Configuration

The following usage example has a configuration for all possible properties
of the Handlebars-engine:

```js
var customize = require('customize')
customize()
  .registerEngine('handlebars', require('customize-engine-handlebars'))
  .load(require('./config-module.js'))
  .run()
  .done(console.log)
```

This example loads its configuration from the module `config-module.js`:

```js
module.exports = function (customize) {
  return customize.merge({
    handlebars: {
      // Directory containing templates
      templates: 'templates',
      // Directory containing partials
      partials: 'partials',
      // JS-file exporting Handlebars helper-functions
      helpers: 'hb-helpers.js',
      // JS-file exporting a preprocessor function
      preprocessor: 'hb-preprocessor.js',
      // Input data for Handlebars
      data: {
        name: 'nknapp',
        city: 'Darmstadt'
      }
    }
  })
}

```


*A quick note: If your are creating a real configuration-module, you should always
use `require.resolve` or `__dirname` to determine the correct path to referenced files.*

All the templates in the `templates` directory are called with the provided `data` (name and city).
Each one generates an entry in the result of the engine. The templates call a partial that is 
inserted below the main content. Helper functions from the `hb-helpers.js`-file are registered 
with Handlebars and `text2.txt.hbs` uses the `shout`-helper from `hb-helpers.js` to turn a 
string into upper-case. 

```hbs
I'm {{name}}

I'm living in {{shout city}}.

{{>footer}}
```


The example also includes a preprocessor (`hb-preprocessor.js`) that calls 
[the github API](https://developer.github.com/v3/users/#get-a-single-user)
to retrieve information about the user. 

```js
module.exports = function (data) {
  var url = 'https://api.github.com/users/' + data.name
  console.log(url)
  return {
    name: data.name,
    city: data.city,
    github: require('get-promise')('https://api.github.com/users/nknapp', {
      headers: {
        'User-Agent': 'Node'
      }
    }).get('data').then(JSON.parse)
  }
}

```


The result is injected into the data as `github` property and rendered by 
the `footer.hbs` partial.

```hbs
------
Github-Name: {{{github.name}}}
```


The output of this example is:

```
https://api.github.com/users/nknapp
{ handlebars: 
   { 'subdir/text3.txt': '------\nGithub-Name: Nils Knappmeier',
     'text1.txt': 'I\'m nknapp\n\nI\'m living in Darmstadt.\n\n------\nGithub-Name: Nils Knappmeier',
     'text2.txt': 'I\'m nknapp\n\nI\'m living in DARMSTADT.\n\n------\nGithub-Name: Nils Knappmeier' } }
```

### Customizing configurations

We can use the mechanism of [customize](https://npmjs.com/package/customize) to adapt the configuration.
In the following example, we replace the `footer.hbs`-partial by a different version.
We do this by specifying a new partial directory. Partials with the same name as in 
the previous directory will overwrite the old one.

```js
var customize = require('customize')
customize()
  .registerEngine('handlebars', require('customize-engine-handlebars'))
  .load(require('./config-module.js'))
  .merge({
    handlebars: {
      partials: 'partials2'
    }
  })
  .run()
  .done(console.log)
```

The new `footer.hbs` writes only the current temperature, instead of the weather description

```hbs
------
Blog: {{{github.blog}}}

```


The output of this example is

```
https://api.github.com/users/nknapp
{ handlebars: 
   { 'subdir/text3.txt': '------\nBlog: https://blog.knappi.org\n',
     'text1.txt': 'I\'m nknapp\n\nI\'m living in Darmstadt.\n\n------\nBlog: https://blog.knappi.org\n',
     'text2.txt': 'I\'m nknapp\n\nI\'m living in DARMSTADT.\n\n------\nBlog: https://blog.knappi.org\n' } }
```

In a similar fashion, we could replace other parts of the configuration, like templates, helpers
and the pre-processor. If we would provide a new preprocessor, it could call the old one,
by calling `this.parent(args)`

### Name of the current target-file

In some cases, we need to know which file we are actually rendering at the moment.
If we are rendering the template `some/template.txt.hbs`, the file `some/template.txt`
will be written (at least if [customize-write-files](https://npmjs.com/package/customize-write-files) is used. If we want to
create relative links from this file, we need this information within helpers.
The parameter `options.customize.targetFile` that is passed to each helper, contains this information.
The following configuration registers a helper that return the targetFile:

```js
var customize = require('customize')
customize()
  .registerEngine('handlebars', require('customize-engine-handlebars'))
  .load(require('./config-module.js'))
  .merge({
    handlebars: {
      templates: 'templates',
      partials: 'partials-targetFile',
      helpers: {
        // Helper that returns the targetFile
        targetFile: function (options) {
          return options.customize.targetFile
        }
      }
    }
  })
  .run()
  .done(console.log)
```

Each template includes the `{{>footer}}`-partial, which calls the `{{targetFile}}`-helper
to include the name of the current file.

```hbs
------
File: {{targetFile}}
```


The output of this configuration is

```
https://api.github.com/users/nknapp
{ handlebars: 
   { 'subdir/text3.txt': '------\nFile: subdir/text3.txt',
     'text1.txt': 'I\'m nknapp\n\nI\'m living in Darmstadt.\n\n------\nFile: text1.txt',
     'text2.txt': 'I\'m nknapp\n\nI\'m living in DARMSTADT.\n\n------\nFile: text2.txt' } }
```

### Accessing engine and configuration helpers

The configuration and the engine itself is passed as additional option into each helper call:

```
module.exports = {
    function(value, options) {
        console.log("handlebars", options.customize.engine)
        console.log("customizeConfig", options.customize.config)
    }
}
```

### Which partial generates what? (Method 1)

When we want to overriding parts of the output, we are looking for the correct partial to do so. 
For this purpose, the engine allows to specify a "wrapper function" for partials. This function
is called with the contents and the name of a partial and returns the new content. Programs like
`Thought` can optionally include the partial names into the output to show the user which partial
to override in order to modify a given part of the output.


```js
var customize = require('customize')
customize()
  .registerEngine('handlebars', require('customize-engine-handlebars'))
  .load(require('./config-module.js'))
  .merge({
    handlebars: {
      partials: 'partials2',
      partialWrapper: function (contents, name) {
        return '[BEGIN ' + name + ']\n' + contents + '[END ' + name + ']'
      }
    }
  })
  .run()
  .done(console.log)
```

```
https://api.github.com/users/nknapp
{ handlebars: 
   { 'subdir/text3.txt': '[BEGIN footer]\n------\nBlog: https://blog.knappi.org\n[END footer]',
     'text1.txt': 'I\'m nknapp\n\nI\'m living in Darmstadt.\n\n[BEGIN footer]\n------\nBlog: https://blog.knappi.org\n[END footer]',
     'text2.txt': 'I\'m nknapp\n\nI\'m living in DARMSTADT.\n\n[BEGIN footer]\n------\nBlog: https://blog.knappi.org\n[END footer]' } }
```

### Which partial generates what? (Method 2)

Another method for gathering information about the source of parts of the output are source-locators. 
The engine incoorporates the library [handlebars-source-locators](https://npmjs.com/package/handlebars-source-locators) to integrate a kind of 
"source-map for the poor" into the output. Source-locators are activated by setting the option
`addSourceLocators` to `true`:

```js
var customize = require('customize')
customize()
  .registerEngine('handlebars', require('customize-engine-handlebars'))
  .load(require('./config-module.js'))
  .merge({
    handlebars: {
      partials: 'partials2',
      addSourceLocators: true
    }
  })
  .run()
  .done(console.log)
```

The output contain tags that contain location-information of the succeeding text:

* `<sl line="1" col="12" file="templates/text1.txt.hbs"></sl>text...` for text the originate from a template file
* `<sl line="1" col="0" partial="footer" file="partials2/footer.hbs"></sl>text...` for text the originate from a partial

Example output:

```
https://api.github.com/users/nknapp
{ handlebars: 
   { 'subdir/text3.txt': '<sl line="1" col="0" partial="footer" file="partials2/footer.hbs"></sl>------\nBlog: <sl line="2" col="6" partial="footer" file="partials2/footer.hbs"></sl>https://blog.knappi.org<sl line="2" col="23" partial="footer" file="partials2/footer.hbs"></sl>\n<sl line="3" col="0" partial="footer" file="partials2/footer.hbs"></sl>',
     'text1.txt': '<sl line="1" col="0" file="templates/text1.txt.hbs"></sl>I\'m <sl line="1" col="4" file="templates/text1.txt.hbs"></sl>nknapp<sl line="1" col="12" file="templates/text1.txt.hbs"></sl>\n\nI\'m living in <sl line="3" col="14" file="templates/text1.txt.hbs"></sl>Darmstadt<sl line="3" col="22" file="templates/text1.txt.hbs"></sl>.\n\n<sl line="5" col="0" file="templates/text1.txt.hbs"></sl><sl line="1" col="0" partial="footer" file="partials2/footer.hbs"></sl>------\nBlog: <sl line="2" col="6" partial="footer" file="partials2/footer.hbs"></sl>https://blog.knappi.org<sl line="2" col="23" partial="footer" file="partials2/footer.hbs"></sl>\n<sl line="3" col="0" partial="footer" file="partials2/footer.hbs"></sl>',
     'text2.txt': '<sl line="1" col="0" file="templates/text2.txt.hbs"></sl>I\'m <sl line="1" col="4" file="templates/text2.txt.hbs"></sl>nknapp<sl line="1" col="12" file="templates/text2.txt.hbs"></sl>\n\nI\'m living in <sl line="3" col="14" file="templates/text2.txt.hbs"></sl>DARMSTADT<sl line="3" col="28" file="templates/text2.txt.hbs"></sl>.\n\n<sl line="5" col="0" file="templates/text2.txt.hbs"></sl><sl line="1" col="0" partial="footer" file="partials2/footer.hbs"></sl>------\nBlog: <sl line="2" col="6" partial="footer" file="partials2/footer.hbs"></sl>https://blog.knappi.org<sl line="2" col="23" partial="footer" file="partials2/footer.hbs"></sl>\n<sl line="3" col="0" partial="footer" file="partials2/footer.hbs"></sl>' } }
```

### Asynchronous helpers

The `customize-engine-handlebars` uses the [promised-handlebars](https://npmjs.com/package/promised-handlebars) package as wrapper around Handlebars.
It allows helpers to return promises instead of real values.




# API reference

## Functions

<dl>
<dt><a href="#addEngine">addEngine(helpers, hbs, hbsOptions)</a> ⇒ <code>object.&lt;function()&gt;</code></dt>
<dd><p>Wraps helpers with a function that provides
and object {engine, config} as additional parameter</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#CustomizeHandlebarsConfig">CustomizeHandlebarsConfig</a> : <code>object</code></dt>
<dd><p>The default configuration for the handlebars engine</p>
</dd>
</dl>

<a name="addEngine"></a>

## addEngine(helpers, hbs, hbsOptions) ⇒ <code>object.&lt;function()&gt;</code>
Wraps helpers with a function that provides
and object {engine, config} as additional parameter

**Kind**: global function  
**Returns**: <code>object.&lt;function()&gt;</code> - the wrapped helpers  

| Param | Type | Description |
| --- | --- | --- |
| helpers | <code>object.&lt;function()&gt;</code> | the helpers object |
| hbs | <code>Handlebars</code> | the current handlebars engine |
| hbsOptions | <code>object</code> | the options of the Handlebars engine |

<a name="CustomizeHandlebarsConfig"></a>

## CustomizeHandlebarsConfig : <code>object</code>
The default configuration for the handlebars engine

**Kind**: global typedef  
**Api**: public  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| partials | <code>string</code> | path to a partials directory. Each `.hbs`-file in the directory (or in the tree)   is registered as partial by its name (or relative path), without the `.hbs`-extension. |
| partialWrapper | <code>function</code> | a function that can modify partials   just before they are registered with the Handlebars engine. It receives the partial contents as   first parameter and the partial name as second parameter and must return the new content (or a promise for   the content. The parameter was introduced mainly for debugging purposes (i.e. to surround each   partial with a string containing the name of the partial). When this function is overridden, the   parent function is available throught `this.parent`. |
| helpers | <code>string</code> \| <code>object</code> \| <code>function</code> | if this is an object it is assumed to be a list of helper functions,   if this is function it is assumed to return an object of helper functions, if this is a string,   it is assumed to be the path to a module returning either an object of a function as above. |
| templates | <code>string</code> | path to a directory containing templates. Handlebars is called with each `.hbs`-file   as template. The result of the engine consists of an object with a property for each template and the   Handlebars result for this template as value. |
| data | <code>string</code> \| <code>object</code> \| <code>function</code> | a javascript-object to use as input for handlebars. Same as with the `helpers`,   it is also acceptable to specify the path to a module exporting the data and a function computing   the data. |
| preprocessor | <code>function</code> \| <code>string</code> | a function that takes the input data as first parameter and   transforms it into another object or the promise for an object. It the input data is a promise itself,   is resolved before calling this function. If the preprocessor is overridden, the parent   preprocessor is available with `this.parent(data)` |
| hbsOptions | <code>object</code> | options to pass to `Handlebars.compile`. |
| addSourceLocators | <code>boolean</code> | add [handlebars-source-locators](https://github.com/nknapp/handlebars-source-locators)   to the output of each template |




## License

`customize-engine-handlebars` is published under the MIT-license.

See [LICENSE.md](LICENSE.md) for details.


## Release-Notes
 
For release notes, see [CHANGELOG.md](CHANGELOG.md)
 
## Contributing guidelines

See [CONTRIBUTING.md](CONTRIBUTING.md).