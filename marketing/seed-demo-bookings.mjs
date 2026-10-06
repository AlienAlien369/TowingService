// Inserts two realistic demo bookings (one en-route, one completed with a GST invoice) for filming.
// Usage: DATABASE_URL=<demo branch> node marketing/seed-demo-bookings.mjs
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const q = async (sql, p = []) => (await client.query(sql, p)).rows;

const [vt] = await q(`select id from "VehicleType" where slug='car'`);
const [sv] = await q(`select id from "Service" where slug='flatbed-towing'`);
const [drv] = await q(`select id from "Driver" where email='driver.cp@demo.test'`);
if (!vt || !sv || !drv) throw new Error("run the demo seed first");

const fare = { distanceKm: 12.8, billableKm: 7.8, baseFare: 130000, distanceCharge: 25740, minFareTopUp: 0, nightSurcharge: 38935, surgeSurcharge: 0, isNight: true, subtotal: 194700, gstRatePct: 18, gstAmount: 35000, total: 229700 };
const now = Date.now();
const ago = (m) => new Date(now - m * 60_000).toISOString();

async function booking(id, code, status, pin, driverId, createdMin, extra = {}) {
  await q(
    `insert into "Booking"(id,code,"contactName","contactPhone","contactEmail","vehicleTypeId","serviceId","vehicleNumber","vehicleDetails","pickupAddress","pickupLat","pickupLng","dropAddress","dropLat","dropLng","distanceKm","durationMin",fare,subtotal,"gstAmount",total,"paymentMethod","paymentStatus",status,"startPin","driverId","assignedAt","completedAt","createdAt","updatedAt")
     values ($1,$2,'Aarav Mehta','+919876501234','aarav@example.com',$3,$4,'DL 3C AB 1234','White Hyundai i20','Connaught Place, New Delhi, 110001',28.6315,77.2167,'Saket, South Delhi, 110017',28.5355,77.21,12.8,34,$5,194700,35000,229700,'CASH',$6,$7,$8,$9,$10,$11,$12,now())`,
    [id, code, vt.id, sv.id, JSON.stringify(fare), extra.paid ? "PAID" : "UNPAID", status, pin, driverId, ago(createdMin - 3), extra.completedAt ?? null, ago(createdMin)],
  );
}
async function events(bookingId, list) {
  for (const [status, actor, note, minAgo] of list)
    await q(`insert into "BookingEvent"(id,"bookingId",status,"actorType",note,"createdAt") values ($1,$2,$3,$4,$5,$6)`, [`ev_${bookingId}_${status}_${minAgo}`, bookingId, status, actor, note, ago(minAgo)]);
}

await q(`delete from "BookingEvent" where "bookingId" in ('bk_demo_live','bk_demo_done'); delete from "LedgerEntry" where "bookingId" in ('bk_demo_live','bk_demo_done'); delete from "Invoice" where "bookingId" in ('bk_demo_live','bk_demo_done'); delete from "Booking" where id in ('bk_demo_live','bk_demo_done')`);

// live, en-route booking (tracking page + dispatch board)
await booking("bk_demo_live", "RS-7K3M9Q2A", "EN_ROUTE", "4821", drv.id, 9);
await events("bk_demo_live", [["PENDING_DISPATCH", "CUSTOMER", "Booking created", 9], ["OFFERED", "SYSTEM", "Round 1: offered to 3 driver(s)", 8], ["ASSIGNED", "DRIVER", "Driver accepted the job", 6], ["EN_ROUTE", "DRIVER", null, 4]]);
await q(`update "Driver" set "lastLat"=28.6203,"lastLng"=77.2141,"lastSeenAt"=now(),"isOnline"=true where id=$1`, [drv.id]);

// completed booking with GST invoice
const doneAt = ago(60);
await booking("bk_demo_done", "RS-4TN8Q5WD", "COMPLETED", "7305", drv.id, 130, { paid: true, completedAt: doneAt });
await events("bk_demo_done", [["PENDING_DISPATCH", "CUSTOMER", "Booking created", 130], ["ASSIGNED", "DRIVER", "Driver accepted the job", 126], ["EN_ROUTE", "DRIVER", null, 122], ["ARRIVED", "DRIVER", null, 108], ["IN_PROGRESS", "DRIVER", null, 104], ["COMPLETED", "DRIVER", null, 60]]);
await q(`insert into "Payment"(id,"bookingId",method,status,amount,"updatedAt") values ('pay_demo','bk_demo_done','CASH','PAID',229700,now()) on conflict do nothing`);
const lines = [{ description: "Flatbed towing – Car (Hatchback / Sedan): base fare", amount: 130000 }, { description: "Distance charge (7.8 km beyond included)", amount: 25740 }, { description: "Night service surcharge", amount: 38935 }, { description: "Rounding", amount: 25 }];
await q(
  `insert into "Invoice"(id,number,"bookingId","issuedAt",seller,buyer,"lineItems","sacCode","placeOfSupply","taxableValue",cgst,sgst,igst,total)
   values ('inv_demo','RS/2026-27/000001','bk_demo_done',now(),$1,$2,$3,'996799','Delhi (07)',194700,17500,17500,0,229700)
   on conflict ("bookingId") do nothing`,
  [
    JSON.stringify({ legalName: "RoadSaathi Mobility Private Limited", gstin: "07AAAAA0000A1Z5", pan: "AAAAA0000A", address: "Plot 12, Okhla Industrial Estate, Phase III, New Delhi, Delhi 110020", stateName: "Delhi", stateCode: "07", phone: "+91 11 4000 0000", email: "help@roadsaathi.example", footer: "This is a computer generated invoice and does not require a signature." }),
    JSON.stringify({ name: "Aarav Mehta", phone: "+919876501234", email: "aarav@example.com", address: "Connaught Place, New Delhi, 110001", stateName: "Delhi", stateCode: "07" }),
    JSON.stringify(lines),
  ],
);
await q(`insert into "LedgerEntry"(id,"bookingId","driverId",gross,commission,net,status) values ('led_demo','bk_demo_done',$1,229700,38940,155760,'PENDING') on conflict do nothing`, [drv.id]);
await q(`insert into "InvoiceCounter"(fy,seq) values ('2026-27',1) on conflict (fy) do update set seq=1`);
await client.end();
console.log("demo bookings ready");
