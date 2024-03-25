# Wasm Bundler
Wasm Bundler is a simple script that enables one to embed their `.wasm` file into their javascript code by creating a `.js` file
that has the wasm binary file gzipped and stringified to base64 for load. This file can then, if one desired, be bundled into
other code of yours via your desired bundler. The generated code does need the `@doctor/encoding-stream/base64` dependency to
function properly.

## Example
### Example Command
Assuming there was a `static/wasm/app.js` and `static/wasm/app_bg.wasm` file already in your code base.
```
deno run --allow-read --allow-write @doctor/wasm-bundler static/wasm/app_bg.wasm ./app.js static/wasm/embed.js
```
### Output
```js
import { DecodeBase64Stream } from '@doctor/encoding-stream/base64'
import x from './app.js'

x(new Response(
	ReadableStream.from((async function* () {
		yield 'Imagine Repeated Base64 Strings Here!'
	})())
		.pipeThrough(new DecodeBase64Stream())
		.pipeThrough(new DecompressionStream('gzip'))
))
```
