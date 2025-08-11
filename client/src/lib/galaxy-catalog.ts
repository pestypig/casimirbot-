import { Body } from "./galaxy-schema";

export const BODIES: Body[] = [
  { id: "SOL", name: "Sol / Local Bubble", x_pc: 0, y_pc: 0, kind:"station" },
  { id: "ORI_OB1", name: "Orion OB1", x_pc: 400, y_pc: -120, kind:"ob-assoc" },
  { id: "VEL_OB2", name: "Vela OB2", x_pc: -160, y_pc: -280, kind:"ob-assoc" },
  { id: "BETEL", name: "Betelgeuse", x_pc: 197, y_pc: -31, kind:"star" },
  { id: "CAS_A", name: "Cassiopeia A (SNR)", x_pc: -1000, y_pc: 900, kind:"snr" },
  { id: "VELA_SNR", name: "Vela Supernova Remnant", x_pc: -150, y_pc: -250, kind:"snr" },
  { id: "CYGNUS_OB2", name: "Cygnus OB2", x_pc: 1400, y_pc: 600, kind:"ob-assoc" },
  { id: "PERSEUS_ARM", name: "Perseus Arm", x_pc: -800, y_pc: 1200, kind:"nebula" },
  { id: "SAGITTARIUS_ARM", name: "Sagittarius Arm", x_pc: 600, y_pc: -800, kind:"nebula" },
  { id: "LOCAL_ARM", name: "Local Arm (Orion Spur)", x_pc: 200, y_pc: 0, kind:"nebula" },
];