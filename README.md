# Server Push Generator

Generate HTTP/2 Server Push link headers from generated static HTML.

## Install

```sh
npm add server-push-generator
```

> You can replace npm with yarn if needed

## Usage

```js
const spg = require('server-push-generator')

spg({
  cwd: 'path/to/generated/html/files/dir',
  urlTransformer: file => `/${file.replace(/index\.html$/, '')}`, // function to generate url from file path
  contentTransformer: ({html, matches}) => html.replace('x', 'y'), // function to manipulate html string
  backup = false, // default to backup when `contentTransformer` exists
  raw: false, // return string headers instead of object
})

/* output
[
  {
    source: '/zh/guide/',
    headers: [
      '</assets/js/3.f9aace0a.js>; rel=prefetch',
      '</assets/js/24.b2ac9cbd.js>; rel=preload; as=script',
    ]
  }
]
*/
```
