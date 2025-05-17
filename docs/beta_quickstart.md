# TORI/ALAN Beta Quick-Start 🚀

**Welcome to the closed beta!**  
Follow these three steps and you'll have a talking avatar and IDE helper in under five minutes.

---

## 1. Install

| Platform | Package | Command |
|----------|---------|---------|
| macOS 12+ (Apple Silicon) | `tori-ide-macos-arm64.dmg` | double-click → drag to Applications |
| Windows 10+ | `ToriSetup.exe` | run installer (admin not required) |
| Android 13+ | `tori_beta.apk` | enable "Install unknown apps" → tap APK |

> **Heads-up:** first launch downloads a 35 MB spectral core model; keep Wi-Fi on.

---

## 2. First run

1. Sign-in with your GitHub or Google account.  
2. Grant microphone & camera **only if** you want voice+avatar (text-only works without).  
3. Click **"New Session"** → type or speak a question.  
4. To record a 30-second demo clip, press **Export ▶**.

---

## 3. Share feedback

* Toolbar → **☰ → "Send Diagnostics"** attaches a 5-second crash snapshot.  
* Join the Discord `#beta-feedback` channel for quick triage.

---

### Common Pitfalls

| Symptom | Fix |
|---------|-----|
| Avatar lips out-of-sync | Settings → Performance → disable "High-res mouth blendshapes" |
| Export stalls at 80 % (iOS A8 devices) | Switch export preset to "Software H.264" |
| `psiarc verify` shows CRC error | File truncated—check disk quota or copy again |

Enjoy exploring TORI/ALAN—and let us know what bends or breaks!

---

## What data is collected?  🔍

| Field            | Example                    | Note                              |
|------------------|----------------------------|-----------------------------------|
| deviceId (hash)  | `77b9…`                    | SHA-256 of hardware UUID, not PII |
| model            | `SM-A515F`                 | Phone/computer model              |
| os               | `Android 13`              | OS version                        |
| peakRamMb        | `122`                      | Max MB RAM used during session    |
| avgFps           | `48`                       | Playback FPS (no frame images)    |
| export.success   | `false`                    | Whether export finished           |

**No audio, video, code or personal text ever leaves your device.**  
Telemetry batches are encrypted in transit and you can disable them anytime:

```bash
TORI_NO_TELEMETRY=1 ./tori-ide
```
Or toggle Settings ▸ Privacy ▸ Telemetry.
