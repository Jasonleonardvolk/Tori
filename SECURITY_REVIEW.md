# ψ‑Trajectory — Security Review & Threat Model  v0.1

## 1. Surface & Assets
| Component | Data at rest | Data in transit | Notes |
|-----------|-------------|-----------------|-------|
| `.psiarc` archives | Optionally ChaCha20‑Poly1305 encrypted | n/a (local) | Keys stored in OS keychain (per-device) |
| Telemetry batch | None (metadata only) | TLS 1.3 to `telemetry.tori.ai` | Opt‑in, anonymised device hash |
| FFI GPU kernels | N/A | N/A | Verified SHA256 at build time |

## 2. Threats & Mitigations
| Threat | Risk | Mitigation |
|--------|------|-----------|
| Archive tampering | Replay crash / code exec | CRC + ChaCha20 AEAD tag validated before decode |
| Key theft on rooted phone | Medium | Device‑bound Keystore; user can revoke & re‑key |
| MitM on telemetry | Low | HTTPS + HSTS; no PII in payload |

## 3. Cryptography
* AEAD: **ChaCha20‑Poly1305, 256‑bit** (RFC 8439)
* KDF: PBKDF2‑HMAC‑SHA256, 100k iterations, 16‑byte salt
* RNG: `ring::rand::SystemRandom`

## 4. SBOM & Builds
* SPDX JSON generated weekly (`.github/workflows/audit.yml`).
* Release binaries built with `cargo auditable`, embedding dependency tree hash.

## 5. Incident Response
* Crashes with `telemetry.secure=true` emit stackhash only.
* `psiarc verify --full` prints build hash + schema version to attach in tickets.
