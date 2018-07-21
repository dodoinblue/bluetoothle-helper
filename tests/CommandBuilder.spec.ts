import { CommandBuilder } from '../utils/CommandBuilder'
import { expect } from 'chai'

describe('CommandBuilder', () => {
  it('should construct an empty array', () => {
    let cb = new CommandBuilder()
    expect(cb.bytes.length).to.equal(0)
    expect(cb.bytes).to.deep.equal([])
  })

  it('should construct CommandBuilder with input array', () => {
    let cb = new CommandBuilder([1, 2, 3])
    expect(cb.bytes).to.deep.equal([1, 2, 3])
  })

  it('should append input arrays', () => {
    let cb = new CommandBuilder([4, 5, 6]).appendBytes([0])
    expect(cb.bytes).to.deep.equal([4, 5, 6, 0])
  })

  it('should not change if appending an empty array', () => {
    let cb = new CommandBuilder().appendBytes([])
    expect(cb.bytes).to.deep.equal([])
    expect(cb.bytes).to.not.deep.equal([0])
  })

  const uint8s = [0, 1, 128, 255]
  uint8s.forEach(uint8 => {
    it(`should append a Uint8 ${uint8}`, () => {
      let cb = new CommandBuilder().appendUint8(uint8)
      expect(cb.bytes.length).to.equal(1)
      expect(cb.bytes).to.deep.equal([uint8])
    })
  })

  it(`should append an int8 -1`, () => {
    let cb = new CommandBuilder().appendUint8(-1)
    expect(cb.bytes.length).to.equal(1)
    expect(cb.bytes).to.deep.equal([255])
  })

  it(`should append an int8 -127`, () => {
    let cb = new CommandBuilder().appendUint8(-127)
    expect(cb.bytes.length).to.equal(1)
    expect(cb.bytes).to.deep.equal([129])
  })

  it(`should append uint16 256 using little endian`, () => {
    let cb = new CommandBuilder().appendUint16LittleEndian(256)
    expect(cb.bytes.length).to.equal(2)
    expect(cb.bytes).to.deep.equal([0, 1])
  })

  it(`should append uint16 1 using little endian`, () => {
    let cb = new CommandBuilder().appendUint16LittleEndian(1)
    expect(cb.bytes.length).to.equal(2)
    expect(cb.bytes).to.deep.equal([1, 0])
  })

  it(`should append int16 -2 using little endian`, () => {
    let cb = new CommandBuilder().appendInt16LittleEndian(-2)
    expect(cb.bytes.length).to.equal(2)
    expect(cb.bytes).to.deep.equal([0xFE, 0xFF])
  })

  it(`should append uint32 256 using little endian`, () => {
    let cb = new CommandBuilder().appendUint32LittleEndian(256)
    expect(cb.bytes.length).to.equal(4)
    expect(cb.bytes).to.deep.equal([0, 1, 0, 0])
  })

  it(`should append uint32 65536 using little endian`, () => {
    let cb = new CommandBuilder().appendUint32LittleEndian(65536)
    expect(cb.bytes.length).to.equal(4)
    expect(cb.bytes).to.deep.equal([0, 0, 1, 0])
  })

  it(`should append uint32 1 using little endian`, () => {
    let cb = new CommandBuilder().appendUint32LittleEndian(1)
    expect(cb.bytes.length).to.equal(4)
    expect(cb.bytes).to.deep.equal([1, 0, 0, 0])
  })

  it(`should append int32 -2 using little endian`, () => {
    let cb = new CommandBuilder().appendInt32LittleEndian(-2)
    expect(cb.bytes.length).to.equal(4)
    expect(cb.bytes).to.deep.equal([0xFE, 0xFF, 0xFF, 0xFF])
  })

  it(`should append float32 0.1 using little endian`, () => {
    let cb = new CommandBuilder().appendFloat32LittleEndian(0.1)
    expect(cb.bytes.length).to.equal(4)
    expect(cb.bytes).to.deep.equal([205, 204, 204, 61])
  })

  it(`should append float32 -0.1 using little endian`, () => {
    let cb = new CommandBuilder().appendFloat32LittleEndian(-0.1)
    expect(cb.bytes.length).to.equal(4)
    expect(cb.bytes).to.deep.equal([205, 204, 204, 189])
  })

  it('should append uint16 big endian', () => {
    let cb = new CommandBuilder().appendInteger(256, 2, false, false)
    expect(cb.bytes.length).to.equal(2)
    expect(cb.bytes).to.deep.equal([0x01, 0x00])
  })

  it('should append int16 big endian', () => {
    let cb = new CommandBuilder().appendInteger(-2, 2, false, true)
    expect(cb.bytes.length).to.equal(2)
    expect(cb.bytes).to.deep.equal([0xFF, 0xFE])
  })

  it('should append uint32 big endian', () => {
    let cb = new CommandBuilder().appendInteger(65536, 4, false, false)
    expect(cb.bytes.length).to.equal(4)
    expect(cb.bytes).to.deep.equal([0x00, 0x01, 0x00, 0x00])
  })

  it('should append int32 big endian', () => {
    let cb = new CommandBuilder().appendInteger(-2, 4, false, true)
    expect(cb.bytes.length).to.equal(4)
    expect(cb.bytes).to.deep.equal([0xFF, 0xFF, 0xFF, 0xFE])
  })

  it('should output uint8array', () => {
    let ua = new CommandBuilder([1, 2, 3]).toUnit8Array()
    expect(ua.length).to.equal(3)
    expect(ua instanceof Uint8Array).to.equal(true)
    expect(ua).to.deep.equal(new Uint8Array([1, 2, 3]))
  })

  it('should output array', () => {
    let array = new CommandBuilder([1, 2, 3]).toArray()
    expect(array.length).to.equal(3)
    expect(array instanceof Array).to.equal(true)
    expect(array).to.deep.equal([1, 2, 3])
  })

  it('should be abled to chained together', () => {
    let array = new CommandBuilder([0])
      .appendBytes([1, 2])
      .appendUint8(4)
      .appendInt8(-1)
      .appendUint16LittleEndian(5)
      .appendUint16LittleEndian(6)
      .appendInt16LittleEndian(-1)
      .appendUint32LittleEndian(7)
      .appendInt32LittleEndian(-1)
      .appendFloat32LittleEndian(0.1)
      .toArray()
    expect(array.length).to.equal(23)
    expect(array instanceof Array).to.equal(true)
    expect(array).to.deep.equal([0, 1, 2, 4, 0xFF, 0x05, 0x00, 0x06, 0x00, 0xFF, 0xFF, 0x07, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 205, 204, 204, 61])
  })
})
