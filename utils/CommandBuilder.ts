export class CommandBuilder {

  bytes: number[] = []
  constructor (bytes: number[] = []) {
    this.bytes = bytes
  }

  appendBytes (bytes: number[]): this {
    this.bytes = this.bytes.concat(bytes)
    return this
  }

  appendUint8 (uint8: number): this {
    this.appendBytes([uint8])
    return this
  }

  appendUint16LittleEndian (uint16: number): this {
    let ab = new ArrayBuffer(2)
    let dv = new DataView(ab)
    dv.setUint16(0, uint16, true)
    let ua = new Uint8Array(ab)
    let bytes = Array.from(ua)
    this.appendBytes(bytes)
    return this
  }

  appendUint32LittleEndian (uint32: number): this {
    let ab = new ArrayBuffer(4)
    let dv = new DataView(ab)
    dv.setUint32(0, uint32, true)
    let ua = new Uint8Array(ab)
    let bytes = Array.from(ua)
    this.appendBytes(bytes)
    return this
  }

  appendFloat32LittleEndian (uint32: number): this {
    let ab = new ArrayBuffer(4)
    let dv = new DataView(ab)
    dv.setFloat32(0, uint32, true)
    let ua = new Uint8Array(ab)
    let bytes = Array.from(ua)
    this.appendBytes(bytes)
    return this
  }

  toUnit8Array (): Uint8Array {
    return new Uint8Array(this.bytes)
  }

  toArray (): number[] {
    let ua = new Uint8Array(this.bytes)
    return Array.from(ua)
  }
}
