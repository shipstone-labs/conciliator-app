"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target2, all) => {
    for (var name in all)
      __defProp(target2, name, { get: all[name], enumerable: true });
  };

  // node_modules/.pnpm/cbor-x@1.6.0/node_modules/cbor-x/decode.js
  function checkedRead() {
    try {
      let result = read();
      if (bundledStrings) {
        if (position >= bundledStrings.postBundlePosition) {
          let error = new Error("Unexpected bundle position");
          error.incomplete = true;
          throw error;
        }
        position = bundledStrings.postBundlePosition;
        bundledStrings = null;
      }
      if (position == srcEnd) {
        currentStructures = null;
        src = null;
        if (referenceMap)
          referenceMap = null;
      } else if (position > srcEnd) {
        let error = new Error("Unexpected end of CBOR data");
        error.incomplete = true;
        throw error;
      } else if (!sequentialMode) {
        throw new Error("Data read, but end of buffer not reached");
      }
      return result;
    } catch (error) {
      clearSource();
      if (error instanceof RangeError || error.message.startsWith("Unexpected end of buffer")) {
        error.incomplete = true;
      }
      throw error;
    }
  }
  function read() {
    let token = src[position++];
    let majorType = token >> 5;
    token = token & 31;
    if (token > 23) {
      switch (token) {
        case 24:
          token = src[position++];
          break;
        case 25:
          if (majorType == 7) {
            return getFloat16();
          }
          token = dataView.getUint16(position);
          position += 2;
          break;
        case 26:
          if (majorType == 7) {
            let value = dataView.getFloat32(position);
            if (currentDecoder.useFloat32 > 2) {
              let multiplier = mult10[(src[position] & 127) << 1 | src[position + 1] >> 7];
              position += 4;
              return (multiplier * value + (value > 0 ? 0.5 : -0.5) >> 0) / multiplier;
            }
            position += 4;
            return value;
          }
          token = dataView.getUint32(position);
          position += 4;
          break;
        case 27:
          if (majorType == 7) {
            let value = dataView.getFloat64(position);
            position += 8;
            return value;
          }
          if (majorType > 1) {
            if (dataView.getUint32(position) > 0)
              throw new Error("JavaScript does not support arrays, maps, or strings with length over 4294967295");
            token = dataView.getUint32(position + 4);
          } else if (currentDecoder.int64AsNumber) {
            token = dataView.getUint32(position) * 4294967296;
            token += dataView.getUint32(position + 4);
          } else
            token = dataView.getBigUint64(position);
          position += 8;
          break;
        case 31:
          switch (majorType) {
            case 2:
            // byte string
            case 3:
              throw new Error("Indefinite length not supported for byte or text strings");
            case 4:
              let array = [];
              let value, i = 0;
              while ((value = read()) != STOP_CODE) {
                if (i >= maxArraySize) throw new Error(`Array length exceeds ${maxArraySize}`);
                array[i++] = value;
              }
              return majorType == 4 ? array : majorType == 3 ? array.join("") : Buffer.concat(array);
            case 5:
              let key;
              if (currentDecoder.mapsAsObjects) {
                let object = {};
                let i2 = 0;
                if (currentDecoder.keyMap) {
                  while ((key = read()) != STOP_CODE) {
                    if (i2++ >= maxMapSize) throw new Error(`Property count exceeds ${maxMapSize}`);
                    object[safeKey(currentDecoder.decodeKey(key))] = read();
                  }
                } else {
                  while ((key = read()) != STOP_CODE) {
                    if (i2++ >= maxMapSize) throw new Error(`Property count exceeds ${maxMapSize}`);
                    object[safeKey(key)] = read();
                  }
                }
                return object;
              } else {
                if (restoreMapsAsObject) {
                  currentDecoder.mapsAsObjects = true;
                  restoreMapsAsObject = false;
                }
                let map = /* @__PURE__ */ new Map();
                if (currentDecoder.keyMap) {
                  let i2 = 0;
                  while ((key = read()) != STOP_CODE) {
                    if (i2++ >= maxMapSize) {
                      throw new Error(`Map size exceeds ${maxMapSize}`);
                    }
                    map.set(currentDecoder.decodeKey(key), read());
                  }
                } else {
                  let i2 = 0;
                  while ((key = read()) != STOP_CODE) {
                    if (i2++ >= maxMapSize) {
                      throw new Error(`Map size exceeds ${maxMapSize}`);
                    }
                    map.set(key, read());
                  }
                }
                return map;
              }
            case 7:
              return STOP_CODE;
            default:
              throw new Error("Invalid major type for indefinite length " + majorType);
          }
        default:
          throw new Error("Unknown token " + token);
      }
    }
    switch (majorType) {
      case 0:
        return token;
      case 1:
        return ~token;
      case 2:
        return readBin(token);
      case 3:
        if (srcStringEnd >= position) {
          return srcString.slice(position - srcStringStart, (position += token) - srcStringStart);
        }
        if (srcStringEnd == 0 && srcEnd < 140 && token < 32) {
          let string = token < 16 ? shortStringInJS(token) : longStringInJS(token);
          if (string != null)
            return string;
        }
        return readFixedString(token);
      case 4:
        if (token >= maxArraySize) throw new Error(`Array length exceeds ${maxArraySize}`);
        let array = new Array(token);
        for (let i = 0; i < token; i++) array[i] = read();
        return array;
      case 5:
        if (token >= maxMapSize) throw new Error(`Map size exceeds ${maxArraySize}`);
        if (currentDecoder.mapsAsObjects) {
          let object = {};
          if (currentDecoder.keyMap) for (let i = 0; i < token; i++) object[safeKey(currentDecoder.decodeKey(read()))] = read();
          else for (let i = 0; i < token; i++) object[safeKey(read())] = read();
          return object;
        } else {
          if (restoreMapsAsObject) {
            currentDecoder.mapsAsObjects = true;
            restoreMapsAsObject = false;
          }
          let map = /* @__PURE__ */ new Map();
          if (currentDecoder.keyMap) for (let i = 0; i < token; i++) map.set(currentDecoder.decodeKey(read()), read());
          else for (let i = 0; i < token; i++) map.set(read(), read());
          return map;
        }
      case 6:
        if (token >= BUNDLED_STRINGS_ID) {
          let structure = currentStructures[token & 8191];
          if (structure) {
            if (!structure.read) structure.read = createStructureReader(structure);
            return structure.read();
          }
          if (token < 65536) {
            if (token == RECORD_INLINE_ID) {
              let length = readJustLength();
              let id = read();
              let structure2 = read();
              recordDefinition(id, structure2);
              let object = {};
              if (currentDecoder.keyMap) for (let i = 2; i < length; i++) {
                let key = currentDecoder.decodeKey(structure2[i - 2]);
                object[safeKey(key)] = read();
              }
              else for (let i = 2; i < length; i++) {
                let key = structure2[i - 2];
                object[safeKey(key)] = read();
              }
              return object;
            } else if (token == RECORD_DEFINITIONS_ID) {
              let length = readJustLength();
              let id = read();
              for (let i = 2; i < length; i++) {
                recordDefinition(id++, read());
              }
              return read();
            } else if (token == BUNDLED_STRINGS_ID) {
              return readBundleExt();
            }
            if (currentDecoder.getShared) {
              loadShared();
              structure = currentStructures[token & 8191];
              if (structure) {
                if (!structure.read)
                  structure.read = createStructureReader(structure);
                return structure.read();
              }
            }
          }
        }
        let extension = currentExtensions[token];
        if (extension) {
          if (extension.handlesRead)
            return extension(read);
          else
            return extension(read());
        } else {
          let input = read();
          for (let i = 0; i < currentExtensionRanges.length; i++) {
            let value = currentExtensionRanges[i](token, input);
            if (value !== void 0)
              return value;
          }
          return new Tag(input, token);
        }
      case 7:
        switch (token) {
          case 20:
            return false;
          case 21:
            return true;
          case 22:
            return null;
          case 23:
            return;
          // undefined
          case 31:
          default:
            let packedValue = (packedValues || getPackedValues())[token];
            if (packedValue !== void 0)
              return packedValue;
            throw new Error("Unknown token " + token);
        }
      default:
        if (isNaN(token)) {
          let error = new Error("Unexpected end of CBOR data");
          error.incomplete = true;
          throw error;
        }
        throw new Error("Unknown CBOR token " + token);
    }
  }
  function createStructureReader(structure) {
    if (!structure) throw new Error("Structure is required in record definition");
    function readObject() {
      let length = src[position++];
      length = length & 31;
      if (length > 23) {
        switch (length) {
          case 24:
            length = src[position++];
            break;
          case 25:
            length = dataView.getUint16(position);
            position += 2;
            break;
          case 26:
            length = dataView.getUint32(position);
            position += 4;
            break;
          default:
            throw new Error("Expected array header, but got " + src[position - 1]);
        }
      }
      let compiledReader = this.compiledReader;
      while (compiledReader) {
        if (compiledReader.propertyCount === length)
          return compiledReader(read);
        compiledReader = compiledReader.next;
      }
      if (this.slowReads++ >= inlineObjectReadThreshold) {
        let array = this.length == length ? this : this.slice(0, length);
        compiledReader = currentDecoder.keyMap ? new Function("r", "return {" + array.map((k) => currentDecoder.decodeKey(k)).map((k) => validName.test(k) ? safeKey(k) + ":r()" : "[" + JSON.stringify(k) + "]:r()").join(",") + "}") : new Function("r", "return {" + array.map((key) => validName.test(key) ? safeKey(key) + ":r()" : "[" + JSON.stringify(key) + "]:r()").join(",") + "}");
        if (this.compiledReader)
          compiledReader.next = this.compiledReader;
        compiledReader.propertyCount = length;
        this.compiledReader = compiledReader;
        return compiledReader(read);
      }
      let object = {};
      if (currentDecoder.keyMap) for (let i = 0; i < length; i++) object[safeKey(currentDecoder.decodeKey(this[i]))] = read();
      else for (let i = 0; i < length; i++) {
        object[safeKey(this[i])] = read();
      }
      return object;
    }
    structure.slowReads = 0;
    return readObject;
  }
  function safeKey(key) {
    if (typeof key === "string") return key === "__proto__" ? "__proto_" : key;
    if (typeof key === "number" || typeof key === "boolean" || typeof key === "bigint") return key.toString();
    if (key == null) return key + "";
    throw new Error("Invalid property name type " + typeof key);
  }
  function readStringJS(length) {
    let result;
    if (length < 16) {
      if (result = shortStringInJS(length))
        return result;
    }
    if (length > 64 && decoder)
      return decoder.decode(src.subarray(position, position += length));
    const end = position + length;
    const units = [];
    result = "";
    while (position < end) {
      const byte1 = src[position++];
      if ((byte1 & 128) === 0) {
        units.push(byte1);
      } else if ((byte1 & 224) === 192) {
        const byte2 = src[position++] & 63;
        units.push((byte1 & 31) << 6 | byte2);
      } else if ((byte1 & 240) === 224) {
        const byte2 = src[position++] & 63;
        const byte3 = src[position++] & 63;
        units.push((byte1 & 31) << 12 | byte2 << 6 | byte3);
      } else if ((byte1 & 248) === 240) {
        const byte2 = src[position++] & 63;
        const byte3 = src[position++] & 63;
        const byte4 = src[position++] & 63;
        let unit = (byte1 & 7) << 18 | byte2 << 12 | byte3 << 6 | byte4;
        if (unit > 65535) {
          unit -= 65536;
          units.push(unit >>> 10 & 1023 | 55296);
          unit = 56320 | unit & 1023;
        }
        units.push(unit);
      } else {
        units.push(byte1);
      }
      if (units.length >= 4096) {
        result += fromCharCode.apply(String, units);
        units.length = 0;
      }
    }
    if (units.length > 0) {
      result += fromCharCode.apply(String, units);
    }
    return result;
  }
  function longStringInJS(length) {
    let start = position;
    let bytes = new Array(length);
    for (let i = 0; i < length; i++) {
      const byte = src[position++];
      if ((byte & 128) > 0) {
        position = start;
        return;
      }
      bytes[i] = byte;
    }
    return fromCharCode.apply(String, bytes);
  }
  function shortStringInJS(length) {
    if (length < 4) {
      if (length < 2) {
        if (length === 0)
          return "";
        else {
          let a = src[position++];
          if ((a & 128) > 1) {
            position -= 1;
            return;
          }
          return fromCharCode(a);
        }
      } else {
        let a = src[position++];
        let b = src[position++];
        if ((a & 128) > 0 || (b & 128) > 0) {
          position -= 2;
          return;
        }
        if (length < 3)
          return fromCharCode(a, b);
        let c = src[position++];
        if ((c & 128) > 0) {
          position -= 3;
          return;
        }
        return fromCharCode(a, b, c);
      }
    } else {
      let a = src[position++];
      let b = src[position++];
      let c = src[position++];
      let d = src[position++];
      if ((a & 128) > 0 || (b & 128) > 0 || (c & 128) > 0 || (d & 128) > 0) {
        position -= 4;
        return;
      }
      if (length < 6) {
        if (length === 4)
          return fromCharCode(a, b, c, d);
        else {
          let e = src[position++];
          if ((e & 128) > 0) {
            position -= 5;
            return;
          }
          return fromCharCode(a, b, c, d, e);
        }
      } else if (length < 8) {
        let e = src[position++];
        let f = src[position++];
        if ((e & 128) > 0 || (f & 128) > 0) {
          position -= 6;
          return;
        }
        if (length < 7)
          return fromCharCode(a, b, c, d, e, f);
        let g = src[position++];
        if ((g & 128) > 0) {
          position -= 7;
          return;
        }
        return fromCharCode(a, b, c, d, e, f, g);
      } else {
        let e = src[position++];
        let f = src[position++];
        let g = src[position++];
        let h = src[position++];
        if ((e & 128) > 0 || (f & 128) > 0 || (g & 128) > 0 || (h & 128) > 0) {
          position -= 8;
          return;
        }
        if (length < 10) {
          if (length === 8)
            return fromCharCode(a, b, c, d, e, f, g, h);
          else {
            let i = src[position++];
            if ((i & 128) > 0) {
              position -= 9;
              return;
            }
            return fromCharCode(a, b, c, d, e, f, g, h, i);
          }
        } else if (length < 12) {
          let i = src[position++];
          let j = src[position++];
          if ((i & 128) > 0 || (j & 128) > 0) {
            position -= 10;
            return;
          }
          if (length < 11)
            return fromCharCode(a, b, c, d, e, f, g, h, i, j);
          let k = src[position++];
          if ((k & 128) > 0) {
            position -= 11;
            return;
          }
          return fromCharCode(a, b, c, d, e, f, g, h, i, j, k);
        } else {
          let i = src[position++];
          let j = src[position++];
          let k = src[position++];
          let l = src[position++];
          if ((i & 128) > 0 || (j & 128) > 0 || (k & 128) > 0 || (l & 128) > 0) {
            position -= 12;
            return;
          }
          if (length < 14) {
            if (length === 12)
              return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l);
            else {
              let m = src[position++];
              if ((m & 128) > 0) {
                position -= 13;
                return;
              }
              return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m);
            }
          } else {
            let m = src[position++];
            let n = src[position++];
            if ((m & 128) > 0 || (n & 128) > 0) {
              position -= 14;
              return;
            }
            if (length < 15)
              return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m, n);
            let o = src[position++];
            if ((o & 128) > 0) {
              position -= 15;
              return;
            }
            return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
          }
        }
      }
    }
  }
  function readBin(length) {
    return currentDecoder.copyBuffers ? (
      // specifically use the copying slice (not the node one)
      Uint8Array.prototype.slice.call(src, position, position += length)
    ) : src.subarray(position, position += length);
  }
  function getFloat16() {
    let byte0 = src[position++];
    let byte1 = src[position++];
    let exponent = (byte0 & 127) >> 2;
    if (exponent === 31) {
      if (byte1 || byte0 & 3)
        return NaN;
      return byte0 & 128 ? -Infinity : Infinity;
    }
    if (exponent === 0) {
      let abs = ((byte0 & 3) << 8 | byte1) / (1 << 24);
      return byte0 & 128 ? -abs : abs;
    }
    u8Array[3] = byte0 & 128 | // sign bit
    (exponent >> 1) + 56;
    u8Array[2] = (byte0 & 7) << 5 | // last exponent bit and first two mantissa bits
    byte1 >> 3;
    u8Array[1] = byte1 << 5;
    u8Array[0] = 0;
    return f32Array[0];
  }
  function combine(a, b) {
    if (typeof a === "string")
      return a + b;
    if (a instanceof Array)
      return a.concat(b);
    return Object.assign({}, a, b);
  }
  function getPackedValues() {
    if (!packedValues) {
      if (currentDecoder.getShared)
        loadShared();
      else
        throw new Error("No packed values available");
    }
    return packedValues;
  }
  function registerTypedArray(TypedArray, tag) {
    let dvMethod = "get" + TypedArray.name.slice(0, -5);
    let bytesPerElement;
    if (typeof TypedArray === "function")
      bytesPerElement = TypedArray.BYTES_PER_ELEMENT;
    else
      TypedArray = null;
    for (let littleEndian = 0; littleEndian < 2; littleEndian++) {
      if (!littleEndian && bytesPerElement == 1)
        continue;
      let sizeShift = bytesPerElement == 2 ? 1 : bytesPerElement == 4 ? 2 : bytesPerElement == 8 ? 3 : 0;
      currentExtensions[littleEndian ? tag : tag - 4] = bytesPerElement == 1 || littleEndian == isLittleEndianMachine ? (buffer) => {
        if (!TypedArray)
          throw new Error("Could not find typed array for code " + tag);
        if (!currentDecoder.copyBuffers) {
          if (bytesPerElement === 1 || bytesPerElement === 2 && !(buffer.byteOffset & 1) || bytesPerElement === 4 && !(buffer.byteOffset & 3) || bytesPerElement === 8 && !(buffer.byteOffset & 7))
            return new TypedArray(buffer.buffer, buffer.byteOffset, buffer.byteLength >> sizeShift);
        }
        return new TypedArray(Uint8Array.prototype.slice.call(buffer, 0).buffer);
      } : (buffer) => {
        if (!TypedArray)
          throw new Error("Could not find typed array for code " + tag);
        let dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        let elements = buffer.length >> sizeShift;
        let ta = new TypedArray(elements);
        let method = dv[dvMethod];
        for (let i = 0; i < elements; i++) {
          ta[i] = method.call(dv, i << sizeShift, littleEndian);
        }
        return ta;
      };
    }
  }
  function readBundleExt() {
    let length = readJustLength();
    let bundlePosition = position + read();
    for (let i = 2; i < length; i++) {
      let bundleLength = readJustLength();
      position += bundleLength;
    }
    let dataPosition = position;
    position = bundlePosition;
    bundledStrings = [readStringJS(readJustLength()), readStringJS(readJustLength())];
    bundledStrings.position0 = 0;
    bundledStrings.position1 = 0;
    bundledStrings.postBundlePosition = position;
    position = dataPosition;
    return read();
  }
  function readJustLength() {
    let token = src[position++] & 31;
    if (token > 23) {
      switch (token) {
        case 24:
          token = src[position++];
          break;
        case 25:
          token = dataView.getUint16(position);
          position += 2;
          break;
        case 26:
          token = dataView.getUint32(position);
          position += 4;
          break;
      }
    }
    return token;
  }
  function loadShared() {
    if (currentDecoder.getShared) {
      let sharedData = saveState(() => {
        src = null;
        return currentDecoder.getShared();
      }) || {};
      let updatedStructures = sharedData.structures || [];
      currentDecoder.sharedVersion = sharedData.version;
      packedValues = currentDecoder.sharedValues = sharedData.packedValues;
      if (currentStructures === true)
        currentDecoder.structures = currentStructures = updatedStructures;
      else
        currentStructures.splice.apply(currentStructures, [0, updatedStructures.length].concat(updatedStructures));
    }
  }
  function saveState(callback) {
    let savedSrcEnd = srcEnd;
    let savedPosition = position;
    let savedStringPosition = stringPosition;
    let savedSrcStringStart = srcStringStart;
    let savedSrcStringEnd = srcStringEnd;
    let savedSrcString = srcString;
    let savedStrings = strings;
    let savedReferenceMap = referenceMap;
    let savedBundledStrings = bundledStrings;
    let savedSrc = new Uint8Array(src.slice(0, srcEnd));
    let savedStructures = currentStructures;
    let savedDecoder = currentDecoder;
    let savedSequentialMode = sequentialMode;
    let value = callback();
    srcEnd = savedSrcEnd;
    position = savedPosition;
    stringPosition = savedStringPosition;
    srcStringStart = savedSrcStringStart;
    srcStringEnd = savedSrcStringEnd;
    srcString = savedSrcString;
    strings = savedStrings;
    referenceMap = savedReferenceMap;
    bundledStrings = savedBundledStrings;
    src = savedSrc;
    sequentialMode = savedSequentialMode;
    currentStructures = savedStructures;
    currentDecoder = savedDecoder;
    dataView = new DataView(src.buffer, src.byteOffset, src.byteLength);
    return value;
  }
  function clearSource() {
    src = null;
    referenceMap = null;
    currentStructures = null;
  }
  function addExtension(extension) {
    currentExtensions[extension.tag] = extension.decode;
  }
  function setSizeLimits(limits) {
    if (limits.maxMapSize) maxMapSize = limits.maxMapSize;
    if (limits.maxArraySize) maxArraySize = limits.maxArraySize;
    if (limits.maxObjectSize) maxObjectSize = limits.maxObjectSize;
  }
  function roundFloat32(float32Number) {
    f32Array[0] = float32Number;
    let multiplier = mult10[(u8Array[3] & 127) << 1 | u8Array[2] >> 7];
    return (multiplier * float32Number + (float32Number > 0 ? 0.5 : -0.5) >> 0) / multiplier;
  }
  var decoder, src, srcEnd, position, EMPTY_ARRAY, LEGACY_RECORD_INLINE_ID, RECORD_DEFINITIONS_ID, RECORD_INLINE_ID, BUNDLED_STRINGS_ID, PACKED_REFERENCE_TAG_ID, STOP_CODE, maxArraySize, maxMapSize, maxObjectSize, strings, stringPosition, currentDecoder, currentStructures, srcString, srcStringStart, srcStringEnd, bundledStrings, referenceMap, currentExtensions, currentExtensionRanges, packedValues, dataView, restoreMapsAsObject, defaultOptions, sequentialMode, inlineObjectReadThreshold, Decoder, validName, readFixedString, isNativeAccelerationEnabled, fromCharCode, f32Array, u8Array, keyCache, Tag, recordDefinition, glbl, packedTable, SHARED_DATA_TAG_ID, isLittleEndianMachine, typedArrays, typedArrayTags, mult10, defaultDecoder, decode, decodeMultiple, FLOAT32_OPTIONS;
  var init_decode = __esm({
    "node_modules/.pnpm/cbor-x@1.6.0/node_modules/cbor-x/decode.js"() {
      try {
        decoder = new TextDecoder();
      } catch (error) {
      }
      position = 0;
      EMPTY_ARRAY = [];
      LEGACY_RECORD_INLINE_ID = 105;
      RECORD_DEFINITIONS_ID = 57342;
      RECORD_INLINE_ID = 57343;
      BUNDLED_STRINGS_ID = 57337;
      PACKED_REFERENCE_TAG_ID = 6;
      STOP_CODE = {};
      maxArraySize = 11281e4;
      maxMapSize = 1681e4;
      maxObjectSize = 1671e4;
      strings = EMPTY_ARRAY;
      stringPosition = 0;
      currentDecoder = {};
      srcStringStart = 0;
      srcStringEnd = 0;
      currentExtensions = [];
      currentExtensionRanges = [];
      defaultOptions = {
        useRecords: false,
        mapsAsObjects: true
      };
      sequentialMode = false;
      inlineObjectReadThreshold = 2;
      try {
        new Function("");
      } catch (error) {
        inlineObjectReadThreshold = Infinity;
      }
      Decoder = class _Decoder {
        constructor(options) {
          if (options) {
            if ((options.keyMap || options._keyMap) && !options.useRecords) {
              options.useRecords = false;
              options.mapsAsObjects = true;
            }
            if (options.useRecords === false && options.mapsAsObjects === void 0)
              options.mapsAsObjects = true;
            if (options.getStructures)
              options.getShared = options.getStructures;
            if (options.getShared && !options.structures)
              (options.structures = []).uninitialized = true;
            if (options.keyMap) {
              this.mapKey = /* @__PURE__ */ new Map();
              for (let [k, v] of Object.entries(options.keyMap)) this.mapKey.set(v, k);
            }
          }
          Object.assign(this, options);
        }
        /*
        decodeKey(key) {
        	return this.keyMap
        		? Object.keys(this.keyMap)[Object.values(this.keyMap).indexOf(key)] || key
        		: key
        }
        */
        decodeKey(key) {
          return this.keyMap ? this.mapKey.get(key) || key : key;
        }
        encodeKey(key) {
          return this.keyMap && this.keyMap.hasOwnProperty(key) ? this.keyMap[key] : key;
        }
        encodeKeys(rec) {
          if (!this._keyMap) return rec;
          let map = /* @__PURE__ */ new Map();
          for (let [k, v] of Object.entries(rec)) map.set(this._keyMap.hasOwnProperty(k) ? this._keyMap[k] : k, v);
          return map;
        }
        decodeKeys(map) {
          if (!this._keyMap || map.constructor.name != "Map") return map;
          if (!this._mapKey) {
            this._mapKey = /* @__PURE__ */ new Map();
            for (let [k, v] of Object.entries(this._keyMap)) this._mapKey.set(v, k);
          }
          let res = {};
          map.forEach((v, k) => res[safeKey(this._mapKey.has(k) ? this._mapKey.get(k) : k)] = v);
          return res;
        }
        mapDecode(source, end) {
          let res = this.decode(source);
          if (this._keyMap) {
            switch (res.constructor.name) {
              case "Array":
                return res.map((r) => this.decodeKeys(r));
            }
          }
          return res;
        }
        decode(source, end) {
          if (src) {
            return saveState(() => {
              clearSource();
              return this ? this.decode(source, end) : _Decoder.prototype.decode.call(defaultOptions, source, end);
            });
          }
          srcEnd = end > -1 ? end : source.length;
          position = 0;
          stringPosition = 0;
          srcStringEnd = 0;
          srcString = null;
          strings = EMPTY_ARRAY;
          bundledStrings = null;
          src = source;
          try {
            dataView = source.dataView || (source.dataView = new DataView(source.buffer, source.byteOffset, source.byteLength));
          } catch (error) {
            src = null;
            if (source instanceof Uint8Array)
              throw error;
            throw new Error("Source must be a Uint8Array or Buffer but was a " + (source && typeof source == "object" ? source.constructor.name : typeof source));
          }
          if (this instanceof _Decoder) {
            currentDecoder = this;
            packedValues = this.sharedValues && (this.pack ? new Array(this.maxPrivatePackedValues || 16).concat(this.sharedValues) : this.sharedValues);
            if (this.structures) {
              currentStructures = this.structures;
              return checkedRead();
            } else if (!currentStructures || currentStructures.length > 0) {
              currentStructures = [];
            }
          } else {
            currentDecoder = defaultOptions;
            if (!currentStructures || currentStructures.length > 0)
              currentStructures = [];
            packedValues = null;
          }
          return checkedRead();
        }
        decodeMultiple(source, forEach) {
          let values, lastPosition = 0;
          try {
            let size = source.length;
            sequentialMode = true;
            let value = this ? this.decode(source, size) : defaultDecoder.decode(source, size);
            if (forEach) {
              if (forEach(value) === false) {
                return;
              }
              while (position < size) {
                lastPosition = position;
                if (forEach(checkedRead()) === false) {
                  return;
                }
              }
            } else {
              values = [value];
              while (position < size) {
                lastPosition = position;
                values.push(checkedRead());
              }
              return values;
            }
          } catch (error) {
            error.lastPosition = lastPosition;
            error.values = values;
            throw error;
          } finally {
            sequentialMode = false;
            clearSource();
          }
        }
      };
      validName = /^[a-zA-Z_$][a-zA-Z\d_$]*$/;
      readFixedString = readStringJS;
      isNativeAccelerationEnabled = false;
      fromCharCode = String.fromCharCode;
      f32Array = new Float32Array(1);
      u8Array = new Uint8Array(f32Array.buffer, 0, 4);
      keyCache = new Array(4096);
      Tag = class {
        constructor(value, tag) {
          this.value = value;
          this.tag = tag;
        }
      };
      currentExtensions[0] = (dateString) => {
        return new Date(dateString);
      };
      currentExtensions[1] = (epochSec) => {
        return new Date(Math.round(epochSec * 1e3));
      };
      currentExtensions[2] = (buffer) => {
        let value = BigInt(0);
        for (let i = 0, l = buffer.byteLength; i < l; i++) {
          value = BigInt(buffer[i]) + (value << BigInt(8));
        }
        return value;
      };
      currentExtensions[3] = (buffer) => {
        return BigInt(-1) - currentExtensions[2](buffer);
      };
      currentExtensions[4] = (fraction) => {
        return +(fraction[1] + "e" + fraction[0]);
      };
      currentExtensions[5] = (fraction) => {
        return fraction[1] * Math.exp(fraction[0] * Math.log(2));
      };
      recordDefinition = (id, structure) => {
        id = id - 57344;
        let existingStructure = currentStructures[id];
        if (existingStructure && existingStructure.isShared) {
          (currentStructures.restoreStructures || (currentStructures.restoreStructures = []))[id] = existingStructure;
        }
        currentStructures[id] = structure;
        structure.read = createStructureReader(structure);
      };
      currentExtensions[LEGACY_RECORD_INLINE_ID] = (data) => {
        let length = data.length;
        let structure = data[1];
        recordDefinition(data[0], structure);
        let object = {};
        for (let i = 2; i < length; i++) {
          let key = structure[i - 2];
          object[safeKey(key)] = data[i];
        }
        return object;
      };
      currentExtensions[14] = (value) => {
        if (bundledStrings)
          return bundledStrings[0].slice(bundledStrings.position0, bundledStrings.position0 += value);
        return new Tag(value, 14);
      };
      currentExtensions[15] = (value) => {
        if (bundledStrings)
          return bundledStrings[1].slice(bundledStrings.position1, bundledStrings.position1 += value);
        return new Tag(value, 15);
      };
      glbl = { Error, RegExp };
      currentExtensions[27] = (data) => {
        return (glbl[data[0]] || Error)(data[1], data[2]);
      };
      packedTable = (read2) => {
        if (src[position++] != 132) {
          let error = new Error("Packed values structure must be followed by a 4 element array");
          if (src.length < position)
            error.incomplete = true;
          throw error;
        }
        let newPackedValues = read2();
        if (!newPackedValues || !newPackedValues.length) {
          let error = new Error("Packed values structure must be followed by a 4 element array");
          error.incomplete = true;
          throw error;
        }
        packedValues = packedValues ? newPackedValues.concat(packedValues.slice(newPackedValues.length)) : newPackedValues;
        packedValues.prefixes = read2();
        packedValues.suffixes = read2();
        return read2();
      };
      packedTable.handlesRead = true;
      currentExtensions[51] = packedTable;
      currentExtensions[PACKED_REFERENCE_TAG_ID] = (data) => {
        if (!packedValues) {
          if (currentDecoder.getShared)
            loadShared();
          else
            return new Tag(data, PACKED_REFERENCE_TAG_ID);
        }
        if (typeof data == "number")
          return packedValues[16 + (data >= 0 ? 2 * data : -2 * data - 1)];
        let error = new Error("No support for non-integer packed references yet");
        if (data === void 0)
          error.incomplete = true;
        throw error;
      };
      currentExtensions[28] = (read2) => {
        if (!referenceMap) {
          referenceMap = /* @__PURE__ */ new Map();
          referenceMap.id = 0;
        }
        let id = referenceMap.id++;
        let startingPosition = position;
        let token = src[position];
        let target2;
        if (token >> 5 == 4)
          target2 = [];
        else
          target2 = {};
        let refEntry = { target: target2 };
        referenceMap.set(id, refEntry);
        let targetProperties = read2();
        if (refEntry.used) {
          if (Object.getPrototypeOf(target2) !== Object.getPrototypeOf(targetProperties)) {
            position = startingPosition;
            target2 = targetProperties;
            referenceMap.set(id, { target: target2 });
            targetProperties = read2();
          }
          return Object.assign(target2, targetProperties);
        }
        refEntry.target = targetProperties;
        return targetProperties;
      };
      currentExtensions[28].handlesRead = true;
      currentExtensions[29] = (id) => {
        let refEntry = referenceMap.get(id);
        refEntry.used = true;
        return refEntry.target;
      };
      currentExtensions[258] = (array) => new Set(array);
      (currentExtensions[259] = (read2) => {
        if (currentDecoder.mapsAsObjects) {
          currentDecoder.mapsAsObjects = false;
          restoreMapsAsObject = true;
        }
        return read2();
      }).handlesRead = true;
      SHARED_DATA_TAG_ID = 1399353956;
      currentExtensionRanges.push((tag, input) => {
        if (tag >= 225 && tag <= 255)
          return combine(getPackedValues().prefixes[tag - 224], input);
        if (tag >= 28704 && tag <= 32767)
          return combine(getPackedValues().prefixes[tag - 28672], input);
        if (tag >= 1879052288 && tag <= 2147483647)
          return combine(getPackedValues().prefixes[tag - 1879048192], input);
        if (tag >= 216 && tag <= 223)
          return combine(input, getPackedValues().suffixes[tag - 216]);
        if (tag >= 27647 && tag <= 28671)
          return combine(input, getPackedValues().suffixes[tag - 27639]);
        if (tag >= 1811940352 && tag <= 1879048191)
          return combine(input, getPackedValues().suffixes[tag - 1811939328]);
        if (tag == SHARED_DATA_TAG_ID) {
          return {
            packedValues,
            structures: currentStructures.slice(0),
            version: input
          };
        }
        if (tag == 55799)
          return input;
      });
      isLittleEndianMachine = new Uint8Array(new Uint16Array([1]).buffer)[0] == 1;
      typedArrays = [
        Uint8Array,
        Uint8ClampedArray,
        Uint16Array,
        Uint32Array,
        typeof BigUint64Array == "undefined" ? { name: "BigUint64Array" } : BigUint64Array,
        Int8Array,
        Int16Array,
        Int32Array,
        typeof BigInt64Array == "undefined" ? { name: "BigInt64Array" } : BigInt64Array,
        Float32Array,
        Float64Array
      ];
      typedArrayTags = [64, 68, 69, 70, 71, 72, 77, 78, 79, 85, 86];
      for (let i = 0; i < typedArrays.length; i++) {
        registerTypedArray(typedArrays[i], typedArrayTags[i]);
      }
      mult10 = new Array(147);
      for (let i = 0; i < 256; i++) {
        mult10[i] = +("1e" + Math.floor(45.15 - i * 0.30103));
      }
      defaultDecoder = new Decoder({ useRecords: false });
      decode = defaultDecoder.decode;
      decodeMultiple = defaultDecoder.decodeMultiple;
      FLOAT32_OPTIONS = {
        NEVER: 0,
        ALWAYS: 1,
        DECIMAL_ROUND: 3,
        DECIMAL_FIT: 4
      };
    }
  });

  // node_modules/.pnpm/cbor-x@1.6.0/node_modules/cbor-x/encode.js
  function writeEntityLength(length, majorValue) {
    if (length < 24)
      target[position2++] = majorValue | length;
    else if (length < 256) {
      target[position2++] = majorValue | 24;
      target[position2++] = length;
    } else if (length < 65536) {
      target[position2++] = majorValue | 25;
      target[position2++] = length >> 8;
      target[position2++] = length & 255;
    } else {
      target[position2++] = majorValue | 26;
      targetView.setUint32(position2, length);
      position2 += 4;
    }
  }
  function writeArrayHeader(length) {
    if (length < 24)
      target[position2++] = 128 | length;
    else if (length < 256) {
      target[position2++] = 152;
      target[position2++] = length;
    } else if (length < 65536) {
      target[position2++] = 153;
      target[position2++] = length >> 8;
      target[position2++] = length & 255;
    } else {
      target[position2++] = 154;
      targetView.setUint32(position2, length);
      position2 += 4;
    }
  }
  function isBlob(object) {
    if (object instanceof BlobConstructor)
      return true;
    let tag = object[Symbol.toStringTag];
    return tag === "Blob" || tag === "File";
  }
  function findRepetitiveStrings(value, packedValues2) {
    switch (typeof value) {
      case "string":
        if (value.length > 3) {
          if (packedValues2.objectMap[value] > -1 || packedValues2.values.length >= packedValues2.maxValues)
            return;
          let packedStatus = packedValues2.get(value);
          if (packedStatus) {
            if (++packedStatus.count == 2) {
              packedValues2.values.push(value);
            }
          } else {
            packedValues2.set(value, {
              count: 1
            });
            if (packedValues2.samplingPackedValues) {
              let status = packedValues2.samplingPackedValues.get(value);
              if (status)
                status.count++;
              else
                packedValues2.samplingPackedValues.set(value, {
                  count: 1
                });
            }
          }
        }
        break;
      case "object":
        if (value) {
          if (value instanceof Array) {
            for (let i = 0, l = value.length; i < l; i++) {
              findRepetitiveStrings(value[i], packedValues2);
            }
          } else {
            let includeKeys = !packedValues2.encoder.useRecords;
            for (var key in value) {
              if (value.hasOwnProperty(key)) {
                if (includeKeys)
                  findRepetitiveStrings(key, packedValues2);
                findRepetitiveStrings(value[key], packedValues2);
              }
            }
          }
        }
        break;
      case "function":
        console.log(value);
    }
  }
  function typedArrayEncoder(tag, size) {
    if (!isLittleEndianMachine2 && size > 1)
      tag -= 4;
    return {
      tag,
      encode: function writeExtBuffer(typedArray, encode2) {
        let length = typedArray.byteLength;
        let offset = typedArray.byteOffset || 0;
        let buffer = typedArray.buffer || typedArray;
        encode2(hasNodeBuffer ? Buffer2.from(buffer, offset, length) : new Uint8Array(buffer, offset, length));
      }
    };
  }
  function writeBuffer(buffer, makeRoom) {
    let length = buffer.byteLength;
    if (length < 24) {
      target[position2++] = 64 + length;
    } else if (length < 256) {
      target[position2++] = 88;
      target[position2++] = length;
    } else if (length < 65536) {
      target[position2++] = 89;
      target[position2++] = length >> 8;
      target[position2++] = length & 255;
    } else {
      target[position2++] = 90;
      targetView.setUint32(position2, length);
      position2 += 4;
    }
    if (position2 + length >= target.length) {
      makeRoom(position2 + length);
    }
    target.set(buffer.buffer ? buffer : new Uint8Array(buffer), position2);
    position2 += length;
  }
  function insertIds(serialized, idsToInsert) {
    let nextId;
    let distanceToMove = idsToInsert.length * 2;
    let lastEnd = serialized.length - distanceToMove;
    idsToInsert.sort((a, b) => a.offset > b.offset ? 1 : -1);
    for (let id = 0; id < idsToInsert.length; id++) {
      let referee = idsToInsert[id];
      referee.id = id;
      for (let position3 of referee.references) {
        serialized[position3++] = id >> 8;
        serialized[position3] = id & 255;
      }
    }
    while (nextId = idsToInsert.pop()) {
      let offset = nextId.offset;
      serialized.copyWithin(offset + distanceToMove, offset, lastEnd);
      distanceToMove -= 2;
      let position3 = offset + distanceToMove;
      serialized[position3++] = 216;
      serialized[position3++] = 28;
      lastEnd = offset;
    }
    return serialized;
  }
  function writeBundles(start, encode2) {
    targetView.setUint32(bundledStrings2.position + start, position2 - bundledStrings2.position - start + 1);
    let writeStrings = bundledStrings2;
    bundledStrings2 = null;
    encode2(writeStrings[0]);
    encode2(writeStrings[1]);
  }
  function addExtension2(extension) {
    if (extension.Class) {
      if (!extension.encode)
        throw new Error("Extension has no encode function");
      extensionClasses.unshift(extension.Class);
      extensions.unshift(extension);
    }
    addExtension(extension);
  }
  var textEncoder, extensions, extensionClasses, Buffer2, hasNodeBuffer, ByteArrayAllocate, ByteArray, MAX_STRUCTURES, MAX_BUFFER_SIZE, throwOnIterable, target, targetView, position2, safeEnd, bundledStrings2, MAX_BUNDLE_SIZE, hasNonLatin, RECORD_SYMBOL, Encoder, SharedData, BlobConstructor, isLittleEndianMachine2, defaultEncoder, encode, encodeAsIterable, encodeAsAsyncIterable, NEVER, ALWAYS, DECIMAL_ROUND, DECIMAL_FIT, REUSE_BUFFER_MODE, RESET_BUFFER_MODE, THROW_ON_ITERABLE;
  var init_encode = __esm({
    "node_modules/.pnpm/cbor-x@1.6.0/node_modules/cbor-x/encode.js"() {
      init_decode();
      init_decode();
      init_decode();
      try {
        textEncoder = new TextEncoder();
      } catch (error) {
      }
      Buffer2 = typeof globalThis === "object" && globalThis.Buffer;
      hasNodeBuffer = typeof Buffer2 !== "undefined";
      ByteArrayAllocate = hasNodeBuffer ? Buffer2.allocUnsafeSlow : Uint8Array;
      ByteArray = hasNodeBuffer ? Buffer2 : Uint8Array;
      MAX_STRUCTURES = 256;
      MAX_BUFFER_SIZE = hasNodeBuffer ? 4294967296 : 2144337920;
      position2 = 0;
      bundledStrings2 = null;
      MAX_BUNDLE_SIZE = 61440;
      hasNonLatin = /[\u0080-\uFFFF]/;
      RECORD_SYMBOL = Symbol("record-id");
      Encoder = class extends Decoder {
        constructor(options) {
          super(options);
          this.offset = 0;
          let typeBuffer;
          let start;
          let sharedStructures;
          let hasSharedUpdate;
          let structures;
          let referenceMap2;
          options = options || {};
          let encodeUtf8 = ByteArray.prototype.utf8Write ? function(string, position3, maxBytes) {
            return target.utf8Write(string, position3, maxBytes);
          } : textEncoder && textEncoder.encodeInto ? function(string, position3) {
            return textEncoder.encodeInto(string, target.subarray(position3)).written;
          } : false;
          let encoder = this;
          let hasSharedStructures = options.structures || options.saveStructures;
          let maxSharedStructures = options.maxSharedStructures;
          if (maxSharedStructures == null)
            maxSharedStructures = hasSharedStructures ? 128 : 0;
          if (maxSharedStructures > 8190)
            throw new Error("Maximum maxSharedStructure is 8190");
          let isSequential = options.sequential;
          if (isSequential) {
            maxSharedStructures = 0;
          }
          if (!this.structures)
            this.structures = [];
          if (this.saveStructures)
            this.saveShared = this.saveStructures;
          let samplingPackedValues, packedObjectMap2, sharedValues = options.sharedValues;
          let sharedPackedObjectMap2;
          if (sharedValues) {
            sharedPackedObjectMap2 = /* @__PURE__ */ Object.create(null);
            for (let i = 0, l = sharedValues.length; i < l; i++) {
              sharedPackedObjectMap2[sharedValues[i]] = i;
            }
          }
          let recordIdsToRemove = [];
          let transitionsCount = 0;
          let serializationsSinceTransitionRebuild = 0;
          this.mapEncode = function(value, encodeOptions) {
            if (this._keyMap && !this._mapped) {
              switch (value.constructor.name) {
                case "Array":
                  value = value.map((r) => this.encodeKeys(r));
                  break;
              }
            }
            return this.encode(value, encodeOptions);
          };
          this.encode = function(value, encodeOptions) {
            if (!target) {
              target = new ByteArrayAllocate(8192);
              targetView = new DataView(target.buffer, 0, 8192);
              position2 = 0;
            }
            safeEnd = target.length - 10;
            if (safeEnd - position2 < 2048) {
              target = new ByteArrayAllocate(target.length);
              targetView = new DataView(target.buffer, 0, target.length);
              safeEnd = target.length - 10;
              position2 = 0;
            } else if (encodeOptions === REUSE_BUFFER_MODE)
              position2 = position2 + 7 & 2147483640;
            start = position2;
            if (encoder.useSelfDescribedHeader) {
              targetView.setUint32(position2, 3654940416);
              position2 += 3;
            }
            referenceMap2 = encoder.structuredClone ? /* @__PURE__ */ new Map() : null;
            if (encoder.bundleStrings && typeof value !== "string") {
              bundledStrings2 = [];
              bundledStrings2.size = Infinity;
            } else
              bundledStrings2 = null;
            sharedStructures = encoder.structures;
            if (sharedStructures) {
              if (sharedStructures.uninitialized) {
                let sharedData = encoder.getShared() || {};
                encoder.structures = sharedStructures = sharedData.structures || [];
                encoder.sharedVersion = sharedData.version;
                let sharedValues2 = encoder.sharedValues = sharedData.packedValues;
                if (sharedValues2) {
                  sharedPackedObjectMap2 = {};
                  for (let i = 0, l = sharedValues2.length; i < l; i++)
                    sharedPackedObjectMap2[sharedValues2[i]] = i;
                }
              }
              let sharedStructuresLength = sharedStructures.length;
              if (sharedStructuresLength > maxSharedStructures && !isSequential)
                sharedStructuresLength = maxSharedStructures;
              if (!sharedStructures.transitions) {
                sharedStructures.transitions = /* @__PURE__ */ Object.create(null);
                for (let i = 0; i < sharedStructuresLength; i++) {
                  let keys = sharedStructures[i];
                  if (!keys)
                    continue;
                  let nextTransition, transition = sharedStructures.transitions;
                  for (let j = 0, l = keys.length; j < l; j++) {
                    if (transition[RECORD_SYMBOL] === void 0)
                      transition[RECORD_SYMBOL] = i;
                    let key = keys[j];
                    nextTransition = transition[key];
                    if (!nextTransition) {
                      nextTransition = transition[key] = /* @__PURE__ */ Object.create(null);
                    }
                    transition = nextTransition;
                  }
                  transition[RECORD_SYMBOL] = i | 1048576;
                }
              }
              if (!isSequential)
                sharedStructures.nextId = sharedStructuresLength;
            }
            if (hasSharedUpdate)
              hasSharedUpdate = false;
            structures = sharedStructures || [];
            packedObjectMap2 = sharedPackedObjectMap2;
            if (options.pack) {
              let packedValues2 = /* @__PURE__ */ new Map();
              packedValues2.values = [];
              packedValues2.encoder = encoder;
              packedValues2.maxValues = options.maxPrivatePackedValues || (sharedPackedObjectMap2 ? 16 : Infinity);
              packedValues2.objectMap = sharedPackedObjectMap2 || false;
              packedValues2.samplingPackedValues = samplingPackedValues;
              findRepetitiveStrings(value, packedValues2);
              if (packedValues2.values.length > 0) {
                target[position2++] = 216;
                target[position2++] = 51;
                writeArrayHeader(4);
                let valuesArray = packedValues2.values;
                encode2(valuesArray);
                writeArrayHeader(0);
                writeArrayHeader(0);
                packedObjectMap2 = Object.create(sharedPackedObjectMap2 || null);
                for (let i = 0, l = valuesArray.length; i < l; i++) {
                  packedObjectMap2[valuesArray[i]] = i;
                }
              }
            }
            throwOnIterable = encodeOptions & THROW_ON_ITERABLE;
            try {
              if (throwOnIterable)
                return;
              encode2(value);
              if (bundledStrings2) {
                writeBundles(start, encode2);
              }
              encoder.offset = position2;
              if (referenceMap2 && referenceMap2.idsToInsert) {
                position2 += referenceMap2.idsToInsert.length * 2;
                if (position2 > safeEnd)
                  makeRoom(position2);
                encoder.offset = position2;
                let serialized = insertIds(target.subarray(start, position2), referenceMap2.idsToInsert);
                referenceMap2 = null;
                return serialized;
              }
              if (encodeOptions & REUSE_BUFFER_MODE) {
                target.start = start;
                target.end = position2;
                return target;
              }
              return target.subarray(start, position2);
            } finally {
              if (sharedStructures) {
                if (serializationsSinceTransitionRebuild < 10)
                  serializationsSinceTransitionRebuild++;
                if (sharedStructures.length > maxSharedStructures)
                  sharedStructures.length = maxSharedStructures;
                if (transitionsCount > 1e4) {
                  sharedStructures.transitions = null;
                  serializationsSinceTransitionRebuild = 0;
                  transitionsCount = 0;
                  if (recordIdsToRemove.length > 0)
                    recordIdsToRemove = [];
                } else if (recordIdsToRemove.length > 0 && !isSequential) {
                  for (let i = 0, l = recordIdsToRemove.length; i < l; i++) {
                    recordIdsToRemove[i][RECORD_SYMBOL] = void 0;
                  }
                  recordIdsToRemove = [];
                }
              }
              if (hasSharedUpdate && encoder.saveShared) {
                if (encoder.structures.length > maxSharedStructures) {
                  encoder.structures = encoder.structures.slice(0, maxSharedStructures);
                }
                let returnBuffer = target.subarray(start, position2);
                if (encoder.updateSharedData() === false)
                  return encoder.encode(value);
                return returnBuffer;
              }
              if (encodeOptions & RESET_BUFFER_MODE)
                position2 = start;
            }
          };
          this.findCommonStringsToPack = () => {
            samplingPackedValues = /* @__PURE__ */ new Map();
            if (!sharedPackedObjectMap2)
              sharedPackedObjectMap2 = /* @__PURE__ */ Object.create(null);
            return (options2) => {
              let threshold = options2 && options2.threshold || 4;
              let position3 = this.pack ? options2.maxPrivatePackedValues || 16 : 0;
              if (!sharedValues)
                sharedValues = this.sharedValues = [];
              for (let [key, status] of samplingPackedValues) {
                if (status.count > threshold) {
                  sharedPackedObjectMap2[key] = position3++;
                  sharedValues.push(key);
                  hasSharedUpdate = true;
                }
              }
              while (this.saveShared && this.updateSharedData() === false) {
              }
              samplingPackedValues = null;
            };
          };
          const encode2 = (value) => {
            if (position2 > safeEnd)
              target = makeRoom(position2);
            var type = typeof value;
            var length;
            if (type === "string") {
              if (packedObjectMap2) {
                let packedPosition = packedObjectMap2[value];
                if (packedPosition >= 0) {
                  if (packedPosition < 16)
                    target[position2++] = packedPosition + 224;
                  else {
                    target[position2++] = 198;
                    if (packedPosition & 1)
                      encode2(15 - packedPosition >> 1);
                    else
                      encode2(packedPosition - 16 >> 1);
                  }
                  return;
                } else if (samplingPackedValues && !options.pack) {
                  let status = samplingPackedValues.get(value);
                  if (status)
                    status.count++;
                  else
                    samplingPackedValues.set(value, {
                      count: 1
                    });
                }
              }
              let strLength = value.length;
              if (bundledStrings2 && strLength >= 4 && strLength < 1024) {
                if ((bundledStrings2.size += strLength) > MAX_BUNDLE_SIZE) {
                  let extStart;
                  let maxBytes2 = (bundledStrings2[0] ? bundledStrings2[0].length * 3 + bundledStrings2[1].length : 0) + 10;
                  if (position2 + maxBytes2 > safeEnd)
                    target = makeRoom(position2 + maxBytes2);
                  target[position2++] = 217;
                  target[position2++] = 223;
                  target[position2++] = 249;
                  target[position2++] = bundledStrings2.position ? 132 : 130;
                  target[position2++] = 26;
                  extStart = position2 - start;
                  position2 += 4;
                  if (bundledStrings2.position) {
                    writeBundles(start, encode2);
                  }
                  bundledStrings2 = ["", ""];
                  bundledStrings2.size = 0;
                  bundledStrings2.position = extStart;
                }
                let twoByte = hasNonLatin.test(value);
                bundledStrings2[twoByte ? 0 : 1] += value;
                target[position2++] = twoByte ? 206 : 207;
                encode2(strLength);
                return;
              }
              let headerSize;
              if (strLength < 32) {
                headerSize = 1;
              } else if (strLength < 256) {
                headerSize = 2;
              } else if (strLength < 65536) {
                headerSize = 3;
              } else {
                headerSize = 5;
              }
              let maxBytes = strLength * 3;
              if (position2 + maxBytes > safeEnd)
                target = makeRoom(position2 + maxBytes);
              if (strLength < 64 || !encodeUtf8) {
                let i, c1, c2, strPosition = position2 + headerSize;
                for (i = 0; i < strLength; i++) {
                  c1 = value.charCodeAt(i);
                  if (c1 < 128) {
                    target[strPosition++] = c1;
                  } else if (c1 < 2048) {
                    target[strPosition++] = c1 >> 6 | 192;
                    target[strPosition++] = c1 & 63 | 128;
                  } else if ((c1 & 64512) === 55296 && ((c2 = value.charCodeAt(i + 1)) & 64512) === 56320) {
                    c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
                    i++;
                    target[strPosition++] = c1 >> 18 | 240;
                    target[strPosition++] = c1 >> 12 & 63 | 128;
                    target[strPosition++] = c1 >> 6 & 63 | 128;
                    target[strPosition++] = c1 & 63 | 128;
                  } else {
                    target[strPosition++] = c1 >> 12 | 224;
                    target[strPosition++] = c1 >> 6 & 63 | 128;
                    target[strPosition++] = c1 & 63 | 128;
                  }
                }
                length = strPosition - position2 - headerSize;
              } else {
                length = encodeUtf8(value, position2 + headerSize, maxBytes);
              }
              if (length < 24) {
                target[position2++] = 96 | length;
              } else if (length < 256) {
                if (headerSize < 2) {
                  target.copyWithin(position2 + 2, position2 + 1, position2 + 1 + length);
                }
                target[position2++] = 120;
                target[position2++] = length;
              } else if (length < 65536) {
                if (headerSize < 3) {
                  target.copyWithin(position2 + 3, position2 + 2, position2 + 2 + length);
                }
                target[position2++] = 121;
                target[position2++] = length >> 8;
                target[position2++] = length & 255;
              } else {
                if (headerSize < 5) {
                  target.copyWithin(position2 + 5, position2 + 3, position2 + 3 + length);
                }
                target[position2++] = 122;
                targetView.setUint32(position2, length);
                position2 += 4;
              }
              position2 += length;
            } else if (type === "number") {
              if (!this.alwaysUseFloat && value >>> 0 === value) {
                if (value < 24) {
                  target[position2++] = value;
                } else if (value < 256) {
                  target[position2++] = 24;
                  target[position2++] = value;
                } else if (value < 65536) {
                  target[position2++] = 25;
                  target[position2++] = value >> 8;
                  target[position2++] = value & 255;
                } else {
                  target[position2++] = 26;
                  targetView.setUint32(position2, value);
                  position2 += 4;
                }
              } else if (!this.alwaysUseFloat && value >> 0 === value) {
                if (value >= -24) {
                  target[position2++] = 31 - value;
                } else if (value >= -256) {
                  target[position2++] = 56;
                  target[position2++] = ~value;
                } else if (value >= -65536) {
                  target[position2++] = 57;
                  targetView.setUint16(position2, ~value);
                  position2 += 2;
                } else {
                  target[position2++] = 58;
                  targetView.setUint32(position2, ~value);
                  position2 += 4;
                }
              } else {
                let useFloat32;
                if ((useFloat32 = this.useFloat32) > 0 && value < 4294967296 && value >= -2147483648) {
                  target[position2++] = 250;
                  targetView.setFloat32(position2, value);
                  let xShifted;
                  if (useFloat32 < 4 || // this checks for rounding of numbers that were encoded in 32-bit float to nearest significant decimal digit that could be preserved
                  (xShifted = value * mult10[(target[position2] & 127) << 1 | target[position2 + 1] >> 7]) >> 0 === xShifted) {
                    position2 += 4;
                    return;
                  } else
                    position2--;
                }
                target[position2++] = 251;
                targetView.setFloat64(position2, value);
                position2 += 8;
              }
            } else if (type === "object") {
              if (!value)
                target[position2++] = 246;
              else {
                if (referenceMap2) {
                  let referee = referenceMap2.get(value);
                  if (referee) {
                    target[position2++] = 216;
                    target[position2++] = 29;
                    target[position2++] = 25;
                    if (!referee.references) {
                      let idsToInsert = referenceMap2.idsToInsert || (referenceMap2.idsToInsert = []);
                      referee.references = [];
                      idsToInsert.push(referee);
                    }
                    referee.references.push(position2 - start);
                    position2 += 2;
                    return;
                  } else
                    referenceMap2.set(value, { offset: position2 - start });
                }
                let constructor = value.constructor;
                if (constructor === Object) {
                  writeObject(value);
                } else if (constructor === Array) {
                  length = value.length;
                  if (length < 24) {
                    target[position2++] = 128 | length;
                  } else {
                    writeArrayHeader(length);
                  }
                  for (let i = 0; i < length; i++) {
                    encode2(value[i]);
                  }
                } else if (constructor === Map) {
                  if (this.mapsAsObjects ? this.useTag259ForMaps !== false : this.useTag259ForMaps) {
                    target[position2++] = 217;
                    target[position2++] = 1;
                    target[position2++] = 3;
                  }
                  length = value.size;
                  if (length < 24) {
                    target[position2++] = 160 | length;
                  } else if (length < 256) {
                    target[position2++] = 184;
                    target[position2++] = length;
                  } else if (length < 65536) {
                    target[position2++] = 185;
                    target[position2++] = length >> 8;
                    target[position2++] = length & 255;
                  } else {
                    target[position2++] = 186;
                    targetView.setUint32(position2, length);
                    position2 += 4;
                  }
                  if (encoder.keyMap) {
                    for (let [key, entryValue] of value) {
                      encode2(encoder.encodeKey(key));
                      encode2(entryValue);
                    }
                  } else {
                    for (let [key, entryValue] of value) {
                      encode2(key);
                      encode2(entryValue);
                    }
                  }
                } else {
                  for (let i = 0, l = extensions.length; i < l; i++) {
                    let extensionClass = extensionClasses[i];
                    if (value instanceof extensionClass) {
                      let extension = extensions[i];
                      let tag = extension.tag;
                      if (tag == void 0)
                        tag = extension.getTag && extension.getTag.call(this, value);
                      if (tag < 24) {
                        target[position2++] = 192 | tag;
                      } else if (tag < 256) {
                        target[position2++] = 216;
                        target[position2++] = tag;
                      } else if (tag < 65536) {
                        target[position2++] = 217;
                        target[position2++] = tag >> 8;
                        target[position2++] = tag & 255;
                      } else if (tag > -1) {
                        target[position2++] = 218;
                        targetView.setUint32(position2, tag);
                        position2 += 4;
                      }
                      extension.encode.call(this, value, encode2, makeRoom);
                      return;
                    }
                  }
                  if (value[Symbol.iterator]) {
                    if (throwOnIterable) {
                      let error = new Error("Iterable should be serialized as iterator");
                      error.iteratorNotHandled = true;
                      throw error;
                    }
                    target[position2++] = 159;
                    for (let entry of value) {
                      encode2(entry);
                    }
                    target[position2++] = 255;
                    return;
                  }
                  if (value[Symbol.asyncIterator] || isBlob(value)) {
                    let error = new Error("Iterable/blob should be serialized as iterator");
                    error.iteratorNotHandled = true;
                    throw error;
                  }
                  if (this.useToJSON && value.toJSON) {
                    const json = value.toJSON();
                    if (json !== value)
                      return encode2(json);
                  }
                  writeObject(value);
                }
              }
            } else if (type === "boolean") {
              target[position2++] = value ? 245 : 244;
            } else if (type === "bigint") {
              if (value < BigInt(1) << BigInt(64) && value >= 0) {
                target[position2++] = 27;
                targetView.setBigUint64(position2, value);
              } else if (value > -(BigInt(1) << BigInt(64)) && value < 0) {
                target[position2++] = 59;
                targetView.setBigUint64(position2, -value - BigInt(1));
              } else {
                if (this.largeBigIntToFloat) {
                  target[position2++] = 251;
                  targetView.setFloat64(position2, Number(value));
                } else {
                  if (value >= BigInt(0))
                    target[position2++] = 194;
                  else {
                    target[position2++] = 195;
                    value = BigInt(-1) - value;
                  }
                  let bytes = [];
                  while (value) {
                    bytes.push(Number(value & BigInt(255)));
                    value >>= BigInt(8);
                  }
                  writeBuffer(new Uint8Array(bytes.reverse()), makeRoom);
                  return;
                }
              }
              position2 += 8;
            } else if (type === "undefined") {
              target[position2++] = 247;
            } else {
              throw new Error("Unknown type: " + type);
            }
          };
          const writeObject = this.useRecords === false ? this.variableMapSize ? (object) => {
            let keys = Object.keys(object);
            let vals = Object.values(object);
            let length = keys.length;
            if (length < 24) {
              target[position2++] = 160 | length;
            } else if (length < 256) {
              target[position2++] = 184;
              target[position2++] = length;
            } else if (length < 65536) {
              target[position2++] = 185;
              target[position2++] = length >> 8;
              target[position2++] = length & 255;
            } else {
              target[position2++] = 186;
              targetView.setUint32(position2, length);
              position2 += 4;
            }
            let key;
            if (encoder.keyMap) {
              for (let i = 0; i < length; i++) {
                encode2(encoder.encodeKey(keys[i]));
                encode2(vals[i]);
              }
            } else {
              for (let i = 0; i < length; i++) {
                encode2(keys[i]);
                encode2(vals[i]);
              }
            }
          } : (object) => {
            target[position2++] = 185;
            let objectOffset = position2 - start;
            position2 += 2;
            let size = 0;
            if (encoder.keyMap) {
              for (let key in object) if (typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key)) {
                encode2(encoder.encodeKey(key));
                encode2(object[key]);
                size++;
              }
            } else {
              for (let key in object) if (typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key)) {
                encode2(key);
                encode2(object[key]);
                size++;
              }
            }
            target[objectOffset++ + start] = size >> 8;
            target[objectOffset + start] = size & 255;
          } : (object, skipValues) => {
            let nextTransition, transition = structures.transitions || (structures.transitions = /* @__PURE__ */ Object.create(null));
            let newTransitions = 0;
            let length = 0;
            let parentRecordId;
            let keys;
            if (this.keyMap) {
              keys = Object.keys(object).map((k) => this.encodeKey(k));
              length = keys.length;
              for (let i = 0; i < length; i++) {
                let key = keys[i];
                nextTransition = transition[key];
                if (!nextTransition) {
                  nextTransition = transition[key] = /* @__PURE__ */ Object.create(null);
                  newTransitions++;
                }
                transition = nextTransition;
              }
            } else {
              for (let key in object) if (typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key)) {
                nextTransition = transition[key];
                if (!nextTransition) {
                  if (transition[RECORD_SYMBOL] & 1048576) {
                    parentRecordId = transition[RECORD_SYMBOL] & 65535;
                  }
                  nextTransition = transition[key] = /* @__PURE__ */ Object.create(null);
                  newTransitions++;
                }
                transition = nextTransition;
                length++;
              }
            }
            let recordId = transition[RECORD_SYMBOL];
            if (recordId !== void 0) {
              recordId &= 65535;
              target[position2++] = 217;
              target[position2++] = recordId >> 8 | 224;
              target[position2++] = recordId & 255;
            } else {
              if (!keys)
                keys = transition.__keys__ || (transition.__keys__ = Object.keys(object));
              if (parentRecordId === void 0) {
                recordId = structures.nextId++;
                if (!recordId) {
                  recordId = 0;
                  structures.nextId = 1;
                }
                if (recordId >= MAX_STRUCTURES) {
                  structures.nextId = (recordId = maxSharedStructures) + 1;
                }
              } else {
                recordId = parentRecordId;
              }
              structures[recordId] = keys;
              if (recordId < maxSharedStructures) {
                target[position2++] = 217;
                target[position2++] = recordId >> 8 | 224;
                target[position2++] = recordId & 255;
                transition = structures.transitions;
                for (let i = 0; i < length; i++) {
                  if (transition[RECORD_SYMBOL] === void 0 || transition[RECORD_SYMBOL] & 1048576)
                    transition[RECORD_SYMBOL] = recordId;
                  transition = transition[keys[i]];
                }
                transition[RECORD_SYMBOL] = recordId | 1048576;
                hasSharedUpdate = true;
              } else {
                transition[RECORD_SYMBOL] = recordId;
                targetView.setUint32(position2, 3655335680);
                position2 += 3;
                if (newTransitions)
                  transitionsCount += serializationsSinceTransitionRebuild * newTransitions;
                if (recordIdsToRemove.length >= MAX_STRUCTURES - maxSharedStructures)
                  recordIdsToRemove.shift()[RECORD_SYMBOL] = void 0;
                recordIdsToRemove.push(transition);
                writeArrayHeader(length + 2);
                encode2(57344 + recordId);
                encode2(keys);
                if (skipValues) return;
                for (let key in object)
                  if (typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key))
                    encode2(object[key]);
                return;
              }
            }
            if (length < 24) {
              target[position2++] = 128 | length;
            } else {
              writeArrayHeader(length);
            }
            if (skipValues) return;
            for (let key in object)
              if (typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key))
                encode2(object[key]);
          };
          const makeRoom = (end) => {
            let newSize;
            if (end > 16777216) {
              if (end - start > MAX_BUFFER_SIZE)
                throw new Error("Encoded buffer would be larger than maximum buffer size");
              newSize = Math.min(
                MAX_BUFFER_SIZE,
                Math.round(Math.max((end - start) * (end > 67108864 ? 1.25 : 2), 4194304) / 4096) * 4096
              );
            } else
              newSize = (Math.max(end - start << 2, target.length - 1) >> 12) + 1 << 12;
            let newBuffer = new ByteArrayAllocate(newSize);
            targetView = new DataView(newBuffer.buffer, 0, newSize);
            if (target.copy)
              target.copy(newBuffer, 0, start, end);
            else
              newBuffer.set(target.slice(start, end));
            position2 -= start;
            start = 0;
            safeEnd = newBuffer.length - 10;
            return target = newBuffer;
          };
          let chunkThreshold = 100;
          let continuedChunkThreshold = 1e3;
          this.encodeAsIterable = function(value, options2) {
            return startEncoding(value, options2, encodeObjectAsIterable);
          };
          this.encodeAsAsyncIterable = function(value, options2) {
            return startEncoding(value, options2, encodeObjectAsAsyncIterable);
          };
          function* encodeObjectAsIterable(object, iterateProperties, finalIterable) {
            let constructor = object.constructor;
            if (constructor === Object) {
              let useRecords = encoder.useRecords !== false;
              if (useRecords)
                writeObject(object, true);
              else
                writeEntityLength(Object.keys(object).length, 160);
              for (let key in object) {
                let value = object[key];
                if (!useRecords) encode2(key);
                if (value && typeof value === "object") {
                  if (iterateProperties[key])
                    yield* encodeObjectAsIterable(value, iterateProperties[key]);
                  else
                    yield* tryEncode(value, iterateProperties, key);
                } else encode2(value);
              }
            } else if (constructor === Array) {
              let length = object.length;
              writeArrayHeader(length);
              for (let i = 0; i < length; i++) {
                let value = object[i];
                if (value && (typeof value === "object" || position2 - start > chunkThreshold)) {
                  if (iterateProperties.element)
                    yield* encodeObjectAsIterable(value, iterateProperties.element);
                  else
                    yield* tryEncode(value, iterateProperties, "element");
                } else encode2(value);
              }
            } else if (object[Symbol.iterator] && !object.buffer) {
              target[position2++] = 159;
              for (let value of object) {
                if (value && (typeof value === "object" || position2 - start > chunkThreshold)) {
                  if (iterateProperties.element)
                    yield* encodeObjectAsIterable(value, iterateProperties.element);
                  else
                    yield* tryEncode(value, iterateProperties, "element");
                } else encode2(value);
              }
              target[position2++] = 255;
            } else if (isBlob(object)) {
              writeEntityLength(object.size, 64);
              yield target.subarray(start, position2);
              yield object;
              restartEncoding();
            } else if (object[Symbol.asyncIterator]) {
              target[position2++] = 159;
              yield target.subarray(start, position2);
              yield object;
              restartEncoding();
              target[position2++] = 255;
            } else {
              encode2(object);
            }
            if (finalIterable && position2 > start) yield target.subarray(start, position2);
            else if (position2 - start > chunkThreshold) {
              yield target.subarray(start, position2);
              restartEncoding();
            }
          }
          function* tryEncode(value, iterateProperties, key) {
            let restart = position2 - start;
            try {
              encode2(value);
              if (position2 - start > chunkThreshold) {
                yield target.subarray(start, position2);
                restartEncoding();
              }
            } catch (error) {
              if (error.iteratorNotHandled) {
                iterateProperties[key] = {};
                position2 = start + restart;
                yield* encodeObjectAsIterable.call(this, value, iterateProperties[key]);
              } else throw error;
            }
          }
          function restartEncoding() {
            chunkThreshold = continuedChunkThreshold;
            encoder.encode(null, THROW_ON_ITERABLE);
          }
          function startEncoding(value, options2, encodeIterable) {
            if (options2 && options2.chunkThreshold)
              chunkThreshold = continuedChunkThreshold = options2.chunkThreshold;
            else
              chunkThreshold = 100;
            if (value && typeof value === "object") {
              encoder.encode(null, THROW_ON_ITERABLE);
              return encodeIterable(value, encoder.iterateProperties || (encoder.iterateProperties = {}), true);
            }
            return [encoder.encode(value)];
          }
          async function* encodeObjectAsAsyncIterable(value, iterateProperties) {
            for (let encodedValue of encodeObjectAsIterable(value, iterateProperties, true)) {
              let constructor = encodedValue.constructor;
              if (constructor === ByteArray || constructor === Uint8Array)
                yield encodedValue;
              else if (isBlob(encodedValue)) {
                let reader = encodedValue.stream().getReader();
                let next;
                while (!(next = await reader.read()).done) {
                  yield next.value;
                }
              } else if (encodedValue[Symbol.asyncIterator]) {
                for await (let asyncValue of encodedValue) {
                  restartEncoding();
                  if (asyncValue)
                    yield* encodeObjectAsAsyncIterable(asyncValue, iterateProperties.async || (iterateProperties.async = {}));
                  else yield encoder.encode(asyncValue);
                }
              } else {
                yield encodedValue;
              }
            }
          }
        }
        useBuffer(buffer) {
          target = buffer;
          targetView = new DataView(target.buffer, target.byteOffset, target.byteLength);
          position2 = 0;
        }
        clearSharedData() {
          if (this.structures)
            this.structures = [];
          if (this.sharedValues)
            this.sharedValues = void 0;
        }
        updateSharedData() {
          let lastVersion = this.sharedVersion || 0;
          this.sharedVersion = lastVersion + 1;
          let structuresCopy = this.structures.slice(0);
          let sharedData = new SharedData(structuresCopy, this.sharedValues, this.sharedVersion);
          let saveResults = this.saveShared(
            sharedData,
            (existingShared) => (existingShared && existingShared.version || 0) == lastVersion
          );
          if (saveResults === false) {
            sharedData = this.getShared() || {};
            this.structures = sharedData.structures || [];
            this.sharedValues = sharedData.packedValues;
            this.sharedVersion = sharedData.version;
            this.structures.nextId = this.structures.length;
          } else {
            structuresCopy.forEach((structure, i) => this.structures[i] = structure);
          }
          return saveResults;
        }
      };
      SharedData = class {
        constructor(structures, values, version) {
          this.structures = structures;
          this.packedValues = values;
          this.version = version;
        }
      };
      BlobConstructor = typeof Blob === "undefined" ? function() {
      } : Blob;
      isLittleEndianMachine2 = new Uint8Array(new Uint16Array([1]).buffer)[0] == 1;
      extensionClasses = [
        Date,
        Set,
        Error,
        RegExp,
        Tag,
        ArrayBuffer,
        Uint8Array,
        Uint8ClampedArray,
        Uint16Array,
        Uint32Array,
        typeof BigUint64Array == "undefined" ? function() {
        } : BigUint64Array,
        Int8Array,
        Int16Array,
        Int32Array,
        typeof BigInt64Array == "undefined" ? function() {
        } : BigInt64Array,
        Float32Array,
        Float64Array,
        SharedData
      ];
      extensions = [
        {
          // Date
          tag: 1,
          encode(date, encode2) {
            let seconds = date.getTime() / 1e3;
            if ((this.useTimestamp32 || date.getMilliseconds() === 0) && seconds >= 0 && seconds < 4294967296) {
              target[position2++] = 26;
              targetView.setUint32(position2, seconds);
              position2 += 4;
            } else {
              target[position2++] = 251;
              targetView.setFloat64(position2, seconds);
              position2 += 8;
            }
          }
        },
        {
          // Set
          tag: 258,
          // https://github.com/input-output-hk/cbor-sets-spec/blob/master/CBOR_SETS.md
          encode(set, encode2) {
            let array = Array.from(set);
            encode2(array);
          }
        },
        {
          // Error
          tag: 27,
          // http://cbor.schmorp.de/generic-object
          encode(error, encode2) {
            encode2([error.name, error.message]);
          }
        },
        {
          // RegExp
          tag: 27,
          // http://cbor.schmorp.de/generic-object
          encode(regex, encode2) {
            encode2(["RegExp", regex.source, regex.flags]);
          }
        },
        {
          // Tag
          getTag(tag) {
            return tag.tag;
          },
          encode(tag, encode2) {
            encode2(tag.value);
          }
        },
        {
          // ArrayBuffer
          encode(arrayBuffer, encode2, makeRoom) {
            writeBuffer(arrayBuffer, makeRoom);
          }
        },
        {
          // Uint8Array
          getTag(typedArray) {
            if (typedArray.constructor === Uint8Array) {
              if (this.tagUint8Array || hasNodeBuffer && this.tagUint8Array !== false)
                return 64;
            }
          },
          encode(typedArray, encode2, makeRoom) {
            writeBuffer(typedArray, makeRoom);
          }
        },
        typedArrayEncoder(68, 1),
        typedArrayEncoder(69, 2),
        typedArrayEncoder(70, 4),
        typedArrayEncoder(71, 8),
        typedArrayEncoder(72, 1),
        typedArrayEncoder(77, 2),
        typedArrayEncoder(78, 4),
        typedArrayEncoder(79, 8),
        typedArrayEncoder(85, 4),
        typedArrayEncoder(86, 8),
        {
          encode(sharedData, encode2) {
            let packedValues2 = sharedData.packedValues || [];
            let sharedStructures = sharedData.structures || [];
            if (packedValues2.values.length > 0) {
              target[position2++] = 216;
              target[position2++] = 51;
              writeArrayHeader(4);
              let valuesArray = packedValues2.values;
              encode2(valuesArray);
              writeArrayHeader(0);
              writeArrayHeader(0);
              packedObjectMap = Object.create(sharedPackedObjectMap || null);
              for (let i = 0, l = valuesArray.length; i < l; i++) {
                packedObjectMap[valuesArray[i]] = i;
              }
            }
            if (sharedStructures) {
              targetView.setUint32(position2, 3655335424);
              position2 += 3;
              let definitions = sharedStructures.slice(0);
              definitions.unshift(57344);
              definitions.push(new Tag(sharedData.version, 1399353956));
              encode2(definitions);
            } else
              encode2(new Tag(sharedData.version, 1399353956));
          }
        }
      ];
      defaultEncoder = new Encoder({ useRecords: false });
      encode = defaultEncoder.encode;
      encodeAsIterable = defaultEncoder.encodeAsIterable;
      encodeAsAsyncIterable = defaultEncoder.encodeAsAsyncIterable;
      ({ NEVER, ALWAYS, DECIMAL_ROUND, DECIMAL_FIT } = FLOAT32_OPTIONS);
      REUSE_BUFFER_MODE = 512;
      RESET_BUFFER_MODE = 1024;
      THROW_ON_ITERABLE = 2048;
    }
  });

  // node_modules/.pnpm/cbor-x@1.6.0/node_modules/cbor-x/iterators.js
  function encodeIter(objectIterator, options = {}) {
    if (!objectIterator || typeof objectIterator !== "object") {
      throw new Error("first argument must be an Iterable, Async Iterable, or a Promise for an Async Iterable");
    } else if (typeof objectIterator[Symbol.iterator] === "function") {
      return encodeIterSync(objectIterator, options);
    } else if (typeof objectIterator.then === "function" || typeof objectIterator[Symbol.asyncIterator] === "function") {
      return encodeIterAsync(objectIterator, options);
    } else {
      throw new Error("first argument must be an Iterable, Async Iterable, Iterator, Async Iterator, or a Promise");
    }
  }
  function* encodeIterSync(objectIterator, options) {
    const encoder = new Encoder(options);
    for (const value of objectIterator) {
      yield encoder.encode(value);
    }
  }
  async function* encodeIterAsync(objectIterator, options) {
    const encoder = new Encoder(options);
    for await (const value of objectIterator) {
      yield encoder.encode(value);
    }
  }
  function decodeIter(bufferIterator, options = {}) {
    if (!bufferIterator || typeof bufferIterator !== "object") {
      throw new Error("first argument must be an Iterable, Async Iterable, Iterator, Async Iterator, or a promise");
    }
    const decoder2 = new Decoder(options);
    let incomplete;
    const parser = (chunk) => {
      let yields;
      if (incomplete) {
        chunk = Buffer.concat([incomplete, chunk]);
        incomplete = void 0;
      }
      try {
        yields = decoder2.decodeMultiple(chunk);
      } catch (err) {
        if (err.incomplete) {
          incomplete = chunk.slice(err.lastPosition);
          yields = err.values;
        } else {
          throw err;
        }
      }
      return yields;
    };
    if (typeof bufferIterator[Symbol.iterator] === "function") {
      return function* iter() {
        for (const value of bufferIterator) {
          yield* parser(value);
        }
      }();
    } else if (typeof bufferIterator[Symbol.asyncIterator] === "function") {
      return async function* iter() {
        for await (const value of bufferIterator) {
          yield* parser(value);
        }
      }();
    }
  }
  var init_iterators = __esm({
    "node_modules/.pnpm/cbor-x@1.6.0/node_modules/cbor-x/iterators.js"() {
      init_encode();
      init_decode();
    }
  });

  // node_modules/.pnpm/cbor-x@1.6.0/node_modules/cbor-x/index.js
  var cbor_x_exports = {};
  __export(cbor_x_exports, {
    ALWAYS: () => ALWAYS,
    DECIMAL_FIT: () => DECIMAL_FIT,
    DECIMAL_ROUND: () => DECIMAL_ROUND,
    Decoder: () => Decoder,
    Encoder: () => Encoder,
    FLOAT32_OPTIONS: () => FLOAT32_OPTIONS,
    NEVER: () => NEVER,
    REUSE_BUFFER_MODE: () => REUSE_BUFFER_MODE,
    Tag: () => Tag,
    addExtension: () => addExtension2,
    clearSource: () => clearSource,
    decode: () => decode,
    decodeIter: () => decodeIter,
    decodeMultiple: () => decodeMultiple,
    encode: () => encode,
    encodeAsAsyncIterable: () => encodeAsAsyncIterable,
    encodeAsIterable: () => encodeAsIterable,
    encodeIter: () => encodeIter,
    isNativeAccelerationEnabled: () => isNativeAccelerationEnabled,
    roundFloat32: () => roundFloat32,
    setSizeLimits: () => setSizeLimits
  });
  var init_cbor_x = __esm({
    "node_modules/.pnpm/cbor-x@1.6.0/node_modules/cbor-x/index.js"() {
      init_encode();
      init_decode();
      init_iterators();
    }
  });

  // app/workers/car-streaming-format.ts
  function getChunkByteRange(chunk, requestedStart, requestedEnd) {
    const chunkEnd = chunk.offset + chunk.size - 1;
    if (chunk.offset > requestedEnd || chunkEnd < requestedStart) {
      return null;
    }
    const start = Math.max(0, requestedStart - chunk.offset);
    const end = Math.min(chunk.size - 1, requestedEnd - chunk.offset);
    return { start, end };
  }
  function getChunksForByteRange(manifest, start, end) {
    const needed = [];
    for (const chunk of manifest.chunks) {
      const range = getChunkByteRange(chunk, start, end);
      if (range) {
        needed.push({ chunk, ...range });
      }
    }
    return needed;
  }
  var CHUNK_SIZE;
  var init_car_streaming_format = __esm({
    "app/workers/car-streaming-format.ts"() {
      "use strict";
      CHUNK_SIZE = 1024 * 1024;
    }
  });

  // app/workers/lit-key-manager.ts
  init_cbor_x();
  var DB_NAME = "lit-key-store";
  var DB_VERSION = 2;
  var STORE_NAMES = {
    SESSION_SIGS: "sessionSigs",
    CRYPTO_KEYS: "cryptoKeys",
    // New store for CryptoKey objects
    MANIFESTS: "manifests",
    // Store for manifest data
    KEY_METADATA: "keyMetadata"
    // Legacy, kept for migration
  };
  async function initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAMES.SESSION_SIGS)) {
          db.createObjectStore(STORE_NAMES.SESSION_SIGS);
        }
        if (!db.objectStoreNames.contains(STORE_NAMES.CRYPTO_KEYS)) {
          const store = db.createObjectStore(STORE_NAMES.CRYPTO_KEYS, {
            keyPath: "id"
          });
          store.createIndex("created", "created", { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_NAMES.MANIFESTS)) {
          const store = db.createObjectStore(STORE_NAMES.MANIFESTS, {
            keyPath: "id"
          });
          store.createIndex("created", "created", { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_NAMES.KEY_METADATA)) {
          const store = db.createObjectStore(STORE_NAMES.KEY_METADATA, {
            keyPath: "cid"
          });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
      };
    });
  }
  var ServiceWorkerKeyManager = class {
    constructor() {
      this.db = null;
    }
    async init() {
      this.db = await initDB();
    }
    // Get manifest and corresponding CryptoKey
    async getManifestAndKey(id) {
      if (!this.db) throw new Error("Database not initialized");
      try {
        const cached = await this.getCachedManifestAndKey(id);
        if (cached) return cached;
        if (!id.startsWith("manifest-")) {
          const manifest = await this.fetchAndDecryptManifest(id);
          if (manifest) {
            await this.cacheManifestAndKey(id, manifest);
            return this.getCachedManifestAndKey(id);
          }
        }
        return null;
      } catch (error) {
        console.error("Failed to get manifest and key:", error);
        return null;
      }
    }
    // Get cached manifest and key from IndexedDB
    async getCachedManifestAndKey(id) {
      if (!this.db) return null;
      const manifestTx = this.db.transaction([STORE_NAMES.MANIFESTS], "readonly");
      const manifestStore = manifestTx.objectStore(STORE_NAMES.MANIFESTS);
      const manifestEntry = await new Promise(
        (resolve, reject) => {
          const request = manifestStore.get(id);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        }
      );
      if (!manifestEntry) return null;
      const keyTx = this.db.transaction([STORE_NAMES.CRYPTO_KEYS], "readonly");
      const keyStore = keyTx.objectStore(STORE_NAMES.CRYPTO_KEYS);
      const keyEntry = await new Promise(
        (resolve, reject) => {
          const request = keyStore.get(id);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        }
      );
      if (!keyEntry) return null;
      return {
        manifest: manifestEntry.manifest,
        cryptoKey: keyEntry.cryptoKey,
        iv: keyEntry.iv
      };
    }
    // Cache manifest and key after fetching from IPFS
    async cacheManifestAndKey(id, manifest) {
      if (!this.db) return;
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        manifest.symmetricKey,
        { name: "AES-CTR" },
        false,
        // non-extractable
        ["decrypt"]
      );
      const manifestTx = this.db.transaction([STORE_NAMES.MANIFESTS], "readwrite");
      const manifestStore = manifestTx.objectStore(STORE_NAMES.MANIFESTS);
      await new Promise((resolve, reject) => {
        const request = manifestStore.put({
          id,
          manifest: {
            fileHash: manifest.fileHash,
            dataToEncryptHash: manifest.dataToEncryptHash,
            fileMetadata: manifest.fileMetadata,
            chunks: manifest.chunks
          },
          created: Date.now()
        });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      const keyTx = this.db.transaction([STORE_NAMES.CRYPTO_KEYS], "readwrite");
      const keyStore = keyTx.objectStore(STORE_NAMES.CRYPTO_KEYS);
      await new Promise((resolve, reject) => {
        const request = keyStore.put({
          id,
          cryptoKey,
          iv: manifest.iv,
          algorithm: "AES-CTR",
          created: Date.now()
        });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
    // Fetch and decrypt manifest from IPFS (for CID-based downloads)
    async fetchAndDecryptManifest(cid) {
      try {
        const response = await fetch(`/api/download/${cid}`);
        if (!response.ok) {
          throw new Error("Failed to fetch manifest from IPFS");
        }
        const data = await response.arrayBuffer();
        const { decode: decode2 } = await Promise.resolve().then(() => (init_cbor_x(), cbor_x_exports));
        const decoded = decode2(new Uint8Array(data));
        if (decoded.version !== "LIT-ENCRYPTED-V4") {
          throw new Error("Unsupported manifest version");
        }
        const decryptedManifest = await this.requestManifestDecryption(
          cid,
          decoded.accessControlConditions,
          decoded.encryptedManifest
        );
        return decryptedManifest;
      } catch (error) {
        console.error("Failed to fetch and decrypt manifest:", error);
        return null;
      }
    }
    // Request manifest decryption from main thread
    async requestManifestDecryption(cid, accessControlConditions, encryptedManifest) {
      return new Promise((resolve) => {
        const channel = new BroadcastChannel("lit-key-requests");
        const timeout = setTimeout(() => {
          channel.close();
          resolve(null);
        }, 5e3);
        channel.onmessage = (event) => {
          if (event.data.type === "manifest-response" && event.data.cid === cid) {
            clearTimeout(timeout);
            channel.close();
            resolve(event.data.manifest || null);
          }
        };
        channel.postMessage({
          type: "manifest-request",
          cid,
          accessControlConditions,
          encryptedManifest
        });
      });
    }
  };

  // app/workers/download-service-worker.ts
  init_car_streaming_format();
  var keyManager = new ServiceWorkerKeyManager();
  var keyManagerInitialized = false;
  async function ensureKeyManager() {
    if (!keyManagerInitialized) {
      await keyManager.init();
      keyManagerInitialized = true;
    }
  }
  self.addEventListener("message", async (event) => {
    if (event.data.type === "INIT_KEY_MANAGER") {
      try {
        await ensureKeyManager();
        event.ports[0]?.postMessage({ success: true });
      } catch (error) {
        event.ports[0]?.postMessage({
          success: false,
          error: error instanceof Error ? error.message : "Failed to initialize key manager"
        });
      }
    }
  });
  self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    const match = url.pathname.match(/^\/download\/(.+)$/);
    if (!match) return;
    const cid = match[1];
    event.respondWith(handleDownload(cid, event.request));
  });
  async function handleDownload(cid, request) {
    try {
      await ensureKeyManager();
      const result = await keyManager.getManifestAndKey(cid);
      if (!result) {
        return new Response("Manifest not available or access denied", {
          status: 403
        });
      }
      const { manifest, cryptoKey, iv } = result;
      const range = request.headers.get("range");
      let rangeStart = 0;
      let rangeEnd;
      if (range) {
        const match = range.match(/bytes=(\d+)-(\d*)/);
        if (match) {
          rangeStart = Number.parseInt(match[1]);
          rangeEnd = match[2] ? Number.parseInt(match[2]) : void 0;
        }
      }
      return handleManifestDownload(manifest, cryptoKey, iv, rangeStart, rangeEnd);
    } catch (error) {
      console.error("Download error:", error);
      return new Response("Failed to decrypt file", { status: 500 });
    }
  }
  async function handleManifestDownload(manifest, cryptoKey, iv, rangeStart, rangeEnd) {
    const fileSize = manifest.fileMetadata.size;
    const effectiveRangeEnd = rangeEnd ?? fileSize - 1;
    const neededChunks = getChunksForByteRange(
      {
        version: "LIT-ENCRYPTED-V3",
        // Use V3 format for compatibility
        network: "",
        contractName: "",
        contract: "0x0000000000000000000000000000000000000000",
        to: "0x0000000000000000000000000000000000000000",
        dataToEncryptHash: manifest.dataToEncryptHash,
        unifiedAccessControlConditions: [],
        fileMetadata: manifest.fileMetadata,
        chunks: manifest.chunks,
        created: Date.now()
      },
      rangeStart,
      effectiveRangeEnd
    );
    if (neededChunks.length === 0) {
      return new Response("Requested range not satisfiable", {
        status: 416,
        headers: {
          "Content-Range": `bytes */${fileSize}`
        }
      });
    }
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for (const chunkRequest of neededChunks) {
            const chunkResponse = await fetch(
              `/api/ipfs/${chunkRequest.chunk.cid}`
            );
            if (!chunkResponse.ok) {
              throw new Error(
                `Failed to fetch chunk ${chunkRequest.chunk.cid}: ${chunkResponse.status}`
              );
            }
            const encryptedData = new Uint8Array(
              await chunkResponse.arrayBuffer()
            );
            const decryptedChunk = await decryptChunk(
              encryptedData,
              cryptoKey,
              iv,
              chunkRequest.chunk.counter
            );
            const chunkData = decryptedChunk.slice(
              chunkRequest.start,
              chunkRequest.end + 1
            );
            controller.enqueue(chunkData);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });
    const contentLength = effectiveRangeEnd - rangeStart + 1;
    const headers = {
      "Content-Type": manifest.fileMetadata.type || "application/octet-stream",
      "Content-Length": contentLength.toString(),
      "Content-Disposition": `attachment; filename="${manifest.fileMetadata.name}"`,
      "Accept-Ranges": "bytes"
    };
    if (rangeStart > 0 || effectiveRangeEnd < fileSize - 1) {
      headers["Content-Range"] = `bytes ${rangeStart}-${effectiveRangeEnd}/${fileSize}`;
      return new Response(stream, { status: 206, headers });
    }
    return new Response(stream, { headers });
  }
  async function decryptChunk(encryptedData, key, baseIv, counter) {
    const chunkIv = new Uint8Array(16);
    chunkIv.set(baseIv);
    let carry = counter;
    for (let i = 15; i >= 0 && carry > 0; i--) {
      const sum = chunkIv[i] + (carry & 255);
      chunkIv[i] = sum & 255;
      carry = (carry >>> 8) + (sum >>> 8);
    }
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-CTR",
        counter: chunkIv,
        length: 128
      },
      key,
      encryptedData
    );
    return new Uint8Array(decrypted);
  }
  self.addEventListener("install", () => {
    self.skipWaiting();
  });
  self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
  });
})();
//# sourceMappingURL=download-service-worker.js.map
