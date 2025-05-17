# Binary Protocols for ALAN 2.x

This document specifies the binary protocols used for data exchange in the ALAN 2.x system. These protocols are essential for interoperability between components, especially when crossing language boundaries (Rust/Python/JavaScript) or system boundaries (Core/Hardware/WebUI).

## 1. Snapshot Buffer Format (ALSN/ALSC)

ALAN uses two closely related formats for serializing system state:

- **ALSN** (ALAN Snapshot): Raw uncompressed format
- **ALSC** (ALAN Snapshot Compressed): LZ4-compressed format with header

### 1.1 Common Header Structure (8 bytes)

| Offset | Size | Type   | Field         | Description                              |
|--------|------|--------|---------------|------------------------------------------|
| 0      | 4    | uint32 | Magic Number  | 'ALSN' (0x4E534C41) or 'ALSC' (0x43534C41) |
| 4      | 1    | uint8  | Version Major | Current: 0                               |
| 5      | 1    | uint8  | Version Minor | Current: 8                               |
| 6      | 1    | uint8  | Version Patch | Current: 0                               |
| 7      | 1    | uint8  | Flags         | Bit 0: Has CRC, Bits 1-7: Reserved       |

### 1.2 ALSN Body Structure

The ALSN format follows the header with a FlatBuffers-encoded data section:

| Offset | Size        | Type        | Field         | Description                     |
|--------|-------------|-------------|--------------|---------------------------------|
| 8      | 4           | uint32      | Content Size  | Size of FlatBuffers data        |
| 12     | Content Size| bytes       | FlatBuffers   | Snapshot data (schema below)    |
| 12+Size| 4 (optional)| uint32      | CRC32         | Present if Flags bit 0 is set   |

### 1.3 ALSC Body Structure

The ALSC format contains compressed data:

| Offset | Size        | Type        | Field             | Description                       |
|--------|-------------|-------------|-------------------|-----------------------------------|
| 8      | 4           | uint32      | Compressed Size   | Size of compressed data           |
| 12     | 4           | uint32      | Uncompressed Size | Size when decompressed            |
| 16     | Comp. Size  | bytes       | LZ4 Data          | Compressed ALSN body (no header)  |
| 16+Size| 4 (optional)| uint32      | CRC32             | Present if Flags bit 0 is set     |

### 1.4 FlatBuffers Schema (CRC32: 0xA7B32C1F)

The FlatBuffers schema defines the serialization format:

```flatbuffers
namespace alan.snapshot;

// Vector of oscillator phases and other state
table OscillatorState {
  n_oscillators: uint32;
  theta: [float];         // Phase angles [0, 2π)
  p_theta: [float];       // Phase momenta
  sigma: [float];         // Spin vectors (x,y,z triples)
  p_sigma: [float];       // Spin momenta (x,y,z triples)
  n_effective: float;     // Calculated coherence metric
}

// Main snapshot table
table Snapshot {
  timestamp: uint64;      // Unix timestamp in milliseconds
  oscillators: OscillatorState;
  memory_state: [float];  // Hopfield memory values
  controller_state: [float]; // TRS-ODE controller state
  metadata: [KeyValue];   // Additional metadata
}

// Key-value pairs for metadata
table KeyValue {
  key: string;
  value: string;
}

root_type Snapshot;
```

### 1.5 Example Hexdump

Here's a hexdump of a simple ALSC snapshot with 4 oscillators:

```
0000: 4143 534C 0008 0001 1C00 0000 8801 0000  ALSC............
0010: A4B5 FE1D 789C 6D8F 310E C230 0C45 DF48  ....x.m.1..0.E.H
0020: 7910 8604 4845 0B6B 5525 42DC C0E8 18C1  y...HE.kU%B.....
0030: 8412 2986 2B68 8A4A 4C88 A99D F67A 7CA0  ..).+h.JL....z|.
...
00D0: 0000 0000 0000 0000 0000 0000 0000 0000  ................
00E0: 18FD E29A                                ..
```

Notes:
- First 4 bytes: 'ALSC' magic number (0x43534C41)
- Bytes 4-6: Version 0.8.0
- Byte 7: Flags 0x01 (has CRC)
- Bytes 8-11: Compressed size (0x1C00 = 7,168 bytes)
- Bytes 12-15: Uncompressed size (0x8801 = 34,817 bytes)
- Final 4 bytes: CRC32 (0x9AE2FD18)

## 2. WebSocket Frame Format

The ALAN WebSocket protocol delivers real-time oscillator state data to visualization clients.

### 2.1 Frame Structure

Each binary WebSocket message has the following format (little-endian):

| Offset | Size      | Type      | Field         | Description                              |
|--------|-----------|-----------|---------------|------------------------------------------|
| 0      | 4         | uint32    | Count         | Number of oscillators                     |
| 4      | 4         | float32   | N_effective   | Coherence metric [0,N]                   |
| 8      | Count×4   | float32[] | Phases        | Phase values normalized to [0,1]         |
| 8+Count×4| Count×12 | float32[] | Spins (opt)   | Spin vectors (x,y,z) if present          |

### 2.2 Binary Message Example

For a system with 3 oscillators and N_effective = 2.5:

```
0000: 0300 0000 0000 2040 0000 0000 0000 3F40  ....... @....?@
0010: CDCC CC3E 9A99 993F 0000 803F 0000 0000  ...>...?...?....
0020: 0000 0000 0000 803F 0000 803F 0000 0000  .......?...?....
0030: 0000 0000 0000 803F                      .......?
```

Decoding:
- Count: 3 (0x03000000 in little-endian)
- N_effective: 2.5 (0x40200000 in IEEE-754)
- Phases: [0.0, 0.75, 0.6, 1.0] (normalized from [0,2π])
- Spins: Three 3D unit vectors, stored as (x,y,z) triples

### 2.3 JavaScript Decoder Example

```javascript
function decodeFrame(buffer) {
  const view = new DataView(buffer);
  const count = view.getUint32(0, true);
  const nEffective = view.getFloat32(4, true);
  
  // Extract phases
  const phases = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    phases[i] = view.getFloat32(8 + i * 4, true);
  }
  
  // Check if spin data is present
  const hasSpins = buffer.byteLength >= 8 + (count * 4) + (count * 12);
  let spins = null;
  
  if (hasSpins) {
    spins = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      spins[i] = view.getFloat32(8 + (count * 4) + i * 4, true);
    }
  }
  
  return { count, nEffective, phases, spins };
}
```

## 3. ELFIN Grammar Token IDs

The ELFIN grammar uses tokenized identifiers for efficient serialization and version control.

### 3.1 Token Format

Token IDs are 32-bit integers with the following structure:

| Bits    | Purpose                                        |
|---------|-------------------------------------------------|
| 0-23    | Token ID (16,777,216 possible values)           |
| 24-31   | Grammar version (Major:4 bits, Minor:4 bits)    |

Current grammar version: 1.1 (encoded as 0x11000000)

### 3.2 Standard Token IDs (with version bits)

| Token            | Hex Value      | Description                      |
|------------------|----------------|----------------------------------|
| T_UNIT           | 0x11000001     | Unit declaration                 |
| T_CONCEPT        | 0x11000002     | Concept declaration              |
| T_CONSTRAINT     | 0x11000003     | Constraint expression            |
| T_FUNCTION       | 0x11000004     | Function declaration             |
| T_MAPPING        | 0x11000005     | Mapping between concepts         |
| T_RELATION       | 0x11000006     | Relation between concepts        |
| T_VERSION        | 0x11000007     | Version declaration              |
| T_IMPORT         | 0x11000008     | Import statement                 |
| T_EXPORT         | 0x11000009     | Export statement                 |
| T_NAMESPACE      | 0x1100000A     | Namespace declaration            |

### 3.3 Serialized Grammar CRC

For validation of binary formats against the correct grammar version, use:
- Grammar CRC32: 0x8D47F31C

## Endianness and Numerical Representation

- All binary formats use **little-endian** byte order
- Floating point values use IEEE-754 single precision (32-bit) or double precision (64-bit)
- Integers are represented as fixed-width unsigned or signed values as specified
- Text is encoded as UTF-8 with null termination in contexts where length is not explicitly provided

## Version History

### v0.8.0
- Initial specification of binary protocols
- Added LZ4 compression for snapshot data
- Implemented WebSocket binary protocol for real-time visualization
- Defined token ID structure for ELFIN grammar v1.1
