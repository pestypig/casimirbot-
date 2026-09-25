import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const workspaceDir = process.env.WORKSPACE_DIR;
const SKILL_DIR = process.env.SKILL_DIR;
const RUNTIME_PYTHON = process.env.RUNTIME_PYTHON;
if (![workspaceDir, SKILL_DIR, RUNTIME_PYTHON].every((x) => x && path.isAbsolute(x))) {
  throw new Error("Absolute WORKSPACE_DIR, SKILL_DIR, and RUNTIME_PYTHON required");
}
const { resolvePresentationFont, finalizePresentation } = await import(
  pathToFileURL(path.join(SKILL_DIR, "container_tools/artifact_tool_utils.mjs")).href
);
const family = resolvePresentationFont();
const report = JSON.parse(await fs.readFile(path.join(workspaceDir, "docs/research/ytterbium-clock-proposal-calculations.json"), "utf8"));
const coverImage = new Uint8Array(await fs.readFile(path.join(workspaceDir, "docs/research/assets/ytterbium-clock-tower-concept.png")));
const ppt = Presentation.create({ slideSize: { width: 1280, height: 720 } });
const C = { navy: "#102238", ink: "#172C3D", teal: "#087F8C", gray: "#536778", pale: "#EDF5F7", white: "#FFFFFF", gold: "#D9AF58" };
const src = {
  shared: "https://chatgpt.com/share/6ab672dc-e820-83ea-a2a5-26643690422a",
  bipm: "https://www.bipm.org/documents/20126/288516347/171Yb_518THz_2025/73007ecc-49f5-4d1d-d8ee-6793a4748598",
  tokyo: "https://www.t.u-tokyo.ac.jp/en/press/foee/press/setnws_202004071409047419337571.html",
  entangled: "https://www.nature.com/articles/s41586-022-05088-z",
  architecture: "https://www.nature.com/articles/s41534-024-00898-7",
  qep: "https://www.nature.com/articles/s41567-018-0197-6",
};
function textbox(slide, value, pos, size=25, color=C.ink, bold=false) {
  const s=slide.shapes.add({geometry:"textbox",position:pos,fill:"none",line:{fill:"none",width:0}});
  s.text=value;
  s.text.style={typeface:family,fontSize:size,color,bold,autoFit:"none",verticalAlignment:"middle"};
  return s;
}
function base(title, note="") {
  const slide=ppt.slides.add();
  slide.background.fill=C.white;
  textbox(slide,title,{left:64,top:37,width:1145,height:71},36,C.navy,true);
  if(note) slide.speakerNotes.textFrame.setText(note);
  return slide;
}
function para(slide,text,top,height=170,size=25,left=74,width=1115) {
  textbox(slide,text,{left,top,width,height},size,C.ink,false);
}
function small(slide,text,top,height=50) {
  textbox(slide,text,{left:74,top,width:1115,height},19,C.gray,false);
}
function table(slide, values, top, height, widths) {
  const t=slide.tables.add({rows:values.length,columns:values[0].length,left:74,top,width:1132,height,values,columnWidths:widths});
  t.styleOptions={headerRow:true,bandedRows:false};
  t.borders.assign({style:"solid",fill:"#D7E3E9",width:1});
  for(let r=0;r<values.length;r++) for(let c=0;c<values[0].length;c++) {
    const cell=t.getCell(r,c);
    cell.fill=r===0?C.navy:(r%2?"#F3F8F9":C.white);
    cell.text.style={typeface:family,fontSize:r===0?20:22,color:r===0?C.white:C.ink,bold:r===0};
  }
  return t;
}
function notes(slide, lines) { slide.speakerNotes.textFrame.setText(lines.join("\n")); }
const byH=(h)=>report.rows.find((r)=>r.heightDifferenceM===h);

{
  const slide=ppt.slides.add(); slide.background.fill=C.navy;
  slide.images.add({blob:coverImage,contentType:"image/png",fit:"cover",position:{left:0,top:0,width:1280,height:720},alt:"Conceptual illustration of two stationary clock stations in a terrestrial tower"});
  textbox(slide,"Explorations of the potential\nspin–gravity dimensionless response",{left:70,top:180,width:790,height:190},45,C.white,true);
  textbox(slide,"A terrestrial ytterbium-171 clock experiment proposal",{left:74,top:395,width:720,height:55},25,"#D9E9F2");
  notes(slide,["Proposal and analytic design only. Generated conceptual illustration; it does not depict a built apparatus.",src.shared]);
}
{
  const slide=base("The question behind the experiment");
  para(slide,"How do correlations inside an atom participate in gravitationally sensitive quantum interference?",155,115,32);
  para(slide,"The proposed test uses two stationary atoms. One optical excitation is coherently shared between their locations, while its association with nuclear spin is reversed between preparations.",325,170,26);
  small(slide,"The atoms remain trapped at separate stations. The test concerns distributed internal-state coherence.",562,66);
  notes(slide,[src.shared,src.architecture]);
}
{
  const slide=base("Why use a building-scale height difference?");
  para(slide,"At 1 cm for 10 s, the ideal phase difference is only 0.0355 rad. A 1% response test would need about 5.66 μHz control of differential-frequency bias.",126,100,25);
  const a=[byH(.01),byH(1),byH(10),byH(100),byH(450)];
  table(slide,[
    ["Vertical separation","Yb-171 frequency difference","Time for 0.5 rad"],
    ["1 cm","0.000566 Hz","141 s"],
    ["1 m","0.0566 Hz","1.41 s"],
    ["10 m","0.566 Hz","0.141 s"],
    ["100 m","5.66 Hz","0.0141 s"],
    ["450 m","25.4 Hz","0.00313 s"],
  ],245,347,[330,430,372]);
  small(slide,"Calculated stationary-clock examples. Each clock behaves normally in its local laboratory.",611,55);
  notes(slide,["Table 1 is generated from the shared calculation report with BIPM frequency, g=9.80665 m/s², and leading-order ΔU≈gΔz. Rounded display values are checked against source rows: "+JSON.stringify(a),src.bipm,src.shared]);
}
{
  const slide=base("A terrestrial redshift benchmark already exists");
  para(slide,"Tokyo Skytree compared two transportable strontium optical lattice clocks across about 450 m.",150,105,31);
  textbox(slide,"9.1 × 10⁻⁵",{left:78,top:294,width:570,height:100},60,C.teal,true);
  para(slide,"Relative uncertainty in its gravitational redshift test",407,92,27);
  small(slide,"The proposed ytterbium correlation mode adds a different measurement. The Skytree clocks were not entangled.",552,72);
  notes(slide,["University of Tokyo primary press release reports 450 m and (1.4 ± 9.1)×10⁻⁵.",src.tokyo]);
}
{
  const slide=base("Two modes at the same gravitational baseline");
  textbox(slide,"Conventional clock mode",{left:74,top:150,width:520,height:54},29,C.teal,true);
  para(slide,"Compare two unentangled optical clocks through a stabilized frequency-transfer link. This measures the ordinary gravitational frequency difference.",215,167,25,74,515);
  textbox(slide,"Distributed quantum mode",{left:668,top:150,width:540,height:54},29,C.teal,true);
  para(slide,"Use a photon-mediated protocol to prepare entangled atoms at the two stations. Joint measurements read the phase of their shared optical excitation.",215,167,25,668,520);
  small(slide,"A stable phase-reference link and an entanglement-generation link perform different functions.",517,82);
  notes(slide,[src.entangled,src.shared,"The full building-scale Yb-171 implementation is proposed, not demonstrated."]);
}
{
  const slide=base("Operating scales for the terrestrial design");
  table(slide,[
    ["Quantity","10 m separation","100 m separation"],
    ["Assumed potential difference","98.0665 m²/s²","980.665 m²/s²"],
    ["Fractional clock-rate difference","1.0911 × 10⁻¹⁵","1.0911 × 10⁻¹⁴"],
    ["Differential clock frequency","0.5655 Hz","5.6553 Hz"],
    ["Relative phase after 1 s","3.5533 rad","35.5334 rad"],
    ["Time for 0.5 rad","140.7 ms","14.07 ms"],
  ],150,420,[455,338,339]);
  small(slide,"The 100 m, 1 s phase spans more than five full cycles. Phase tracking must resolve the cycle count.",595,67);
  notes(slide,["Table 2 is produced from the project calculation report. Exact rows: "+JSON.stringify([byH(10),byH(100)]),src.bipm,"Assumptions: stationary weak-field clocks and constant standard gravity. Actual potential needs independent survey."]);
}
{
  const slide=base("Opposite energy–spin correlations");
  para(slide,"Each atom has a ground and excited optical clock level, plus two nuclear-spin projections.",139,80,28);
  textbox(slide,"Preparation +",{left:76,top:269,width:290,height:51},28,C.teal,true);
  para(slide,"The excited level is paired with spin up; the ground level with spin down.",321,95,26,76,500);
  textbox(slide,"Preparation −",{left:655,top:269,width:290,height:51},28,C.teal,true);
  para(slide,"The excited level is paired with spin down; the ground level with spin up.",321,95,26,655,500);
  small(slide,"Both states contain one excitation and have the same local energy and spin populations.",521,77);
  notes(slide,[src.architecture,src.shared,"The state formulas and ideal spin-degenerate limit are in the accompanying proposal. Spin-dependent shifts must be measured in the real system."]);
}
{
  const slide=base("Gravity changes the relative clock phase");
  textbox(slide,"Δν/ν₀ = ΔU/c²",{left:74,top:167,width:800,height:72},44,C.teal,true);
  textbox(slide,"x = (ΔE/ℏ) Δτ",{left:74,top:278,width:800,height:72},44,C.teal,true);
  para(slide,"The alternative with the excitation higher in the building evolves relative to the alternative with the excitation lower down. Spectroscopy fixes ΔE. An independent potential survey and interrogation time fix the predicted Δτ.",407,174,26);
  notes(slide,[src.bipm,src.qep,"Leading-order stationary-clock relation. The corresponding potential difference must be determined independently of the clock comparison."]);
}
{
  const slide=base("Joint measurements reveal the shared phase");
  para(slide,"Calibrated local analysis pulses turn the relative phase into matching or different joint outcomes. Excitation counts alone cannot reveal that phase.",143,139,28);
  para(slide,"Measurements in complementary bases test the shared Bell coherence. The same populations could also come from an incoherent mixture.",327,133,28);
  small(slide,"Field shifts, trapping light, link phase, and readout bias must enter the uncertainty model.",546,70);
  notes(slide,[src.entangled,src.architecture,"The ideal parity readout in the shared conversation is a proposed control model, not a verified complete apparatus."]);
}
{
  const slide=base("Ideal phase readout for the two preparations");
  textbox(slide,"Πₛ = Cₛ cos(xₛ + sθ − φref)",{left:74,top:153,width:1100,height:78},40,C.teal,true);
  para(slide,"With x = 0.5 rad, θ = π/2 and perfect contrast, the predicted probability of matching outcomes is 26.0% for preparation + and 74.0% for preparation −.",288,147,27);
  small(slide,"That raw difference follows from the analysis control. The test compares the phase inferred from each pattern with its independent gravitational prediction.",539,95);
  notes(slide,[src.shared,"Ideal parity model checked by shared/theory/ytterbium-clock-proposal-calculation.ts. This algebraic model check is not validation of the complete measurement hardware.","Exact example: "+JSON.stringify(report.idealHalfRadianMatchingProbabilities)]);
}
{
  const slide=base("Normalize each measured phase independently");
  textbox(slide,"κₛ = xₛ(gravity, measured) / xₛ(GR, predicted)",{left:74,top:161,width:1130,height:76},38,C.teal,true);
  textbox(slide,"xₛ(GR, predicted) = (ΔEₛ/ℏ)(ΔU/c²)T",{left:74,top:294,width:1130,height:72},36,C.teal,true);
  para(slide,"Measure each encoding’s ΔEₛ by spectroscopy. Survey ΔU independently. Correct ordinary field and link shifts before extracting the gravitational phase.",460,140,27);
  notes(slide,[src.shared,src.bipm,src.architecture,"Operational ratio under the stated diagonal-coupling interpretation. A nonzero result needs systematics and model checks before physical interpretation."]);
}
{
  const slide=base("Three dimensionless responses");
  textbox(slide,"κcl",{left:76,top:155,width:220,height:70},50,C.teal,true);
  para(slide,"Conventional clock redshift",225,56,25,77,310);
  textbox(slide,"κ₀ = (κ₊ + κ₋)/2",{left:455,top:155,width:690,height:70},43,C.teal,true);
  para(slide,"Mean correlated response",225,56,25,458,595);
  textbox(slide,"ηES = (κ₊ − κ₋)/2",{left:76,top:350,width:800,height:70},43,C.teal,true);
  para(slide,"Correlation-dependent half-difference",420,63,25,77,820);
  small(slide,"Standard prediction: κcl = 1, κ₀ = 1, ηES = 0. These are test coefficients, not established new constants.",548,76);
  notes(slide,[src.shared,src.qep,"Each κ± divides corrected measured gravitational phase by a prediction from that encoding's measured spectroscopic gap and an independently measured potential difference."]);
}
{
  const slide=base("What a credible measurement requires");
  para(slide,"Independent geometry and gravimetry define the potential. Spectroscopy measures each encoding's true energy gap.",147,102,27);
  para(slide,"A height scan helps separate gravitational slope from a height-independent frequency offset. Height-dependent field shifts still need calibration.",289,122,27);
  para(slide,"Complementary-basis measurements verify Bell coherence. Blinded confirmatory data and a retained covariance model test the fitted response.",462,130,27);
  notes(slide,[src.architecture,src.shared,"These are proposal gates. No integrated experiment or measured coefficients are claimed."]);
}
{
  const slide=base("The proposed closure test");
  para(slide,"One consistent response should describe the ordinary clock comparison and both opposite energy–spin preparations.",152,145,32);
  textbox(slide,"κcl ≈ 1     κ₀ ≈ 1     ηES ≈ 0",{left:74,top:346,width:1090,height:85},48,C.teal,true);
  para(slide,"A residual ηES would call for replicated controls before any new gravitational interpretation.",507,93,26);
  notes(slide,[src.shared,src.qep,"This is a proposed test, not a measured closure. The conventional and quantum modes share the gravitational baseline but use distinct readouts."]);
}

const outputDir=path.join(workspaceDir,"artifacts/presentations/ytterbium-clock-proposal");
const staging=path.join(workspaceDir,".codex-build/ytterbium-clock-proposal");
await fs.mkdir(outputDir,{recursive:true}); await fs.mkdir(staging,{recursive:true});
const candidatePath=path.join(staging,"candidate.pptx");
const finalPath=path.join(outputDir,"ytterbium-energy-spin-gravity-proposal-v2.pptx");
await (await PresentationFile.exportPptx(ppt)).save(candidatePath);
const result=await finalizePresentation({
  workspaceDir,candidatePath,finalPath,pythonExecutable:RUNTIME_PYTHON,
  integrityValidatorPath:path.join(SKILL_DIR,"container_tools/inspect_presentation_package_integrity.py"),
  layoutValidatorPath:path.join(SKILL_DIR,"container_tools/inspect_presentation_layout_geometry.py"),
  layoutArgs:["--expected-slide-size-emu","12192000,6858000","--validate-heading-fit","--require-native-table-slide","3","--require-native-table-slide","6"],
  requiredNativeTableOwnerSlides:[3,6],
  fontPolicy:{basis:"design",families:[family]},
  verifyArtifactToolImport:true,
  receiptPath:path.join(staging,"validation-v2.json"),
});
console.log(JSON.stringify({finalPath,font:family,result},null,2));
