"""Generates src/assets/sounds/panorama.wav: a short, soft three-note rising chime (G5 - D6 - G6) with bell-like partials.

Run:  python scripts/make-notification-sound.py
The result is committed, so builds never need to run this; it exists so the sound can be tuned or regenerated.
"""

from __future__ import annotations

import math
import struct
import wave
from pathlib import Path

RATE = 44100
NOTES = [(0.00, 783.99, 0.55), (0.17, 1174.66, 0.55), (0.34, 1567.98, 0.95)]  # (start s, Hz, length s)
PARTIALS = [(1.0, 1.0, 3.2), (2.0, 0.28, 4.5), (3.0, 0.12, 6.0), (4.2, 0.06, 8.0)]  # (ratio, level, decay speed)
TOTAL = 1.5
PEAK = 0.62


def render() -> list[float]:
    samples = [0.0] * int(TOTAL * RATE)
    for start, frequency, length in NOTES:
        first = int(start * RATE)
        for index in range(int(length * RATE)):
            t = index / RATE
            attack = min(1.0, t / 0.006)  # 6 ms ramp: no click
            value = 0.0
            for ratio, level, decay in PARTIALS:
                value += level * math.exp(-decay * t) * math.sin(2 * math.pi * frequency * ratio * t)
            if first + index < len(samples):
                samples[first + index] += attack * value
    top = max(abs(sample) for sample in samples) or 1.0
    fade = int(0.04 * RATE)
    for index in range(fade):  # 40 ms fade-out so the file ends on silence
        samples[-1 - index] *= index / fade
    return [sample / top * PEAK for sample in samples]


def main() -> None:
    target = Path(__file__).resolve().parent.parent / "src" / "assets" / "sounds" / "panorama.wav"
    target.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(target), "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(RATE)
        out.writeframes(b"".join(struct.pack("<h", int(sample * 32767)) for sample in render()))
    print(f"wrote {target} ({target.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
