// Seed content. Everything here is editable afterwards from the admin panel.
type L = { en: string; hi: string };
const l = (en: string, hi: string): L => ({ en, hi });

export const vehicleTypes = [
  { slug: "two-wheeler", icon: "bike", maxWeightKg: 350, name: l("Two-wheeler (Scooter / Bike)", "दोपहिया (स्कूटर / बाइक)"), description: l("Scooters, motorcycles and mopeds, carried safely on a bike carrier.", "स्कूटर, मोटरसाइकिल और मोपेड — बाइक कैरियर पर सुरक्षित ढुलाई।") },
  { slug: "three-wheeler", icon: "zap", maxWeightKg: 800, name: l("Three-wheeler (Auto / E-rickshaw)", "तिपहिया (ऑटो / ई-रिक्शा)"), description: l("Autos, e-rickshaws and cargo three-wheelers.", "ऑटो, ई-रिक्शा और कार्गो तिपहिया वाहन।") },
  { slug: "car", icon: "car", maxWeightKg: 1500, name: l("Car (Hatchback / Sedan)", "कार (हैचबैक / सेडान)"), description: l("Hatchbacks, sedans and compact cars, including EVs.", "हैचबैक, सेडान और कॉम्पैक्ट कारें, EV सहित।") },
  { slug: "suv", icon: "suv", maxWeightKg: 2500, name: l("SUV / MUV", "SUV / MUV"), description: l("SUVs, MUVs, vans and luxury vehicles.", "SUV, MUV, वैन और लग्ज़री वाहन।") },
  { slug: "commercial", icon: "truck", maxWeightKg: 7500, name: l("Commercial (LCV / Tempo / Pickup)", "कमर्शियल (LCV / टेम्पो / पिकअप)"), description: l("Light commercial vehicles, tempos, pickups and mini trucks.", "लाइट कमर्शियल वाहन, टेम्पो, पिकअप और मिनी ट्रक।") },
  { slug: "heavy", icon: "heavy", maxWeightKg: 40000, name: l("Heavy vehicle (Truck / Bus / Trailer)", "भारी वाहन (ट्रक / बस / ट्रेलर)"), description: l("Trucks, buses, trailers and containers using hydraulic heavy recovery.", "ट्रक, बस, ट्रेलर और कंटेनर — हाइड्रोलिक हेवी रिकवरी से।") },
];

export const services = [
  { slug: "flatbed-towing", icon: "flatbed", requiresDrop: true, etaMinutes: 30, isFeatured: true, name: l("Flatbed towing", "फ़्लैटबेड टोइंग"), shortDescription: l("Vehicle rides on a flat platform — zero wheel contact.", "गाड़ी फ़्लैट प्लेटफ़ॉर्म पर — पहियों पर ज़ीरो दबाव।"), description: l("The safest way to move any vehicle. Your car, bike or SUV is winched onto a flat bed and strapped down, so nothing touches the road. Ideal for luxury and low-clearance cars, EVs, all-wheel-drive vehicles, accident-damaged vehicles and two-wheelers.", "किसी भी वाहन को ले जाने का सबसे सुरक्षित तरीका। आपकी कार, बाइक या SUV को विंच से फ़्लैट बेड पर चढ़ाकर बाँधा जाता है, ताकि कुछ भी सड़क को न छुए। लग्ज़री व नीची कारों, EV, ऑल-व्हील-ड्राइव, दुर्घटना में क्षतिग्रस्त वाहनों और दोपहिया के लिए आदर्श।") },
  { slug: "wheel-lift-towing", icon: "wheellift", requiresDrop: true, etaMinutes: 25, isFeatured: true, name: l("Wheel-lift towing", "व्हील-लिफ़्ट टोइंग"), shortDescription: l("Fast, economical towing for everyday cars.", "रोज़मर्रा की कारों के लिए तेज़ और किफ़ायती टोइंग।"), description: l("A hydraulic wheel-lift raises the drive wheels off the ground for quick, affordable towing across the city. Best for front-wheel-drive cars, short distances and tight parking spaces.", "हाइड्रोलिक व्हील-लिफ़्ट ड्राइव व्हील को ज़मीन से उठाकर शहर में तेज़ व किफ़ायती टोइंग करता है। फ़्रंट-व्हील-ड्राइव कारों, कम दूरी और तंग पार्किंग के लिए बेहतरीन।") },
  { slug: "accident-recovery", icon: "accident", requiresDrop: true, etaMinutes: 35, isFeatured: true, name: l("Accident recovery", "एक्सीडेंट रिकवरी"), shortDescription: l("Safe recovery of damaged vehicles from the crash site.", "दुर्घटना स्थल से क्षतिग्रस्त वाहनों की सुरक्षित रिकवरी।"), description: l("Crash or collision? Our recovery crews winch and load damaged, overturned or stuck vehicles with the right gear, then deliver them to your chosen workshop. We provide a recovery receipt that helps with insurance claims.", "टक्कर या हादसा? हमारी रिकवरी टीम सही उपकरण से क्षतिग्रस्त, पलटे या फँसे वाहनों को विंच कर लोड करती है और आपकी चुनी वर्कशॉप तक पहुँचाती है। बीमा क्लेम के लिए रिकवरी रसीद भी मिलती है।") },
  { slug: "breakdown-assistance", icon: "wrench", requiresDrop: false, etaMinutes: 30, isFeatured: false, name: l("Breakdown assistance", "ब्रेकडाउन असिस्टेंस"), shortDescription: l("On-spot mechanic diagnosis and minor fixes.", "मौके पर मैकेनिक जाँच और छोटी मरम्मत।"), description: l("A roadside mechanic diagnoses the problem and fixes minor issues on the spot — loose connections, overheating, clutch/brake cable adjustments and more. If it can't be fixed, we convert it into a tow in one tap.", "रोडसाइड मैकेनिक समस्या की जाँच कर मौके पर ही छोटी खराबियाँ ठीक करता है — ढीले कनेक्शन, ओवरहीटिंग, क्लच/ब्रेक केबल एडजस्टमेंट आदि। ठीक न हो सके तो एक टैप में टोइंग में बदल दें।") },
  { slug: "battery-jump-start", icon: "battery", requiresDrop: false, etaMinutes: 20, isFeatured: true, name: l("Battery jump-start", "बैटरी जंप-स्टार्ट"), shortDescription: l("Dead battery? Back on the road in minutes.", "बैटरी डाउन? मिनटों में दोबारा सड़क पर।"), description: l("Our technician arrives with a professional jump-starter and gets your engine running on the spot. Battery replacement available on request (battery cost extra).", "हमारा टेक्नीशियन प्रोफ़ेशनल जंप-स्टार्टर के साथ पहुँचकर मौके पर इंजन चालू करता है। माँगने पर बैटरी रिप्लेसमेंट भी (बैटरी का खर्च अलग)।") },
  { slug: "tyre-change", icon: "tyre", requiresDrop: false, etaMinutes: 25, isFeatured: true, name: l("Tyre change & puncture", "टायर बदलना और पंचर"), shortDescription: l("Flat tyre swapped with your spare — or repaired.", "पंचर टायर आपके स्टेपनी से बदला जाए — या ठीक किया जाए।"), description: l("We swap your flat tyre with your spare or carry out a tubeless puncture repair on the spot, with proper jacks and torque tools.", "हम आपका पंचर टायर स्टेपनी से बदलते हैं या सही जैक व टॉर्क टूल से ट्यूबलेस पंचर मौके पर ही ठीक करते हैं।") },
  { slug: "fuel-delivery", icon: "fuel", requiresDrop: false, etaMinutes: 25, isFeatured: false, name: l("Fuel delivery", "फ़्यूल डिलीवरी"), shortDescription: l("Out of fuel? We bring 5 litres to you.", "तेल खत्म? हम 5 लीटर तेल पहुँचाते हैं।"), description: l("Ran dry? We deliver petrol or diesel to your exact location in a safe, approved container. Service fee is flat; fuel is charged at the pump price.", "तेल खत्म हो गया? हम सुरक्षित मान्य कंटेनर में पेट्रोल या डीज़ल आपकी सटीक लोकेशन पर पहुँचाते हैं। सेवा शुल्क तय है; तेल पंप के रेट पर।") },
  { slug: "lockout-assistance", icon: "lockout", requiresDrop: false, etaMinutes: 30, isFeatured: false, name: l("Lockout assistance", "लॉकआउट असिस्टेंस"), shortDescription: l("Keys locked inside? We get you in without damage.", "चाबी अंदर रह गई? बिना नुकसान गाड़ी खोलें।"), description: l("Locked out of your vehicle? Our technicians open it using non-destructive tools. Proof of ownership is required before we start.", "गाड़ी में चाबी रह गई? हमारे टेक्नीशियन बिना नुकसान वाले औज़ारों से गाड़ी खोलते हैं। शुरू करने से पहले मालिकाना हक का प्रमाण ज़रूरी है।") },
  { slug: "winch-recovery", icon: "crane", requiresDrop: true, etaMinutes: 40, isFeatured: false, name: l("Winch & off-road recovery", "विंच और ऑफ़-रोड रिकवरी"), shortDescription: l("Stuck in a ditch, mud or a basement ramp? We pull you out.", "गड्ढे, कीचड़ या बेसमेंट रैंप में फँसे? हम निकालते हैं।"), description: l("Heavy-duty winching for vehicles stuck in ditches, mud, waterlogging, basements or off the road, followed by transport to your destination.", "गड्ढे, कीचड़, जलभराव, बेसमेंट या सड़क से उतरे वाहनों की हेवी-ड्यूटी विंचिंग, उसके बाद आपकी मंज़िल तक ढुलाई।") },
];

// Rupees. towing: [base incl. 5 km, per km beyond, min]; on-spot: flat
const towBase: Record<string, [number, number]> = {
  "two-wheeler": [499, 15],
  "three-wheeler": [799, 22],
  car: [999, 30],
  suv: [1299, 38],
  commercial: [1999, 55],
  heavy: [3999, 90],
};
const towMult: Record<string, number> = { "flatbed-towing": 1.3, "wheel-lift-towing": 1, "accident-recovery": 1.8, "winch-recovery": 1.5 };
const towOnly: Record<string, string[]> = {
  "flatbed-towing": ["two-wheeler", "three-wheeler", "car", "suv", "commercial", "heavy"],
  "wheel-lift-towing": ["car", "suv", "commercial"],
  "accident-recovery": ["two-wheeler", "three-wheeler", "car", "suv", "commercial", "heavy"],
  "winch-recovery": ["car", "suv", "commercial", "heavy"],
};
const flat: Record<string, Record<string, number>> = {
  "battery-jump-start": { "two-wheeler": 249, "three-wheeler": 299, car: 349, suv: 399, commercial: 499, heavy: 899 },
  "tyre-change": { "two-wheeler": 249, "three-wheeler": 299, car: 399, suv: 449, commercial: 599, heavy: 999 },
  "fuel-delivery": { "two-wheeler": 299, "three-wheeler": 299, car: 349, suv: 349, commercial: 399, heavy: 599 },
  "lockout-assistance": { "two-wheeler": 349, "three-wheeler": 399, car: 599, suv: 649, commercial: 699 },
  "breakdown-assistance": { "two-wheeler": 349, "three-wheeler": 399, car: 449, suv: 499, commercial: 649, heavy: 1199 },
};

export function buildRateCards() {
  const out: { vehicle: string; service: string; baseFare: number; includedKm: number; perKm: number; minFare: number }[] = [];
  for (const [svc, vehicles] of Object.entries(towOnly)) {
    for (const v of vehicles) {
      const [base, perKm] = towBase[v];
      const m = towMult[svc];
      out.push({ vehicle: v, service: svc, baseFare: Math.round((base * m) / 10) * 10 * 100, includedKm: 5, perKm: Math.round(perKm * (svc === "wheel-lift-towing" ? 1 : m > 1.5 ? 1.25 : 1.1)) * 100, minFare: Math.round((base * m) / 10) * 10 * 100 });
    }
  }
  for (const [svc, byVehicle] of Object.entries(flat)) {
    for (const [v, price] of Object.entries(byVehicle)) out.push({ vehicle: v, service: svc, baseFare: price * 100, includedKm: 0, perKm: 0, minFare: price * 100 });
  }
  return out;
}

const area = (slug: string, city: string, name: string, hi: string, lat: number, lng: number, radiusKm: number, status: "ACTIVE" | "COMING_SOON", pincodes: string, sortOrder: number) => ({
  slug, city, lat, lng, radiusKm, status, pincodes, sortOrder,
  name: l(name, hi),
  description:
    status === "ACTIVE"
      ? l(`24x7 towing, flatbed recovery and roadside assistance in ${name}. Verified drivers, upfront pricing and live tracking.`, `${hi} में 24x7 टोइंग, फ़्लैटबेड रिकवरी और रोडसाइड असिस्टेंस। वेरिफ़ाइड ड्राइवर, तय रेट और लाइव ट्रैकिंग।`)
      : l(`We're launching in ${name} soon. Leave your number to be the first to know.`, `हम ${hi} में जल्द आ रहे हैं। सबसे पहले जानने के लिए अपना नंबर छोड़ें।`),
});

export const areas = [
  area("connaught-place", "Delhi", "Connaught Place & Central Delhi", "कनॉट प्लेस और मध्य दिल्ली", 28.6315, 77.2167, 5.5, "ACTIVE", "110001, 110002", 1),
  area("new-delhi", "Delhi", "New Delhi (Lutyens' Zone)", "नई दिल्ली (लुटियंस ज़ोन)", 28.6129, 77.2295, 5, "ACTIVE", "110003, 110011", 2),
  area("saket", "Delhi", "Saket, Hauz Khas & South Delhi", "साकेत, हौज़ खास और दक्षिण दिल्ली", 28.5355, 77.21, 7.5, "ACTIVE", "110017, 110016", 3),
  area("okhla", "Delhi", "Okhla, Nehru Place & South-East Delhi", "ओखला, नेहरू प्लेस और दक्षिण-पूर्व दिल्ली", 28.5494, 77.25, 6.5, "ACTIVE", "110020, 110019", 4),
  area("lajpat-nagar", "Delhi", "Lajpat Nagar & Defence Colony", "लाजपत नगर और डिफ़ेंस कॉलोनी", 28.5677, 77.2433, 4.5, "ACTIVE", "110024", 5),
  area("laxmi-nagar", "Delhi", "Laxmi Nagar, Preet Vihar & East Delhi", "लक्ष्मी नगर, प्रीत विहार और पूर्वी दिल्ली", 28.635, 77.28, 6.5, "ACTIVE", "110092, 110091", 6),
  area("mayur-vihar", "Delhi", "Mayur Vihar & Patparganj", "मयूर विहार और पटपड़गंज", 28.607, 77.295, 5, "ACTIVE", "110091", 7),
  area("shahdara", "Delhi", "Shahdara & North-East Delhi", "शाहदरा और उत्तर-पूर्वी दिल्ली", 28.68, 77.29, 6.5, "ACTIVE", "110032, 110093", 8),
  area("civil-lines", "Delhi", "Civil Lines, Model Town & North Delhi", "सिविल लाइंस, मॉडल टाउन और उत्तरी दिल्ली", 28.7, 77.2, 6.5, "ACTIVE", "110054, 110009", 9),
  area("rohini", "Delhi", "Rohini, Pitampura & North-West Delhi", "रोहिणी, पीतमपुरा और उत्तर-पश्चिमी दिल्ली", 28.73, 77.11, 8.5, "ACTIVE", "110085, 110034", 10),
  area("narela", "Delhi", "Narela, Bawana & Outer North", "नरेला, बवाना और बाहरी उत्तर", 28.82, 77.1, 8.5, "ACTIVE", "110040, 110039", 11),
  area("janakpuri", "Delhi", "Janakpuri, Rajouri Garden & West Delhi", "जनकपुरी, राजौरी गार्डन और पश्चिमी दिल्ली", 28.64, 77.09, 7.5, "ACTIVE", "110058, 110027", 12),
  area("karol-bagh", "Delhi", "Karol Bagh & Patel Nagar", "करोल बाग और पटेल नगर", 28.6519, 77.19, 4, "ACTIVE", "110005, 110008", 13),
  area("dwarka", "Delhi", "Dwarka & South-West Delhi", "द्वारका और दक्षिण-पश्चिमी दिल्ली", 28.58, 77.05, 9, "ACTIVE", "110075, 110078", 14),
  area("najafgarh", "Delhi", "Najafgarh & Outer West", "नजफ़गढ़ और बाहरी पश्चिम", 28.61, 76.98, 7.5, "ACTIVE", "110043", 15),
  area("vasant-kunj", "Delhi", "Vasant Kunj, Mehrauli & Chhatarpur", "वसंत कुंज, महरौली और छतरपुर", 28.49, 77.18, 7.5, "ACTIVE", "110070, 110030", 16),
  area("sarita-vihar", "Delhi", "Sarita Vihar, Badarpur & Jasola", "सरिता विहार, बदरपुर और जसोला", 28.5, 77.3, 6, "ACTIVE", "110076, 110044", 17),
  area("igi-airport", "Delhi", "IGI Airport & Aerocity", "IGI एयरपोर्ट और एयरोसिटी", 28.5562, 77.1, 4.5, "ACTIVE", "110037", 18),
  area("noida", "Noida", "Noida", "नोएडा", 28.5355, 77.391, 10, "COMING_SOON", "201301, 201304", 30),
  area("gurugram", "Gurugram", "Gurugram", "गुरुग्राम", 28.4595, 77.0266, 12, "COMING_SOON", "122001, 122002", 31),
  area("ghaziabad", "Ghaziabad", "Ghaziabad", "गाज़ियाबाद", 28.6692, 77.4538, 10, "COMING_SOON", "201001", 32),
  area("faridabad", "Faridabad", "Faridabad", "फ़रीदाबाद", 28.4089, 77.3178, 10, "COMING_SOON", "121001", 33),
];

export const faqs = [
  { category: "booking", question: l("How fast will a tow truck reach me?", "टो ट्रक कितनी जल्दी पहुँचेगा?"), answer: l("Our target is about 30 minutes in most parts of Delhi, depending on traffic and driver availability. You'll see an estimated arrival time before you confirm and can track the truck live after assignment.", "दिल्ली के ज़्यादातर हिस्सों में हमारा लक्ष्य लगभग 30 मिनट है, जो ट्रैफ़िक और ड्राइवर की उपलब्धता पर निर्भर है। कन्फ़र्म करने से पहले अनुमानित समय दिखता है और असाइन होने के बाद ट्रक को लाइव ट्रैक कर सकते हैं।") },
  { category: "pricing", question: l("How is the fare calculated?", "रेट कैसे तय होता है?"), answer: l("Each vehicle type and service has a public rate card: a base fare that covers the first few kilometres, then a per-km rate for the towing distance. A night surcharge may apply between 10 pm and 6 am. GST is added at checkout. You see the exact total before you book.", "हर वाहन और सेवा का सार्वजनिक रेट कार्ड है: शुरुआती कुछ किलोमीटर का बेस रेट, फिर टोइंग दूरी पर प्रति किमी रेट। रात 10 से सुबह 6 बजे के बीच रात का अतिरिक्त शुल्क लग सकता है। GST चेकआउट पर जुड़ता है। बुकिंग से पहले कुल रेट साफ़ दिखता है।") },
  { category: "pricing", question: l("Are there any hidden charges?", "क्या कोई छिपा चार्ज है?"), answer: l("No. The fare shown includes everything except tolls/parking you incur (if any) and fuel/parts for on-spot services. Any extra charge is shown to you before it is added.", "नहीं। दिखाए गए रेट में सब शामिल है, सिवाय टोल/पार्किंग (यदि लगे) और मौके की सेवाओं में तेल/पुर्ज़ों के। कोई भी अतिरिक्त चार्ज जोड़ने से पहले आपको बताया जाता है।") },
  { category: "payment", question: l("How do I pay?", "भुगतान कैसे करूँ?"), answer: l("Pay after the service by cash or UPI directly to the driver. Online payment via Razorpay (UPI, cards, netbanking) is coming soon.", "सेवा के बाद ड्राइवर को सीधे कैश या UPI से भुगतान करें। Razorpay (UPI, कार्ड, नेटबैंकिंग) से ऑनलाइन भुगतान जल्द आ रहा है।") },
  { category: "payment", question: l("Do I get a GST invoice?", "क्या GST बिल मिलता है?"), answer: l("Yes. A GST-compliant tax invoice with our GSTIN and SAC code is generated when the service completes and emailed to you. You can also open it from your booking page.", "हाँ। सेवा पूरी होने पर हमारे GSTIN और SAC कोड वाला GST-अनुपालित टैक्स बिल बनता है और ईमेल पर भेजा जाता है। आप इसे बुकिंग पेज से भी खोल सकते हैं।") },
  { category: "safety", question: l("Will my vehicle be safe?", "क्या मेरी गाड़ी सुरक्षित रहेगी?"), answer: l("Yes. We match the right equipment to your vehicle — flatbeds for luxury, low or damaged cars and two-wheelers. Every job starts with a trip PIN that you share only when the driver arrives, and every driver is KYC-verified and rated.", "हाँ। हम आपकी गाड़ी के हिसाब से सही उपकरण भेजते हैं — लग्ज़री, नीची या क्षतिग्रस्त कारों और दोपहिया के लिए फ़्लैटबेड। हर जॉब ट्रिप PIN से शुरू होता है जो आप ड्राइवर के पहुँचने पर ही बताते हैं, और हर ड्राइवर KYC-वेरिफ़ाइड व रेटेड है।") },
  { category: "safety", question: l("Can you tow after an accident?", "क्या दुर्घटना के बाद टो कर सकते हैं?"), answer: l("Yes — choose Accident recovery. Our crews handle damaged and overturned vehicles. We also provide a recovery receipt you can use for your insurance claim. If anyone is injured, call 112 first.", "हाँ — एक्सीडेंट रिकवरी चुनें। हमारी टीम क्षतिग्रस्त और पलटे वाहन संभालती है। बीमा क्लेम के लिए रिकवरी रसीद भी मिलती है। यदि कोई घायल है तो पहले 112 पर कॉल करें।") },
  { category: "booking", question: l("Can I cancel a booking?", "क्या बुकिंग रद्द कर सकता हूँ?"), answer: l("Yes, any time before the service starts. Cancelling before a driver is on the way is free; after that a small cancellation fee may apply. See our Cancellation & Refund Policy.", "हाँ, सेवा शुरू होने से पहले कभी भी। ड्राइवर के रास्ते में आने से पहले रद्द करना मुफ़्त है; उसके बाद थोड़ा रद्दीकरण शुल्क लग सकता है। हमारी कैंसलेशन और रिफ़ंड नीति देखें।") },
  { category: "booking", question: l("Can I schedule a tow for later?", "क्या बाद के लिए टो शेड्यूल कर सकता हूँ?"), answer: l("Yes. In the booking form choose “Schedule for later” and pick a time at least 30 minutes ahead. We dispatch a driver shortly before your slot.", "हाँ। बुकिंग फ़ॉर्म में “बाद के लिए शेड्यूल करें” चुनें और कम से कम 30 मिनट बाद का समय डालें। हम आपके समय से ठीक पहले ड्राइवर भेजते हैं।") },
  { category: "coverage", question: l("Which areas do you cover?", "आप कौन-से इलाके कवर करते हैं?"), answer: l("All zones of Delhi, 24x7. Noida, Gurugram, Ghaziabad and Faridabad are launching soon — you can leave your number on the coverage page to be notified. You can tow from Delhi to a drop outside Delhi (up to 150 km).", "दिल्ली के सभी ज़ोन, 24x7। नोएडा, गुरुग्राम, गाज़ियाबाद और फ़रीदाबाद जल्द शुरू होंगे — सूचना पाने के लिए कवरेज पेज पर नंबर छोड़ें। आप दिल्ली से बाहर (150 किमी तक) ड्रॉप के लिए भी टो करवा सकते हैं।") },
  { category: "booking", question: l("What is the trip PIN?", "ट्रिप PIN क्या है?"), answer: l("When you book we give you a 4-digit PIN. Share it with the driver only when they arrive — entering it starts the service. This stops anyone else from claiming your job.", "बुकिंग पर हम आपको 4 अंकों का PIN देते हैं। ड्राइवर के पहुँचने पर ही उसे बताएँ — इसे डालने पर सेवा शुरू होती है। इससे कोई और आपका जॉब नहीं ले सकता।") },
  { category: "partners", question: l("I own a tow truck. How do I join?", "मेरे पास टो ट्रक है। कैसे जुड़ूँ?"), answer: l("Open the Partner page, apply as an independent driver or a company, and our team will verify your documents. After approval you e-sign the partner agreement and can go online immediately.", "पार्टनर पेज खोलें, स्वतंत्र ड्राइवर या कंपनी के रूप में आवेदन करें, हमारी टीम आपके दस्तावेज़ जाँचेगी। अनुमोदन के बाद पार्टनर अनुबंध ई-साइन करें और तुरंत ऑनलाइन हो सकते हैं।") },
];

const legalCommon = `**Important:** This document is a template provided with the platform and must be reviewed and adapted by qualified legal counsel before you rely on it.`;

export const pages = [
  {
    slug: "terms-of-service",
    title: l("Terms of Service", "सेवा की शर्तें"),
    body: l(
      `${legalCommon}

## 1. About these terms
These Terms govern your use of the {{brand}} website, apps and towing / roadside-assistance services (the "Services") operated by **{{legalEntity}}** ("{{brand}}", "we", "us"). By booking or using the Services you agree to these Terms.

## 2. Our role
{{brand}} is a technology platform that connects customers with independent tow-truck operators and fleet companies ("Partners") who perform the physical service. Partners are independent contractors, not employees of {{brand}}.

## 3. Bookings and pricing
- Fares are calculated from the published rate card, the pickup and drop locations, time of day and applicable taxes, and are shown before you confirm.
- GST is charged as per applicable law and itemised on your tax invoice.
- Tolls, parking, fuel and spare parts (where applicable) are charged at actuals.
- We may refuse or cancel a booking where the location is unsafe, outside our service area, or the information provided is inaccurate.

## 4. Your responsibilities
- Provide accurate vehicle, location and contact information.
- Be present (or have an authorised representative) at pickup and share your trip PIN only with the driver at the vehicle.
- Remove valuables from the vehicle. We are not responsible for personal belongings left inside.
- You confirm that you are the owner or authorised person for the vehicle being towed.

## 5. Payment
Payment is due on completion of the service by cash or UPI to the driver, or online where enabled. An invoice is issued for every completed booking.

## 6. Cancellations
See our Cancellation & Refund Policy.

## 7. Vehicle handling and liability
Partners are required to handle vehicles with reasonable care using appropriate equipment. If your vehicle is damaged due to a Partner's negligence, report it to us within 24 hours with photographs; we will investigate and help resolve the claim in accordance with the Partner agreement and applicable insurance. Pre-existing damage, mechanical failure or unsecured items are excluded. To the maximum extent permitted by law, our aggregate liability is limited to the fare paid for the affected booking.

## 8. Acceptable use
You must not misuse the Services, make false bookings, harass Partners, or attempt to circumvent the platform.

## 9. Governing law
These Terms are governed by the laws of India. Courts at New Delhi have exclusive jurisdiction.

## 10. Contact
Questions: [{{supportEmail}}](mailto:{{supportEmail}}) · {{phone}} · {{address}}.

*Last updated: {{updated}}*`,
      `**महत्वपूर्ण:** यह दस्तावेज़ प्लेटफ़ॉर्म के साथ दिया गया टेम्पलेट है; इस पर निर्भर होने से पहले योग्य कानूनी सलाहकार से जाँच व संशोधन ज़रूर करवाएँ।

## 1. इन शर्तों के बारे में
ये शर्तें **{{legalEntity}}** ("{{brand}}", "हम") द्वारा संचालित {{brand}} वेबसाइट, ऐप और टोइंग / रोडसाइड-असिस्टेंस सेवाओं ("सेवाएँ") के उपयोग को नियंत्रित करती हैं। बुकिंग या उपयोग करने पर आप इन शर्तों से सहमत होते हैं।

## 2. हमारी भूमिका
{{brand}} एक टेक्नोलॉजी प्लेटफ़ॉर्म है जो ग्राहकों को स्वतंत्र टो-ट्रक ऑपरेटरों और फ़्लीट कंपनियों ("पार्टनर") से जोड़ता है। पार्टनर स्वतंत्र ठेकेदार हैं, {{brand}} के कर्मचारी नहीं।

## 3. बुकिंग और रेट
- रेट प्रकाशित रेट कार्ड, पिकअप-ड्रॉप, समय और लागू करों के आधार पर बनता है और कन्फ़र्म करने से पहले दिखता है।
- GST कानून के अनुसार लगता है और टैक्स बिल में अलग दिखता है।
- टोल, पार्किंग, तेल और पुर्ज़े (जहाँ लागू) वास्तविक खर्च पर।

## 4. आपकी ज़िम्मेदारियाँ
- सही वाहन, लोकेशन और संपर्क जानकारी दें।
- पिकअप पर मौजूद रहें और ट्रिप PIN केवल वाहन पर ड्राइवर को बताएँ।
- वाहन से कीमती सामान निकाल लें।

## 5. भुगतान
सेवा पूरी होने पर ड्राइवर को कैश/UPI से भुगतान करें, या जहाँ उपलब्ध हो ऑनलाइन। हर पूरी बुकिंग पर बिल जारी होता है।

## 6. वाहन की देखभाल और दायित्व
पार्टनर को उचित उपकरण से वाहन की उचित देखभाल करनी होती है। नुकसान की स्थिति में 24 घंटे के भीतर फ़ोटो सहित सूचित करें। हमारी अधिकतम देयता संबंधित बुकिंग के रेट तक सीमित है।

## 7. लागू कानून
ये शर्तें भारतीय कानून से शासित हैं; नई दिल्ली की अदालतों का विशेष क्षेत्राधिकार है।

*अंतिम अपडेट: {{updated}}*`,
    ),
  },
  {
    slug: "privacy-policy",
    title: l("Privacy Policy", "गोपनीयता नीति"),
    body: l(
      `${legalCommon}

## What we collect
- **Account data:** name, email address, mobile number.
- **Booking data:** pickup and drop locations, vehicle details, notes, payment method and status.
- **Partner data:** identity, licence, vehicle, bank/UPI and KYC documents (for partners only).
- **Device & usage data:** IP address, browser, pages visited, approximate and (for drivers) precise location while online.

## How we use it
To provide and dispatch the Services, verify identity with one-time codes, process payments and issue GST invoices, keep the platform safe, provide support, and improve the product. We send transactional emails/SMS about your bookings.

## Who we share it with
- The assigned Partner (name, phone, pickup/drop and vehicle details) so they can complete the job.
- Service providers acting on our behalf (email/SMS delivery, maps, payment gateway, hosting).
- Authorities where required by law.
We do not sell your personal data.

## Location
Customers choose the locations they submit. Drivers share live location only while online.

## Retention & security
We keep data only as long as needed for the purposes above and to meet legal and tax obligations (for example, invoices for the period required by law). We use encryption in transit, hashed one-time codes, access controls and audit logs.

## Your rights
You may request access, correction or deletion of your personal data, and withdraw consent, by writing to [{{supportEmail}}](mailto:{{supportEmail}}). We respond in line with the Digital Personal Data Protection Act, 2023.

## Grievance officer
See our Grievance Redressal page.

*Last updated: {{updated}}*`,
      `**महत्वपूर्ण:** यह टेम्पलेट है; उपयोग से पहले कानूनी सलाहकार से जाँच करवाएँ।

## हम क्या एकत्र करते हैं
- **खाता जानकारी:** नाम, ईमेल, मोबाइल नंबर।
- **बुकिंग जानकारी:** पिकअप-ड्रॉप लोकेशन, वाहन विवरण, भुगतान की स्थिति।
- **पार्टनर जानकारी:** पहचान, लाइसेंस, वाहन, बैंक/UPI और KYC दस्तावेज़।
- **डिवाइस व उपयोग डेटा:** IP, ब्राउज़र, देखे गए पेज, और ड्राइवर के ऑनलाइन रहते लोकेशन।

## उपयोग
सेवा देने, OTP से पहचान सत्यापन, भुगतान व GST बिल, सुरक्षा, सहायता और सुधार के लिए।

## किसके साथ साझा
असाइन किए गए पार्टनर के साथ (नाम, फ़ोन, पिकअप-ड्रॉप), हमारी ओर से काम करने वाले सेवा प्रदाताओं के साथ, और कानून द्वारा आवश्यक होने पर अधिकारियों के साथ। हम आपका डेटा बेचते नहीं।

## आपके अधिकार
पहुँच, सुधार या विलोपन के लिए [{{supportEmail}}](mailto:{{supportEmail}}) पर लिखें। हम डिजिटल पर्सनल डेटा प्रोटेक्शन अधिनियम, 2023 के अनुसार जवाब देते हैं।

*अंतिम अपडेट: {{updated}}*`,
    ),
  },
  {
    slug: "cancellation-refund-policy",
    title: l("Cancellation & Refund Policy", "कैंसलेशन और रिफ़ंड नीति"),
    body: l(
      `${legalCommon}

## Customer cancellations
- **Before a driver is assigned:** free, any time.
- **After assignment, before the driver is en route:** free.
- **Driver en route or arrived:** a cancellation fee (shown in the booking page, currently configurable by {{brand}}) may apply to compensate the driver's time and fuel.
- **Once service has started:** the booking can't be cancelled; the fare for work done is payable.

## Cancellations by {{brand}} or the Partner
If we cannot assign a driver, or a driver cancels, you are not charged. We'll try to reassign immediately.

## Refunds
- Online payments (when enabled) are refunded to the original payment method within 5–7 working days after a valid cancellation or a service failure.
- Cash payments have no refund; disputes are handled as credits or bank transfers after review.

## Disputes
Raise any concern within 48 hours of the service at [{{supportEmail}}](mailto:{{supportEmail}}) with your booking code.

*Last updated: {{updated}}*`,
      `## ग्राहक द्वारा रद्दीकरण
- **ड्राइवर असाइन होने से पहले:** मुफ़्त, कभी भी।
- **असाइन के बाद, ड्राइवर के रास्ते में आने से पहले:** मुफ़्त।
- **ड्राइवर रास्ते में या पहुँच चुका:** ड्राइवर के समय और तेल की भरपाई के लिए रद्दीकरण शुल्क (बुकिंग पेज पर दिखता है) लग सकता है।
- **सेवा शुरू होने के बाद:** बुकिंग रद्द नहीं हो सकती; किए गए काम का रेट देय है।

## {{brand}} या पार्टनर द्वारा रद्दीकरण
यदि हम ड्राइवर असाइन नहीं कर पाएँ या ड्राइवर रद्द करे, तो आपसे कोई शुल्क नहीं लिया जाता।

## रिफ़ंड
ऑनलाइन भुगतान (जब चालू हो) का रिफ़ंड वैध रद्दीकरण/सेवा विफलता के 5–7 कार्यदिवस में मूल भुगतान माध्यम में। कैश भुगतान में रिफ़ंड नहीं; विवाद समीक्षा के बाद क्रेडिट/बैंक ट्रांसफ़र से सुलझाए जाते हैं।

## विवाद
सेवा के 48 घंटे के भीतर बुकिंग कोड के साथ [{{supportEmail}}](mailto:{{supportEmail}}) पर लिखें।

*अंतिम अपडेट: {{updated}}*`,
    ),
  },
  {
    slug: "grievance-redressal",
    title: l("Grievance Redressal", "शिकायत निवारण"),
    body: l(
      `If you have a complaint about a booking, a Partner or how your data is handled, we want to fix it quickly.

## Grievance Officer
**Name:** Grievance Officer, {{brand}}
**Email:** [{{supportEmail}}](mailto:{{supportEmail}})
**Phone:** {{phone}}
**Address:** {{address}}

## Process
1. Write to us with your booking code and a description of the issue.
2. We acknowledge within 48 hours.
3. We aim to resolve within 15 days (or as required by applicable law).

*Last updated: {{updated}}*`,
      `बुकिंग, पार्टनर या डेटा से जुड़ी कोई भी शिकायत हो तो हम उसे जल्दी सुलझाना चाहते हैं।

## शिकायत अधिकारी
**नाम:** शिकायत अधिकारी, {{brand}}
**ईमेल:** [{{supportEmail}}](mailto:{{supportEmail}})
**फ़ोन:** {{phone}}
**पता:** {{address}}

## प्रक्रिया
1. बुकिंग कोड और समस्या के विवरण के साथ हमें लिखें।
2. हम 48 घंटे में पावती देते हैं।
3. हम 15 दिनों में (या लागू कानून के अनुसार) समाधान का लक्ष्य रखते हैं।

*अंतिम अपडेट: {{updated}}*`,
    ),
  },
  {
    slug: "partner-agreement",
    title: l("Partner Agreement (Overview)", "पार्टनर अनुबंध (सारांश)"),
    body: l(
      `${legalCommon}

This page summarises the agreement you e-sign when you join {{brand}} as a Partner. The full, personalised agreement is generated for you after your application is approved.

## Two kinds of partners
- **Independent driver** – you own/operate your tow truck and drive it.
- **Fleet company** – you operate multiple trucks and add your own drivers to the platform.

## Key terms
- **Independent contractor:** you are not an employee of {{brand}}.
- **Commission:** {{brand}} deducts an agreed platform commission on the taxable value of each completed job. The exact percentage is written in your agreement.
- **Settlements:** earnings accrue in your ledger and are settled to your bank / UPI on a weekly cycle. For cash jobs, you collect the full fare from the customer and owe {{brand}} the commission and GST collected.
- **Compliance:** valid licence, RC, insurance, permits and fitness certificates must be kept up to date.
- **Conduct:** professional behaviour, trip-PIN verification, careful handling and no off-platform solicitation of {{brand}} customers.
- **Insurance & liability:** you are responsible for damage caused by your negligence; maintain adequate cover.
- **Termination:** either party may terminate with notice; {{brand}} may suspend immediately for safety or fraud.
- **Governing law:** India; courts at New Delhi.

## Ready to join?
[Apply as a partner](/en/partner).

*Last updated: {{updated}}*`,
      `**महत्वपूर्ण:** यह टेम्पलेट है; उपयोग से पहले कानूनी सलाहकार से जाँच करवाएँ।

जब आप {{brand}} से पार्टनर के रूप में जुड़ते हैं तो जिस अनुबंध पर ई-साइन करते हैं, यह पेज उसका सारांश है। आवेदन स्वीकृत होने के बाद आपके लिए पूरा व्यक्तिगत अनुबंध बनता है।

## दो तरह के पार्टनर
- **स्वतंत्र ड्राइवर** – आप खुद टो ट्रक के मालिक/चालक हैं।
- **फ़्लीट कंपनी** – आप कई ट्रक चलाते हैं और अपने ड्राइवर प्लेटफ़ॉर्म पर जोड़ते हैं।

## मुख्य शर्तें
- **स्वतंत्र ठेकेदार:** आप {{brand}} के कर्मचारी नहीं हैं।
- **कमीशन:** हर पूरे जॉब के कर-योग्य मूल्य पर तय प्लेटफ़ॉर्म कमीशन कटता है; प्रतिशत आपके अनुबंध में लिखा होता है।
- **सेटलमेंट:** कमाई आपके खाते में जमा होती है और साप्ताहिक चक्र में बैंक/UPI में सेटल होती है। कैश जॉब में पूरा रेट आप ग्राहक से लेते हैं और कमीशन व GST {{brand}} को देते हैं।
- **अनुपालन:** लाइसेंस, RC, बीमा, परमिट और फ़िटनेस प्रमाणपत्र अद्यतन रखें।
- **आचरण:** पेशेवर व्यवहार, ट्रिप-PIN सत्यापन, सावधानी से हैंडलिंग।
- **समाप्ति:** कोई भी पक्ष सूचना देकर समाप्त कर सकता है।
- **कानून:** भारत; नई दिल्ली की अदालतें।

[पार्टनर के रूप में आवेदन करें](/hi/partner)।

*अंतिम अपडेट: {{updated}}*`,
    ),
  },
];

const commonContract = (party: "INDIVIDUAL" | "COMPANY") => `${legalCommon}

# {{party}} Agreement

**Agreement reference:** {{contractRef}}
**Date:** {{date}}

This Agreement is made between:

1. **{{legalEntity}}**, with GSTIN {{companyGstin}} and its office at {{companyAddress}} (the "Platform" or "{{brand}}"); and
2. **{{providerName}}**, ${party === "COMPANY" ? "a business entity" : "an individual"} with GSTIN/Tax status: {{providerGstin}}, residing / registered at {{providerAddress}}, email {{providerEmail}}, phone {{providerPhone}} (the "Partner").

## 1. Appointment and nature of relationship
1.1 The Platform appoints the Partner on a non-exclusive basis to provide towing, recovery and roadside-assistance services ("Services") to customers who book through the Platform.
1.2 The Partner is an independent contractor. Nothing in this Agreement creates an employment, agency or partnership relationship. The Partner is solely responsible for its own taxes, statutory dues and personnel.
${party === "COMPANY" ? "1.3 The Partner may add its own employed or engaged drivers to the Platform. The Partner is fully responsible for those drivers' conduct, licences, KYC, wages and compliance, and for all acts and omissions in the course of Services.\n" : ""}
## 2. Eligibility and compliance
2.1 The Partner shall at all times hold and maintain valid: driving licence(s) of the right class, vehicle registration certificates, insurance, permits, fitness and pollution certificates, and any licence legally required to operate recovery vehicles.
2.2 The Partner shall upload accurate documents and promptly notify the Platform of any expiry, suspension or change.
2.3 The Platform may verify documents and may suspend the Partner where documents are invalid or expired.

## 3. Performing the Services
3.1 The Partner may go online or offline at will; once a job is accepted the Partner must complete it professionally or notify the Platform immediately.
3.2 The Partner shall use equipment appropriate for the customer's vehicle, handle vehicles with due care, and secure them properly.
3.3 At pickup the Partner shall verify the customer's **trip PIN** before starting the Services.
3.4 The Partner shall not solicit Platform customers to transact outside the Platform, overcharge, or demand any amount beyond the fare shown in the booking (except genuine tolls, parking, fuel or parts agreed in writing with the customer).
3.5 The Partner shall behave respectfully, not operate under the influence of alcohol or drugs, and follow all traffic and safety laws.

## 4. Fees, commission and payment
4.1 Fares are determined by the Platform's published rate cards and shown to the customer. The Partner accepts these fares.
4.2 The Platform shall deduct a commission of **{{commissionPct}}%** of the taxable value (fare excluding GST) of each completed job ("Commission").
4.3 **Online-paid jobs:** the Platform collects the fare and credits the Partner's ledger with taxable value less Commission, settled on a weekly cycle to the Partner's declared bank account / UPI ID.
4.4 **Cash / pay-after-service jobs:** the Partner collects the full fare (including GST) from the customer and shall pay the Platform the Commission and the GST collected through the settlement cycle; the Platform may set these off against online earnings.
4.5 GST on the Services to the customer is invoiced by the Platform. The Partner is responsible for any tax obligations on its own earnings, and shall provide a valid PAN${party === "COMPANY" ? " and GSTIN (if registered)" : ""}.
4.6 Tax deducted at source (if applicable) will be withheld as per law.

## 5. Insurance and liability
5.1 The Partner shall maintain adequate insurance for its vehicles, goods-in-tow cover where available, and third-party liability.
5.2 The Partner is liable for loss or damage to a customer's vehicle or property caused by its negligence or breach. The Platform may facilitate claim resolution and may recover amounts paid to customers from Partner settlements.
5.3 The Partner shall indemnify the Platform against claims, fines and losses arising from the Partner's acts, omissions or breach of law.

## 6. Ratings, quality and suspension
6.1 Customers may rate Partners. Repeated low ratings, cancellations, complaints or safety violations may lead to warnings, suspension or termination.
6.2 The Platform may suspend a Partner immediately for suspected fraud, safety risk or serious breach.

## 7. Data protection and confidentiality
7.1 The Partner shall use customer data only to perform the Services and shall not retain or share it afterwards.
7.2 The Partner consents to share its live location with the Platform while online and to the processing of its KYC data for verification and settlement.
7.3 Each party shall keep the other's non-public business information confidential.

## 8. Intellectual property
The Platform's name, logo and software remain its property. The Partner may display the Platform's branding only as permitted in writing.

## 9. Term and termination
9.1 This Agreement starts on the date of e-signature and continues until terminated.
9.2 Either party may terminate on 15 days' written notice (email suffices). The Platform may terminate or suspend immediately under clauses 2.3 and 6.2.
9.3 Pending settlements for completed jobs survive termination.

## 10. Limitation of liability
To the extent permitted by law, the Platform is not liable for indirect or consequential losses. The Platform's aggregate liability to the Partner is limited to the amounts payable to the Partner for the preceding 30 days.

## 11. General
11.1 **Governing law and disputes:** laws of India; the parties shall first try to settle disputes amicably, failing which the courts at New Delhi have exclusive jurisdiction.
11.2 **Entire agreement:** this Agreement and the Platform's published policies form the entire agreement. The Platform may update policies with notice; continued use means acceptance.
11.3 **Electronic execution:** the Partner agrees that typing its name and verifying a one-time code sent to its registered email constitutes a valid electronic signature under the Information Technology Act, 2000. The Platform records the time, IP address and method of signature.

*By signing below, the Partner confirms it has read, understood and agrees to this Agreement.*`;

export const contractTemplates = [
  { party: "INDIVIDUAL" as const, version: 1, title: l("Independent Driver Partner Agreement", "स्वतंत्र ड्राइवर पार्टनर अनुबंध"), body: l(commonContract("INDIVIDUAL"), "") },
  { party: "COMPANY" as const, version: 1, title: l("Fleet Partner (Company) Agreement", "फ़्लीट पार्टनर (कंपनी) अनुबंध"), body: l(commonContract("COMPANY"), "") },
];

export const testimonials = [
  { name: "Sample customer", locality: "South Delhi", rating: 5, text: l("Replace this with a real customer review from the admin panel.", "इसे एडमिन पैनल से किसी असली ग्राहक रिव्यू से बदलें।"), isActive: false, sortOrder: 1 },
];
