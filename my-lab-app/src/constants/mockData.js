// --- Mock Data ---
export const initialExperiments = [
  {
    id: "EXP-001",
    title: "Protein Analysis of Sample B (Mutant)",
    status: "In Progress",
    startDate: "2025-11-01",
    owner: "Dr. Ada Lovelace",
    hypothesis: "The mutation in Sample B will result in a 30% decrease in protein binding affinity compared to the control.",
    protocol: "1. Prepare protein lysates from Sample A (Control) and Sample B (Mutant).\n2. Perform Bradford assay to normalize protein concentration.\n3. Run samples on a 12% SDS-PAGE gel.\n4. Transfer to PVDF membrane and probe with primary antibody (anti-BIND-v2).\n5. Image blot and quantify band density using ImageJ.",
    logs: [
      { timestamp: "2025-11-01 09:15 AM", content: "Experiment started. Lysates prepared." },
      { timestamp: "2025-11-01 11:30 AM", content: "Bradford assay complete. Concentrations normalized to 2mg/mL." },
      { timestamp: "2025-11-02 10:00 AM", content: "SDS-PAGE gel running. Expected runtime: 90 minutes." },
      { timestamp: "2025-11-02 02:45 PM", content: "Transfer complete. Blot is in blocking buffer overnight at 4°C." },
      { timestamp: "2025-11-03 10:15 AM", content: "Primary antibody incubation started." },
    ],
    analysis: ""
  },
  {
    id: "EXP-002",
    title: "CRISPR Gene Editing Efficacy in HeLa Cells",
    status: "Analyzing",
    startDate: "2025-10-25",
    owner: "Dr. Alan Turing",
    hypothesis: "The new gRNA sequence (gRNA-T2) will improve gene knockout efficiency to >90%.",
    protocol: "1. Transfect HeLa cells with pX459 plasmid containing gRNA-T1 (Control) or gRNA-T2 (Test).\n2. Select with puromycin for 48 hours.\n3. Harvest genomic DNA.\n4. Perform T7 Endonuclease assay to quantify indel formation.",
    logs: [
      { timestamp: "2025-10-25 01:00 PM", content: "Transfection complete." },
      { timestamp: "2025-10-27 01:30 PM", content: "Puromycin selection finished. Cells look healthy." },
      { timestamp: "2025-10-28 11:00 AM", content: "gDNA harvested. T7 assay in progress." },
      { timestamp: "2025-10-28 04:00 PM", content: "Gel image acquired. Ready for analysis." },
    ],
    analysis: "Initial gel quantification shows gRNA-T2 achieved an indel frequency of approximately 92%, while gRNA-T1 was ~75%. This strongly supports the hypothesis. Will repeat N=3."
  },
  {
    id: "EXP-003",
    title: "Drug Compound Screening (DCS-117)",
    status: "Completed",
    startDate: "2025-10-15",
    owner: "Dr. Marie Curie",
    hypothesis: "Compound DCS-117 will show an IC50 of < 10µM in SK-OV-3 cancer cell line.",
    protocol: "1. Seed SK-OV-3 cells in 96-well plates.\n2. Treat with 10-point serial dilution of DCS-117 (0.01µM to 50µM).\n3. Incubate for 72 hours.\n4. Perform CellTiter-Glo assay to measure cell viability.",
    logs: [
      { timestamp: "2025-10-15 02:00 PM", content: "Cells seeded." },
      { timestamp: "2025-10-16 10:00 AM", content: "Cells treated with compound." },
      { timestamp: "2025-10-19 10:30 AM", content: "CellTiter-Glo assay complete. Reading plate on luminometer." },
    ],
    analysis: "Data analysis complete. The IC50 was calculated to be 8.4µM with a 95% CI of [7.9µM, 8.9µM]. The hypothesis is confirmed. Experiment complete."
  },
  {
    id: "EXP-004",
    title: "Mouse Model Behavioral Study - Group A",
    status: "Planning",
    startDate: "2025-11-10",
    owner: "Dr. Alan Turing",
    hypothesis: "Mice in Group A (treated) will show reduced anxiety-like behavior in the elevated plus maze test.",
    protocol: "1. Acclimate mice for 7 days.\n2. Administer treatment or vehicle (control).\n3. Perform elevated plus maze test one hour post-injection.\n4. Record time spent in open vs. closed arms.",
    logs: [],
    analysis: ""
  },
  {
    id: "EXP-005",
    title: "Sample Prep for Mass Spectrometry",
    status: "Failed",
    startDate: "2025-10-30",
    owner: "Dr. Ada Lovelace",
    hypothesis: "N/A - Standard sample preparation protocol.",
    protocol: "1. Digest protein samples with trypsin.\n2. Desalt peptides using C18 columns.\n3. Lyophilize samples and store at -80°C.",
    logs: [
      { timestamp: "2025-10-30 05:00 PM", content: "Digestion complete. Desalting in progress." },
      { timestamp: "2025-10-31 11:00 AM", content: "Contamination detected in vehicle control sample during QC check. Root cause analysis initiated." },
      { timestamp: "2025-10-31 01:00 PM", content: "Contamination traced to a bad batch of trypsin. All samples from this run must be discarded. Marking experiment as Failed. Will restart with new reagents as EXP-006." },
    ],
    analysis: "Run failed due to contaminated trypsin. No data generated."
  },
];

