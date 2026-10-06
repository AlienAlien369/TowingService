import {
  Anchor, BatteryCharging, Bike, Bus, Car, CarFront, CircleDot, Container, Fuel, KeyRound, Siren, Truck, TriangleAlert, Wrench, Forklift, Cog, Zap, ShieldCheck, Wind,
  type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";

export const ICONS: Record<string, ComponentType<LucideProps>> = {
  car: Car,
  suv: CarFront,
  bike: Bike,
  truck: Truck,
  heavy: Container,
  bus: Bus,
  flatbed: Truck,
  wheellift: Cog,
  hook: Anchor,
  accident: Siren,
  breakdown: TriangleAlert,
  battery: BatteryCharging,
  tyre: CircleDot,
  fuel: Fuel,
  lockout: KeyRound,
  wrench: Wrench,
  crane: Forklift,
  zap: Zap,
  shield: ShieldCheck,
  wind: Wind,
};

export const ICON_OPTIONS = Object.keys(ICONS).map((k) => ({ value: k, label: k }));

export function Icon({ name, ...p }: { name: string } & LucideProps) {
  const C = ICONS[name] ?? Truck;
  return <C aria-hidden {...p} />;
}
