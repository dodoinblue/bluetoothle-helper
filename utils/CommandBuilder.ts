export class CommandBuilder {

  bytes: number[] = []
  constructor (bytes: number[] = []) {
    this.bytes = bytes
  }

  appendBytes (bytes: number[]): this {
    this.bytes = this.bytes.concat(bytes)
    return this
  }

  appendInteger (int: number, byteLength: 1 | 2 | 4, littleEndian: boolean = true, signed: boolean = false): this {
    let method: 'setInt8' | 'setUint8' | 'setInt16' | 'setUint16' | 'setInt32' | 'setUint32'
    let ab: ArrayBuffer = new ArrayBuffer(byteLength)
    let dv = new DataView(ab)
    switch (byteLength) {
      case 1:
        method = signed ? 'setInt8' : 'setUint8'
        break
      case 2:
        method = signed ? 'setInt16' : 'setUint16'
        break
      case 4:
        method = signed ? 'setInt32' : 'setUint32'
        break
      default:
        throw new Error(`appendInt: byteLength ${byteLength} not supported`)
    }
    let func = dv[method].bind(dv)
    func(0, int, littleEndian)
    let ua = new Uint8Array(ab)
    let bytes = Array.from(ua)
    this.appendBytes(bytes)
    return this
  }

  appendUint8 (uint8: number): this {
    return this.appendInteger(uint8, 1, true, false)
  }

  appendInt8 (int8: number): this {
    return this.appendInteger(int8, 1, true, true)
  }

  appendUint16LittleEndian (uint16: number): this {
    return this.appendInteger(uint16, 2, true, false)
  }

  appendInt16LittleEndian (int16: number): this {
    return this.appendInteger(int16, 2, true, true)
  }

  appendUint32LittleEndian (uint32: number): this {
    return this.appendInteger(uint32, 4, true, false)
  }

  appendInt32LittleEndian (int32: number): this {
    return this.appendInteger(int32, 4, true, true)
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
