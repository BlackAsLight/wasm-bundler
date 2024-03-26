/**
 * @module
 * This module offers a method to convert a wasm binary into a javascript file via a transform stream.
 */

import { EncodeBase64Stream } from '@doctor/encoding-stream/base64'

/**
 * WasmToJs is a TransformStream that expects a ReadableStream<Uint8Array> of a wasm binary file, and outputs a
 * ReadableStream<Uint8Array> of a javascript file.
 */
export class WasmToJs {
	#readable: ReadableStream<Uint8Array>
	#writable: WritableStream<Uint8Array>
	/**
	 * @param relativeJsImport The import location of the wasm's corresponding js file relative to the output of the generated
	 * content.
	 * @param [defaultFunctionName='x'] A generic name for the default import.
	 */
	constructor(relativeJsImport: string, defaultFunctionName = 'x') {
		const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
		this.#writable = writable
		this.#readable = readable
			.pipeThrough(new CompressionStream('gzip'))
			.pipeThrough(new EncodeBase64Stream())
			.pipeThrough(
				new TransformStream<string, string>({
					start(controller) {
						controller.enqueue(
							`import { DecodeBase64Stream } from '@doctor/encoding-stream/base64'\nimport ${defaultFunctionName} from '${relativeJsImport}'\n\n${defaultFunctionName}(new Response(\n\tReadableStream.from((async function* () {\n`,
						)
					},
					transform(chunk, controller) {
						controller.enqueue("\t\tyield '")
						controller.enqueue(chunk)
						controller.enqueue("'\n")
					},
					flush(controller) {
						controller.enqueue(
							"\t})())\n\t\t.pipeThrough(new DecodeBase64Stream())\n\t\t.pipeThrough(new DecompressionStream('gzip'))\n))\n",
						)
					},
				}),
			)
			.pipeThrough(new TextEncoderStream())
	}

	/**
	 * The readable property of a TransformStream.
	 */
	get readable(): ReadableStream<Uint8Array> {
		return this.#readable
	}

	/**
	 * The writable property of a TransformStream.
	 */
	get writable(): WritableStream<Uint8Array> {
		return this.#writable
	}
}
