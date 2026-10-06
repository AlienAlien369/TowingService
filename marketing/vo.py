"""Generates the Hinglish voice-over line by line with word-level timestamps (edge-tts neural voice)."""
import asyncio, json, pathlib, edge_tts

OUT = pathlib.Path(__file__).parent / "audio"
VOICE = "hi-IN-MadhurNeural"
RATE = "+20%"

# hi = what the voice reads (Devanagari + English brand words); rom = on-screen Hinglish captions, 1:1 with hi tokens
LINES = [
    ("hook", "रात के ग्यारह बजे, दिल्ली, गाड़ी बंद।", "Raat ke gyarah baje. Delhi. Gaadi band."),
    ("pain", "फ़ोन करो, मोल-भाव करो, इंतज़ार करो, और दुआ करो।", "Phone karo, mol-bhaav karo, intezaar karo... aur dua karo."),
    ("brand", "अब एक ही नाम: RoadSaathi, साठ सेकंड में रेस्क्यू।", "Ab ek hi naam: RoadSaathi. 60 second mein rescue."),
    ("book", "गाड़ी चुनो, पिन लगाओ, पूरा फ़ेयर पहले से देखो, GST के साथ।", "Gaadi chuno. Pin lagao. Poora fare pehle se dekho, GST ke saath."),
    ("track", "वेरिफ़ाइड ड्राइवर, लाइव ट्रैकिंग, और PIN तभी दो, जब वो पहुँचे।", "Verified driver, live tracking, aur PIN tabhi do, jab woh pahunche."),
    ("pay", "सर्विस के बाद पेमेंट, GST इनवॉइस सीधे ईमेल पर।", "Service ke baad payment. GST invoice seedha email par."),
    ("biz", "टो ट्रक है? पार्टनर बनो, कॉन्ट्रैक्ट ई-साइन करो, जॉब सीधे फ़ोन पर।", "Tow truck hai? Partner bano, contract e-sign karo, jobs seedha phone par."),
    ("payoff", "ब्रेकडाउन से बुक्ड, सिर्फ़ साठ सेकंड में।", "Breakdown se booked, sirf 60 second mein."),
    ("cta", "RoadSaathi, दिल्ली की हर रात का साथी, अभी बुक करो।", "RoadSaathi. Delhi ki har raat ka saathi. Abhi book karo."),
]


async def one(key: str, hi: str, rom: str):
    comm = edge_tts.Communicate(hi, VOICE, rate=RATE, pitch="-1Hz", boundary="WordBoundary")
    words, audio = [], bytearray()
    async for ev in comm.stream():
        if ev["type"] == "audio":
            audio += ev["data"]
        elif ev["type"] == "WordBoundary":
            words.append({"text": ev["text"], "start": ev["offset"] / 1e7, "end": (ev["offset"] + ev["duration"]) / 1e7})
    (OUT / f"{key}.mp3").write_bytes(bytes(audio))
    rom_tokens = rom.split()
    return {"key": key, "hi": hi, "rom": rom_tokens, "words": words, "match": len(rom_tokens) == len(words)}


async def main():
    OUT.mkdir(exist_ok=True)
    res = await asyncio.gather(*(one(*l) for l in LINES))
    (OUT / "vo.json").write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
    for r in res:
        print(r["key"], "words:", len(r["words"]), "rom:", len(r["rom"]), "OK" if r["match"] else "MISMATCH")


asyncio.run(main())
