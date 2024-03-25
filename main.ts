/**
 * @module
 * This module is a self contained script that converts a wasm binary file into a javascript one.
 */

import { EncodeBase64Stream } from '@doctor/encoding-stream/base64'

if (!import.meta.main)
	throw Error(
		'This module is meant to be called as a self contained application and not as an import.\nTry @doctor/wasm-bundler/',
	)

const [inWasmFile, inJsFile, outFile] = Deno.args

if (typeof inWasmFile !== 'string' || typeof inJsFile !== 'string' || typeof outFile !== 'string')
	throw Error('Usage Error: deno run --allow-read --allow-write @doctor/wasm-bundler <pathToWasmFile> <pathToJsFileRelativeToOutPath> <pathToOutFile>')

await (
	await Deno.open(inWasmFile)
).readable
	.pipeThrough(new CompressionStream('gzip'))
	.pipeThrough(new EncodeBase64Stream())
	.pipeThrough(
		new TransformStream<string, string>({
			start(controller) {
				controller.enqueue(
					`import { DecodeBase64Stream } from '@doctor/encoding-stream/base64'\nimport x from '${inJsFile}'\n\nx(new Response(ReadableStream.from((async function* () {\n`,
				)
			},
			transform(chunk, controller) {
				controller.enqueue("\tyield '" + chunk + "'\n")
			},
			flush(controller) {
				controller.enqueue(
					"})())\n\t.pipeThrough(new DecodeBase64Stream())\n\t.pipeThrough(new DecompressionStream('gzip'))))\n",
				)
			},
		}),
	)
	.pipeThrough(new TextEncoderStream())
	.pipeTo((await Deno.create(outFile)).writable)
