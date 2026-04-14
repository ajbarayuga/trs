import { QuoteFormSchema } from "@/schema/quote";
import { calculateSOW } from "@/lib/calculateSOW";

type Case = {
  name: string;
  expected: number;
  input: Record<string, unknown>;
};

const cases: Case[] = [
  {
    name: "INDOOR SOUNDSYSTEM",
    expected: 954.8,
    input: {
      eventType: "live",
      organization: "Emory",
      hasDuration: true,
      durationHours: 1,
      setting: "indoor",
      audioServices: ["pa"],
      services: [],
      builtInAV: [],
    },
  },
  {
    name: "OUTDOOR SOUNDSYSTEM",
    expected: 1167.18,
    input: {
      eventType: "live",
      organization: "Emory",
      hasDuration: true,
      durationHours: 1.5,
      setting: "outdoor",
      audioServices: ["pa"],
      services: [],
      builtInAV: [],
    },
  },
  {
    name: "LIVE STREAMING",
    expected: 2780.06,
    input: {
      eventType: "live",
      organization: "Emory",
      hasDuration: true,
      durationHours: 1.5,
      services: ["streaming"],
      audioServices: [],
      cameraSource: "bring",
      cameraCount: "1",
      streamGraphics: true,
      diyStream: false,
      builtInAV: [],
    },
  },
  {
    name: "VIDEO RECORDING",
    expected: 1121.23,
    input: {
      eventType: "live",
      organization: "Emory",
      hasDuration: true,
      durationHours: 1,
      services: ["video"],
      videoTypes: ["lecture"],
      lecturePPT: true,
      lectureTalksCount: 1,
      audioServices: [],
      builtInAV: [],
    },
  },
];

const round4 = (n: number) => Math.round(n * 10000) / 10000;
const round2 = (n: number) => Math.round(n * 100) / 100;

let failures = 0;
for (const c of cases) {
  const data = QuoteFormSchema.parse(c.input);
  const { items } = calculateSOW(data);
  const total = items.reduce((sum, i) => sum + i.total, 0);
  const delta = round2(total) - round2(c.expected);
  const ok = Math.abs(delta) < 0.005;
  if (!ok) failures += 1;

  console.log(`\n=== ${c.name} ===`);
  console.log(`expected: ${c.expected.toFixed(2)}`);
  console.log(`actual:   ${round2(total).toFixed(2)}`);
  console.log(`delta:    ${delta.toFixed(2)} ${ok ? "PASS" : "FAIL"}`);
  for (const item of items) {
    console.log(
      ` - ${item.name} | qty ${item.quantity} ${item.unit} | rate ${item.rate} | total ${item.total}`,
    );
  }
}

if (failures > 0) {
  process.exitCode = 1;
}
