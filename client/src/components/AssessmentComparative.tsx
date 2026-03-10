import { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { trpc } from "@/lib/trpc";

// ============ TYPES ============

interface AssessmentComparativeProps {
  studentId: number;
  studentName: string;
  onBack: () => void;
}

const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"];
const PIE_COLORS = ["#f59e0b", "#ef4444", "#3b82f6", "#9ca3af"];

const PROTOCOL_LABELS: Record<string, string> = {
  jackson_pollock_7: "Jackson & Pollock 7",
  jackson_pollock_3: "Jackson & Pollock 3",
  guedes_3: "Guedes 3",
  faulkner: "Faulkner",
  deurenberg: "Deurenberg",
  weltman: "Weltman",
  petroski: "Petroski",
  durnin_womersley: "Durnin & Womersley",
  slaughter: "Slaughter",
};

// ============ COMPONENT ============

export default function AssessmentComparative({
  studentId,
  studentName,
  onBack,
}: AssessmentComparativeProps) {
  const { data: assessments = [], isLoading } = trpc.assessments.getByStudent.useQuery({ studentId });
  const [activeTab, setActiveTab] = useState("comparativo");
  const chartsRef = useRef<HTMLDivElement>(null);

  // Sort assessments by number/date
  const sorted = useMemo(() => {
    return [...(assessments as any[])].sort((a, b) => {
      if (a.assessmentNumber !== b.assessmentNumber) return (a.assessmentNumber || 1) - (b.assessmentNumber || 1);
      return new Date(a.assessmentDate).getTime() - new Date(b.assessmentDate).getTime();
    });
  }, [assessments]);

  // ============ CHART DATA ============

  // Evolution data (line charts)
  const evolutionData = useMemo(() => {
    return sorted.map((a: any, i: number) => ({
      name: `${a.assessmentNumber || i + 1}a Av.`,
      date: a.assessmentDate ? new Date(a.assessmentDate).toLocaleDateString("pt-BR") : "",
      peso: parseFloat(a.weight) || 0,
      imc: parseFloat(a.bmi) || 0,
      gordura: parseFloat(a.bodyFat) || 0,
      massaMagra: parseFloat(a.leanMass) || 0,
      massaGorda: parseFloat(a.fatMass) || 0,
      cintura: parseFloat(a.waist) || 0,
      quadril: parseFloat(a.hips) || 0,
      bracoD: parseFloat(a.rightArm) || 0,
      bracoE: parseFloat(a.leftArm) || 0,
      coxaD: parseFloat(a.rightThigh) || 0,
      coxaE: parseFloat(a.leftThigh) || 0,
      panturrilhaD: parseFloat(a.rightCalf) || 0,
      panturrilhaE: parseFloat(a.leftCalf) || 0,
      torax: parseFloat(a.chest) || 0,
    }));
  }, [sorted]);

  // Body composition pie (last assessment)
  const lastAssessment = sorted[sorted.length - 1] as any | undefined;
  const compositionPie = useMemo(() => {
    if (!lastAssessment) return [];
    const fat = parseFloat(lastAssessment.fatMass) || 0;
    const muscle = parseFloat(lastAssessment.muscleMass) || parseFloat(lastAssessment.leanMass) || 0;
    const bone = parseFloat(lastAssessment.boneMass) || 0;
    const residual = parseFloat(lastAssessment.residualMass) || 0;
    const total = fat + muscle + bone + residual;
    if (total === 0) return [];
    return [
      { name: "Massa Gorda", value: parseFloat(fat.toFixed(1)), color: PIE_COLORS[0] },
      { name: "Massa Muscular", value: parseFloat(muscle.toFixed(1)), color: PIE_COLORS[1] },
      { name: "Massa Óssea", value: parseFloat(bone.toFixed(1)), color: PIE_COLORS[2] },
      { name: "Massa Residual", value: parseFloat(residual.toFixed(1)), color: PIE_COLORS[3] },
    ].filter(d => d.value > 0);
  }, [lastAssessment]);

  // Somatotype radar (last assessment)
  const somatoData = useMemo(() => {
    if (!lastAssessment) return [];
    return [
      { subject: "Endomorfia", value: parseFloat(lastAssessment.endomorphy) || 0 },
      { subject: "Mesomorfia", value: parseFloat(lastAssessment.mesomorphy) || 0 },
      { subject: "Ectomorfia", value: parseFloat(lastAssessment.ectomorphy) || 0 },
    ];
  }, [lastAssessment]);

  // Body fat classification bar
  const bfBarData = useMemo(() => {
    return sorted.map((a: any, i: number) => ({
      name: `${a.assessmentNumber || i + 1}a`,
      gordura: parseFloat(a.bodyFat) || 0,
    }));
  }, [sorted]);

  // Circumference comparison bars
  const circumferenceBarData = useMemo(() => {
    if (sorted.length === 0) return [];
    const fields = [
      { key: "chest", label: "Tórax" },
      { key: "waist", label: "Cintura" },
      { key: "hips", label: "Quadril" },
      { key: "rightArm", label: "Braço D" },
      { key: "leftArm", label: "Braço E" },
      { key: "rightThigh", label: "Coxa D" },
      { key: "leftThigh", label: "Coxa E" },
      { key: "rightCalf", label: "Pant. D" },
      { key: "leftCalf", label: "Pant. E" },
    ];
    return fields.map(f => {
      const row: any = { name: f.label };
      sorted.forEach((a: any, i: number) => {
        row[`av${i + 1}`] = parseFloat(a[f.key]) || 0;
      });
      return row;
    });
  }, [sorted]);

  // ============ HELPER FOR EXPORTS ============
  const fmtVal = (v: any, dec = 1) => {
    if (v == null || v === "") return "";
    const n = parseFloat(v);
    return isNaN(n) ? String(v) : n.toFixed(dec);
  };
  const fmtNum = (v: any) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
  const diffStr = (first: any, last: any, field: string, dec = 1) => {
    const v1 = fmtNum(first[field]); const v2 = fmtNum(last[field]);
    if (v1 === 0 && v2 === 0) return "";
    const d = v2 - v1;
    return (d > 0 ? "+" : "") + d.toFixed(dec);
  };

  // ============ EXPORT PDF ============
  function exportPDF() {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pw = doc.internal.pageSize.getWidth();
      let y = 12;

      // Header bar
      doc.setFillColor(30, 64, 175);
      doc.rect(0, 0, pw, 28, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("AVALIAÇÃO FÍSICA", pw / 2, 12, { align: "center" });
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Aluno: ${studentName}`, pw / 2, 19, { align: "center" });
      doc.setFontSize(8);
      doc.text(`Emitido em ${new Date().toLocaleDateString("pt-BR")} | ${sorted.length} avaliação(ões)`, pw / 2, 25, { align: "center" });
      doc.setTextColor(0, 0, 0);
      y = 34;

      if (sorted.length === 0) {
        doc.text("Nenhuma avaliação registrada.", 14, y);
        doc.save(`avaliacao_${studentName.replace(/\s/g, "_")}.pdf`);
        return;
      }

      // Section helper
      const sectionTitle = (title: string, startY: number) => {
        doc.setFillColor(241, 245, 249);
        doc.rect(10, startY - 4, pw - 20, 7, "F");
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 64, 175);
        doc.text(title, 14, startY);
        doc.setTextColor(0, 0, 0);
        return startY + 5;
      };

      const avHeaders = ["", ...sorted.map((a: any, i: number) => {
        const dt = a.assessmentDate ? new Date(a.assessmentDate).toLocaleDateString("pt-BR") : "";
        return `${a.assessmentNumber || i + 1}a Av.\n${dt}`;
      })];
      if (sorted.length >= 2) avHeaders.push("Evolução");

      const first = sorted[0] as any;
      const last = sorted[sorted.length - 1] as any;
      const addDiff = (field: string, dec = 1) => sorted.length >= 2 ? [diffStr(first, last, field, dec)] : [];

      // === DADOS GERAIS ===
      y = sectionTitle("DADOS GERAIS", y);
      const generalRows = [
        ["Protocolo", ...sorted.map((a: any) => PROTOCOL_LABELS[a.protocol] || a.protocol || ""), ""],
        ["Peso (kg)", ...sorted.map((a: any) => fmtVal(a.weight)), ...addDiff("weight")],
        ["Altura (cm)", ...sorted.map((a: any) => fmtVal(a.height)), ""],
        ["IMC (kg/m²)", ...sorted.map((a: any) => fmtVal(a.bmi)), ...addDiff("bmi")],
        ["% Gordura", ...sorted.map((a: any) => fmtVal(a.bodyFat)), ...addDiff("bodyFat")],
        ["Massa Gorda (kg)", ...sorted.map((a: any) => fmtVal(a.fatMass)), ...addDiff("fatMass")],
        ["Massa Magra (kg)", ...sorted.map((a: any) => fmtVal(a.leanMass)), ...addDiff("leanMass")],
        ["Massa Muscular (kg)", ...sorted.map((a: any) => fmtVal(a.muscleMass)), ...addDiff("muscleMass")],
        ["Massa Óssea (kg)", ...sorted.map((a: any) => fmtVal(a.boneMass)), ...addDiff("boneMass")],
        ["Massa Residual (kg)", ...sorted.map((a: any) => fmtVal(a.residualMass)), ...addDiff("residualMass")],
        ["RCQ", ...sorted.map((a: any) => fmtVal(a.rcq, 3)), ...addDiff("rcq", 3)],
        ["TMB (kcal/dia)", ...sorted.map((a: any) => fmtVal(a.bmr, 0)), ...addDiff("bmr", 0)],
      ].filter(r => r.some((v, i) => i > 0 && v !== "" && v !== "0.0" && v !== "0"));

      autoTable(doc, {
        head: [avHeaders],
        body: generalRows,
        startY: y,
        theme: "striped",
        styles: { fontSize: 7, cellPadding: 1.5, lineColor: [200, 200, 200], lineWidth: 0.1 },
        headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: "bold", fontSize: 7, halign: "center" },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 32 } },
        didParseCell: (data: any) => {
          if (data.section === "body" && data.column.index === avHeaders.length - 1 && sorted.length >= 2) {
            const val = String(data.cell.raw);
            if (val.startsWith("-")) { data.cell.styles.textColor = [22, 163, 74]; data.cell.styles.fontStyle = "bold"; }
            else if (val.startsWith("+")) { data.cell.styles.textColor = [220, 38, 38]; data.cell.styles.fontStyle = "bold"; }
          }
        },
      });
      y = (doc as any).lastAutoTable.finalY + 6;

      // === PERÍMETROS ===
      if (y > 240) { doc.addPage(); y = 15; }
      y = sectionTitle("PERÍMETROS (cm)", y);
      const periRows = [
        ["Ombro", "shoulder"], ["Tórax", "chest"], ["Busto", "bust"],
        ["Cintura", "waist"], ["Abdômen", "abdomen"], ["Quadril", "hips"],
        ["Braço Direito", "rightArm"], ["Braço Esquerdo", "leftArm"],
        ["Antebraço Direito", "rightForearm"], ["Antebraço Esquerdo", "leftForearm"],
        ["Coxa Direita", "rightThigh"], ["Coxa Esquerda", "leftThigh"],
        ["Panturrilha Direita", "rightCalf"], ["Panturrilha Esquerda", "leftCalf"],
      ].map(([label, key]) => [label, ...sorted.map((a: any) => fmtVal(a[key])), ...addDiff(key)])
        .filter(r => r.some((v, i) => i > 0 && v !== "" && v !== "0.0"));

      autoTable(doc, {
        head: [avHeaders],
        body: periRows,
        startY: y,
        theme: "striped",
        styles: { fontSize: 7, cellPadding: 1.5, lineColor: [200, 200, 200], lineWidth: 0.1 },
        headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: "bold", fontSize: 7, halign: "center" },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 32 } },
      });
      y = (doc as any).lastAutoTable.finalY + 6;

      // === DOBRAS CUTÂNEAS ===
      if (y > 240) { doc.addPage(); y = 15; }
      y = sectionTitle("DOBRAS CUTÂNEAS (mm)", y);
      const dobrasRows = [
        ["Subescapular", "subscapularSkinfold"], ["Tríceps", "tricepsSkinfold"],
        ["Bíceps", "bicepsSkinfold"], ["Peitoral", "pectoralSkinfold"],
        ["Axilar Média", "midaxillarySkinfold"], ["Supra-ilíaca", "suprailiacSkinfold"],
        ["Abdominal", "abdominalSkinfold"], ["Coxa", "thighSkinfold"],
        ["Panturrilha", "calfSkinfold"],
      ].map(([label, key]) => [label, ...sorted.map((a: any) => fmtVal(a[key])), ...addDiff(key)])
        .filter(r => r.some((v, i) => i > 0 && v !== "" && v !== "0.0"));

      autoTable(doc, {
        head: [avHeaders],
        body: dobrasRows,
        startY: y,
        theme: "striped",
        styles: { fontSize: 7, cellPadding: 1.5, lineColor: [200, 200, 200], lineWidth: 0.1 },
        headStyles: { fillColor: [217, 119, 6], textColor: 255, fontStyle: "bold", fontSize: 7, halign: "center" },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 32 } },
      });
      y = (doc as any).lastAutoTable.finalY + 6;

      // === DIÂMETROS + PA ===
      if (y > 240) { doc.addPage(); y = 15; }
      y = sectionTitle("DIÂMETROS ÓSSEOS / PRESSÃO ARTERIAL", y);
      const otherRows = [
        ["Bi-epicôndilo Umeral (cm)", "humerusDiameter"],
        ["Bi-estilóide (cm)", "wristDiameter"],
        ["Bi-côndilo Femural (cm)", "femurDiameter"],
        ["PAS (mmHg)", "systolicBP"], ["PAD (mmHg)", "diastolicBP"],
        ["FC Repouso (bpm)", "restingHR"],
      ].map(([label, key]) => [label, ...sorted.map((a: any) => fmtVal(a[key], key.includes("BP") || key.includes("HR") ? 0 : 1))])
        .filter(r => r.some((v, i) => i > 0 && v !== "" && v !== "0.0" && v !== "0"));

      if (otherRows.length > 0) {
        autoTable(doc, {
          head: [avHeaders.slice(0, -1)],
          body: otherRows,
          startY: y,
          theme: "striped",
          styles: { fontSize: 7, cellPadding: 1.5 },
          headStyles: { fillColor: [107, 114, 128], textColor: 255, fontStyle: "bold", fontSize: 7, halign: "center" },
          columnStyles: { 0: { fontStyle: "bold", cellWidth: 38 } },
        });
        y = (doc as any).lastAutoTable.finalY + 6;
      }

      // === SOMATOTIPO ===
      if (y > 250) { doc.addPage(); y = 15; }
      y = sectionTitle("SOMATOTIPO (Heath-Carter)", y);
      const somatoRows = [
        ["Endomorfia", ...sorted.map((a: any) => fmtVal(a.endomorphy))],
        ["Mesomorfia", ...sorted.map((a: any) => fmtVal(a.mesomorphy))],
        ["Ectomorfia", ...sorted.map((a: any) => fmtVal(a.ectomorphy))],
        ["Classificação", ...sorted.map((a: any) => a.somatotype || "")],
      ].filter(r => r.some((v, i) => i > 0 && v !== ""));

      if (somatoRows.length > 0) {
        autoTable(doc, {
          head: [avHeaders.slice(0, -1)],
          body: somatoRows,
          startY: y,
          theme: "striped",
          styles: { fontSize: 7, cellPadding: 1.5 },
          headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: "bold", fontSize: 7, halign: "center" },
          columnStyles: { 0: { fontStyle: "bold", cellWidth: 32 } },
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(`SysFit Pro - Avaliação Física | Página ${i}/${pageCount}`, pw / 2, doc.internal.pageSize.getHeight() - 5, { align: "center" });
      }

      doc.save(`avaliacao_${studentName.replace(/\s/g, "_")}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
    }
  }

  // ============ EXPORT EXCEL ============
  function exportExcel() {
    const wb = XLSX.utils.book_new();
    const first = sorted[0] as any;
    const last = sorted[sorted.length - 1] as any;
    const nAv = sorted.length;
    const avCols = sorted.map((a: any, i: number) => `${a.assessmentNumber || i + 1}a Avaliação`);
    const diffCol = nAv >= 2 ? ["Evolução"] : [];

    const buildRow = (label: string, key: string, dec = 1): any[] => {
      const vals = sorted.map((a: any) => fmtNum(a[key]) || "");
      const hasData = vals.some(v => v !== "" && v !== 0);
      if (!hasData) return [];
      const d = nAv >= 2 ? [diffStr(first, last, key, dec)] : [];
      return [label, ...vals, ...d];
    };

    // === ABA 1: FICHA COMPLETA ===
    const rows: any[][] = [];
    rows.push(["AVALIAÇÃO FÍSICA - " + studentName.toUpperCase()]);
    rows.push(["Emitido em " + new Date().toLocaleDateString("pt-BR")]);
    rows.push([]);

    // Header row
    rows.push(["DADOS GERAIS", ...avCols, ...diffCol]);
    rows.push(["Data", ...sorted.map((a: any) => a.assessmentDate ? new Date(a.assessmentDate).toLocaleDateString("pt-BR") : "")]);
    rows.push(["Protocolo", ...sorted.map((a: any) => PROTOCOL_LABELS[a.protocol] || a.protocol || "")]);

    const generalFields = [
      ["Peso (kg)", "weight"], ["Altura (cm)", "height"],
      ["IMC (kg/m²)", "bmi"], ["% Gordura Corporal", "bodyFat"],
      ["Massa Gorda (kg)", "fatMass"], ["Massa Magra (kg)", "leanMass"],
      ["Massa Muscular (kg)", "muscleMass"], ["Massa Óssea (kg)", "boneMass"],
      ["Massa Residual (kg)", "residualMass"],
      ["RCQ", "rcq"], ["TMB (kcal/dia)", "bmr"],
    ];
    generalFields.forEach(([l, k]) => { const r = buildRow(l as string, k as string, k === "rcq" ? 3 : k === "bmr" ? 0 : 1); if (r.length) rows.push(r); });

    rows.push([]);
    rows.push(["PERÍMETROS (cm)", ...avCols, ...diffCol]);
    [
      ["Ombro", "shoulder"], ["Tórax", "chest"], ["Busto", "bust"],
      ["Cintura", "waist"], ["Abdômen", "abdomen"], ["Quadril", "hips"],
      ["Braço Direito", "rightArm"], ["Braço Esquerdo", "leftArm"],
      ["Antebraço Direito", "rightForearm"], ["Antebraço Esquerdo", "leftForearm"],
      ["Coxa Direita", "rightThigh"], ["Coxa Esquerda", "leftThigh"],
      ["Panturrilha Direita", "rightCalf"], ["Panturrilha Esquerda", "leftCalf"],
    ].forEach(([l, k]) => { const r = buildRow(l as string, k as string); if (r.length) rows.push(r); });

    rows.push([]);
    rows.push(["DOBRAS CUTÂNEAS (mm)", ...avCols, ...diffCol]);
    [
      ["Subescapular", "subscapularSkinfold"], ["Tríceps", "tricepsSkinfold"],
      ["Bíceps", "bicepsSkinfold"], ["Peitoral", "pectoralSkinfold"],
      ["Axilar Média", "midaxillarySkinfold"], ["Supra-ilíaca", "suprailiacSkinfold"],
      ["Abdominal", "abdominalSkinfold"], ["Coxa", "thighSkinfold"],
      ["Panturrilha", "calfSkinfold"],
    ].forEach(([l, k]) => { const r = buildRow(l as string, k as string); if (r.length) rows.push(r); });

    rows.push([]);
    rows.push(["DIÂMETROS ÓSSEOS (cm)", ...avCols]);
    [
      ["Bi-epicôndilo Umeral", "humerusDiameter"],
      ["Bi-estilóide", "wristDiameter"],
      ["Bi-côndilo Femural", "femurDiameter"],
    ].forEach(([l, k]) => { const r = buildRow(l as string, k as string); if (r.length) rows.push(r); });

    rows.push([]);
    rows.push(["PRESSÃO ARTERIAL", ...avCols]);
    [
      ["PAS (mmHg)", "systolicBP"], ["PAD (mmHg)", "diastolicBP"],
      ["FC Repouso (bpm)", "restingHR"],
    ].forEach(([l, k]) => { const r = buildRow(l as string, k as string, 0); if (r.length) rows.push(r); });

    rows.push([]);
    rows.push(["TESTES FÍSICOS", ...avCols]);
    [
      ["Abdominal (reps)", "abdominalReps"], ["Flexão de Braço (reps)", "pushupReps"],
      ["Cooper - Distância (m)", "cooperDistance"], ["Cooper - Velocidade (km/h)", "cooperSpeed"],
    ].forEach(([l, k]) => { const r = buildRow(l as string, k as string, 0); if (r.length) rows.push(r); });

    rows.push([]);
    rows.push(["SOMATOTIPO", ...avCols]);
    rows.push(["Endomorfia", ...sorted.map((a: any) => fmtNum(a.endomorphy) || "")]);
    rows.push(["Mesomorfia", ...sorted.map((a: any) => fmtNum(a.mesomorphy) || "")]);
    rows.push(["Ectomorfia", ...sorted.map((a: any) => fmtNum(a.ectomorphy) || "")]);
    rows.push(["Classificação", ...sorted.map((a: any) => a.somatotype || "")]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 26 }, ...sorted.map(() => ({ wch: 16 })), ...(nAv >= 2 ? [{ wch: 12 }] : [])];
    // Merge title row
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: nAv } }];
    XLSX.utils.book_append_sheet(wb, ws, "Ficha Completa");

    // === ABA 2: EVOLUÇÃO (para gráficos no Excel) ===
    if (evolutionData.length > 0) {
      const evoH = ["Avaliação", "Data", "Peso (kg)", "IMC", "% Gordura", "M. Gorda (kg)", "M. Magra (kg)", "Cintura (cm)", "Quadril (cm)", "Braço D (cm)", "Braço E (cm)", "Coxa D (cm)", "Coxa E (cm)", "Pant. D (cm)", "Tórax (cm)"];
      const evoR = evolutionData.map(d => [
        d.name, d.date, d.peso || "", d.imc || "", d.gordura || "", d.massaGorda || "", d.massaMagra || "",
        d.cintura || "", d.quadril || "", d.bracoD || "", d.bracoE || "", d.coxaD || "", d.coxaE || "",
        d.panturrilhaD || "", d.torax || "",
      ]);
      const ws2 = XLSX.utils.aoa_to_sheet([evoH, ...evoR]);
      ws2["!cols"] = evoH.map(() => ({ wch: 14 }));
      XLSX.utils.book_append_sheet(wb, ws2, "Dados Evolução");
    }

    // === ABA 3: COMPOSIÇÃO CORPORAL ===
    if (compositionPie.length > 0) {
      const total = compositionPie.reduce((s, x) => s + x.value, 0);
      const compR = [
        ["COMPOSIÇÃO CORPORAL - Última Avaliação"],
        [],
        ["Componente", "Peso (kg)", "Percentual (%)"],
        ...compositionPie.map(d => [d.name, d.value, total > 0 ? parseFloat(((d.value / total) * 100).toFixed(1)) : 0]),
        [],
        ["Peso Total (kg)", parseFloat(last?.weight) || total],
        ["% Gordura Corporal", fmtNum(last?.bodyFat)],
        ["Classificação", last?.somatotype || ""],
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(compR);
      ws3["!cols"] = [{ wch: 24 }, { wch: 14 }, { wch: 14 }];
      ws3["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
      XLSX.utils.book_append_sheet(wb, ws3, "Composição Corporal");
    }

    // === ABA 4: RESUMO EVOLUÇÃO ===
    if (nAv >= 2) {
      const evoRows = [
        ["EVOLUÇÃO - 1a até Última Avaliação"],
        [],
        ["Medida", "1a Avaliação", "Última Avaliação", "Diferença", "Resultado"],
      ];
      const evoFields = [
        ["Peso (kg)", "weight", false], ["IMC", "bmi", true], ["% Gordura", "bodyFat", true],
        ["Massa Gorda (kg)", "fatMass", true], ["Massa Magra (kg)", "leanMass", false],
        ["Massa Muscular (kg)", "muscleMass", false],
        ["Cintura (cm)", "waist", true], ["Quadril (cm)", "hips", false],
        ["Braço D (cm)", "rightArm", false], ["Coxa D (cm)", "rightThigh", false],
      ];
      evoFields.forEach(([label, key, invertido]) => {
        const v1 = fmtNum(first[key as string]);
        const v2 = fmtNum(last[key as string]);
        if (v1 === 0 && v2 === 0) return;
        const d = v2 - v1;
        const resultado = invertido
          ? (d < 0 ? "Melhorou" : d > 0 ? "Piorou" : "Manteve")
          : (d > 0 ? "Melhorou" : d < 0 ? "Piorou" : "Manteve");
        evoRows.push([label as string, v1, v2, parseFloat(d.toFixed(1)) as any, resultado]);
      });
      const ws4 = XLSX.utils.aoa_to_sheet(evoRows);
      ws4["!cols"] = [{ wch: 22 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 12 }];
      ws4["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
      XLSX.utils.book_append_sheet(wb, ws4, "Resumo Evolução");
    }

    XLSX.writeFile(wb, `avaliacao_${studentName.replace(/\s/g, "_")}.xlsx`);
  }

  // ============ RENDER ============

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Carregando avaliações...</div>;
  }

  if (sorted.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <h2 className="text-xl font-bold">Comparativo - {studentName}</h2>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">Nenhuma avaliação registrada</p>
            <p className="text-sm text-gray-400">Crie avaliações primeiro para ver o comparativo e gráficos</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4" ref={chartsRef}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <div>
            <h2 className="text-xl font-bold">Comparativo & Gráficos</h2>
            <p className="text-sm text-gray-500">{studentName} • {sorted.length} avaliação(ões)</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <FileText className="w-4 h-4 mr-1" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="comparativo" className="text-xs"><BarChart3 className="w-3 h-3 mr-1" />Comparativo</TabsTrigger>
          <TabsTrigger value="evolucao" className="text-xs"><TrendingUp className="w-3 h-3 mr-1" />Evolução</TabsTrigger>
          <TabsTrigger value="composicao" className="text-xs"><PieChart className="w-3 h-3 mr-1" />Composição</TabsTrigger>
          <TabsTrigger value="somatotipo" className="text-xs"><Activity className="w-3 h-3 mr-1" />Somatotipo</TabsTrigger>
        </TabsList>

        {/* TAB: Comparativo - Table */}
        <TabsContent value="comparativo">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tabela Comparativa</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b-2 border-blue-200">
                    <th className="text-left py-2 px-2 font-bold text-gray-700 bg-gray-50 sticky left-0">Medida</th>
                    {sorted.map((a: any, i: number) => (
                      <th key={i} className="text-center py-2 px-3 font-bold text-white bg-blue-500 min-w-[90px]">
                        {a.assessmentNumber || i + 1}a Av.
                        <br />
                        <span className="font-normal text-blue-100 text-[10px]">
                          {a.assessmentDate ? new Date(a.assessmentDate).toLocaleDateString("pt-BR") : ""}
                        </span>
                      </th>
                    ))}
                    {sorted.length >= 2 && (
                      <th className="text-center py-2 px-3 font-bold text-white bg-green-500 min-w-[80px]">Diferença</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  <SectionHeader label="DADOS GERAIS" colSpan={sorted.length + (sorted.length >= 2 ? 2 : 1)} />
                  <CompRow label="Protocolo" values={sorted.map((a: any) => PROTOCOL_LABELS[a.protocol] || a.protocol)} />
                  <CompRow label="Peso (kg)" values={sorted.map((a: any) => a.weight)} diff />
                  <CompRow label="IMC" values={sorted.map((a: any) => a.bmi)} decimals={1} diff />
                  <CompRow label="% Gordura" values={sorted.map((a: any) => a.bodyFat)} decimals={1} diff unit="%" invertDiff />
                  <CompRow label="Massa Gorda (kg)" values={sorted.map((a: any) => a.fatMass)} decimals={1} diff invertDiff />
                  <CompRow label="Massa Magra (kg)" values={sorted.map((a: any) => a.leanMass)} decimals={1} diff />
                  <CompRow label="RCQ" values={sorted.map((a: any) => a.rcq)} decimals={3} diff invertDiff />
                  <CompRow label="TMB (kcal)" values={sorted.map((a: any) => a.bmr)} decimals={0} diff />

                  <SectionHeader label="PERÍMETROS (cm)" colSpan={sorted.length + (sorted.length >= 2 ? 2 : 1)} />
                  <CompRow label="Ombro" values={sorted.map((a: any) => a.shoulder)} diff />
                  <CompRow label="Tórax" values={sorted.map((a: any) => a.chest)} diff />
                  <CompRow label="Cintura" values={sorted.map((a: any) => a.waist)} diff invertDiff />
                  <CompRow label="Abdômen" values={sorted.map((a: any) => a.abdomen)} diff invertDiff />
                  <CompRow label="Quadril" values={sorted.map((a: any) => a.hips)} diff />
                  <CompRow label="Braço D" values={sorted.map((a: any) => a.rightArm)} diff />
                  <CompRow label="Braço E" values={sorted.map((a: any) => a.leftArm)} diff />
                  <CompRow label="Coxa D" values={sorted.map((a: any) => a.rightThigh)} diff />
                  <CompRow label="Coxa E" values={sorted.map((a: any) => a.leftThigh)} diff />
                  <CompRow label="Pant. D" values={sorted.map((a: any) => a.rightCalf)} diff />
                  <CompRow label="Pant. E" values={sorted.map((a: any) => a.leftCalf)} diff />

                  <SectionHeader label="DOBRAS CUTÂNEAS (mm)" colSpan={sorted.length + (sorted.length >= 2 ? 2 : 1)} />
                  <CompRow label="Subescapular" values={sorted.map((a: any) => a.subscapularSkinfold)} diff invertDiff />
                  <CompRow label="Tríceps" values={sorted.map((a: any) => a.tricepsSkinfold)} diff invertDiff />
                  <CompRow label="Bíceps" values={sorted.map((a: any) => a.bicepsSkinfold)} diff invertDiff />
                  <CompRow label="Peitoral" values={sorted.map((a: any) => a.pectoralSkinfold)} diff invertDiff />
                  <CompRow label="Axilar Média" values={sorted.map((a: any) => a.midaxillarySkinfold)} diff invertDiff />
                  <CompRow label="Supra-ilíaca" values={sorted.map((a: any) => a.suprailiacSkinfold)} diff invertDiff />
                  <CompRow label="Abdominal" values={sorted.map((a: any) => a.abdominalSkinfold)} diff invertDiff />
                  <CompRow label="Coxa" values={sorted.map((a: any) => a.thighSkinfold)} diff invertDiff />
                  <CompRow label="Panturrilha" values={sorted.map((a: any) => a.calfSkinfold)} diff invertDiff />

                  <SectionHeader label="SOMATOTIPO" colSpan={sorted.length + (sorted.length >= 2 ? 2 : 1)} />
                  <CompRow label="Endomorfia" values={sorted.map((a: any) => a.endomorphy)} decimals={1} />
                  <CompRow label="Mesomorfia" values={sorted.map((a: any) => a.mesomorphy)} decimals={1} />
                  <CompRow label="Ectomorfia" values={sorted.map((a: any) => a.ectomorphy)} decimals={1} />
                  <CompRow label="Classificação" values={sorted.map((a: any) => a.somatotype)} />
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Evolução - Line Charts */}
        <TabsContent value="evolucao">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartCard title="Peso (kg)">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="peso" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Peso" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="IMC">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="imc" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} name="IMC" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="% Gordura Corporal">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={bfBarData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="gordura" name="% Gordura" radius={[4, 4, 0, 0]}>
                    {bfBarData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Massa Gorda vs Massa Magra (kg)">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="massaGorda" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="M. Gorda" />
                  <Line type="monotone" dataKey="massaMagra" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} name="M. Magra" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Perímetros - Cintura e Quadril (cm)">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cintura" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Cintura" />
                  <Line type="monotone" dataKey="quadril" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Quadril" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Perímetros - Membros (cm)">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="bracoD" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Braço D" />
                  <Line type="monotone" dataKey="coxaD" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Coxa D" />
                  <Line type="monotone" dataKey="panturrilhaD" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Pant. D" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Circumference comparison */}
            {circumferenceBarData.length > 0 && sorted.length >= 2 && (
              <ChartCard title="Comparativo de Perímetros (cm)" className="md:col-span-2">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={circumferenceBarData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={60} />
                    <Tooltip />
                    <Legend />
                    {sorted.map((_: any, i: number) => (
                      <Bar key={i} dataKey={`av${i + 1}`} name={`${i + 1}a Av.`} fill={COLORS[i % COLORS.length]} radius={[0, 4, 4, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>
        </TabsContent>

        {/* TAB: Composição Corporal */}
        <TabsContent value="composicao">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {compositionPie.length > 0 ? (
              <>
                <ChartCard title="Composição Corporal (kg)">
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPie>
                      <Pie
                        data={compositionPie}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, value, percent }) => `${name}: ${value}kg (${(percent * 100).toFixed(0)}%)`}
                        labelLine
                      >
                        {compositionPie.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                </ChartCard>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Detalhes - Última Avaliação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {compositionPie.map((item, i) => {
                        const total = compositionPie.reduce((s, x) => s + x.value, 0);
                        const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
                        return (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-sm">{item.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold">{item.value} kg</span>
                              <span className="text-xs text-gray-400 ml-2">({pct}%)</span>
                            </div>
                          </div>
                        );
                      })}
                      <div className="border-t pt-2 flex justify-between font-bold text-sm">
                        <span>Total</span>
                        <span>{lastAssessment?.weight || compositionPie.reduce((s, x) => s + x.value, 0).toFixed(1)} kg</span>
                      </div>
                    </div>

                    {lastAssessment?.bodyFat && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">% Gordura Corporal</p>
                        <p className="text-2xl font-bold text-blue-700">{parseFloat(lastAssessment.bodyFat).toFixed(1)}%</p>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="h-3 rounded-full transition-all"
                            style={{
                              width: `${Math.min(parseFloat(lastAssessment.bodyFat), 50)}%`,
                              backgroundColor: parseFloat(lastAssessment.bodyFat) < 20 ? "#22c55e" : parseFloat(lastAssessment.bodyFat) < 30 ? "#f59e0b" : "#ef4444",
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Body composition evolution */}
                {sorted.length >= 2 && (
                  <ChartCard title="Evolução da Composição Corporal" className="md:col-span-2">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={evolutionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="massaGorda" name="M. Gorda" fill="#f59e0b" stackId="a" />
                        <Bar dataKey="massaMagra" name="M. Magra" fill="#22c55e" stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}
              </>
            ) : (
              <Card className="md:col-span-2">
                <CardContent className="py-12 text-center">
                  <PieChart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Dados de composição corporal não disponíveis</p>
                  <p className="text-sm text-gray-400">Preencha peso, dobras cutâneas e diâmetros ósseos na avaliação</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* TAB: Somatotipo */}
        <TabsContent value="somatotipo">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {somatoData.some(d => d.value > 0) ? (
              <>
                <ChartCard title="Somatotipo (Radar)">
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={somatoData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis angle={90} domain={[0, "auto"]} tick={{ fontSize: 10 }} />
                      <Radar name="Somatotipo" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Classificação Somatotípica</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <p className="text-3xl font-bold text-blue-700">{lastAssessment?.somatotype || "—"}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {somatoData.map(d => d.value.toFixed(1)).join(" - ")}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {somatoData.map((item, i) => {
                        const max = Math.max(...somatoData.map(d => d.value));
                        const pct = max > 0 ? (item.value / max) * 100 : 0;
                        const colors = ["#f59e0b", "#ef4444", "#3b82f6"];
                        return (
                          <div key={i}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{item.subject}</span>
                              <span className="font-bold">{item.value.toFixed(1)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div className="h-2.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: colors[i] }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 space-y-1">
                      <p><strong>Endomorfo:</strong> tendência ao acúmulo de gordura</p>
                      <p><strong>Mesomorfo:</strong> predominância musculoesquelética</p>
                      <p><strong>Ectomorfo:</strong> corpo linear e alongado</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Somatotype evolution */}
                {sorted.length >= 2 && (
                  <ChartCard title="Evolução do Somatotipo" className="md:col-span-2">
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={sorted.map((a: any, i: number) => ({
                        name: `${a.assessmentNumber || i + 1}a Av.`,
                        endo: parseFloat(a.endomorphy) || 0,
                        meso: parseFloat(a.mesomorphy) || 0,
                        ecto: parseFloat(a.ectomorphy) || 0,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="endo" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="Endomorfia" />
                        <Line type="monotone" dataKey="meso" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Mesomorfia" />
                        <Line type="monotone" dataKey="ecto" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Ectomorfia" />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}
              </>
            ) : (
              <Card className="md:col-span-2">
                <CardContent className="py-12 text-center">
                  <Activity className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Dados de somatotipo não disponíveis</p>
                  <p className="text-sm text-gray-400">Preencha dobras cutâneas e diâmetros ósseos na avaliação</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============ HELPER COMPONENTS ============

function ChartCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function SectionHeader({ label, colSpan }: { label: string; colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-1.5 px-2 font-bold text-[11px] text-gray-700 bg-gray-100 border-b">
        {label}
      </td>
    </tr>
  );
}

function CompRow({ label, values, decimals, diff, unit, invertDiff }: {
  label: string;
  values: any[];
  decimals?: number;
  diff?: boolean;
  unit?: string;
  invertDiff?: boolean;
}) {
  const nums = values.map(v => parseFloat(v) || 0);
  const hasData = nums.some(n => n > 0);
  if (!hasData && values.every(v => !v)) return null;

  const formatVal = (v: any) => {
    if (v == null || v === "" || v === undefined) return "—";
    const n = parseFloat(v);
    if (isNaN(n)) return String(v);
    return decimals !== undefined ? n.toFixed(decimals) : v;
  };

  // Calculate difference between first and last
  let diffVal = "";
  let diffColor = "";
  if (diff && values.length >= 2) {
    const first = parseFloat(values[0]) || 0;
    const last = parseFloat(values[values.length - 1]) || 0;
    if (first > 0 || last > 0) {
      const d = last - first;
      diffVal = (d > 0 ? "+" : "") + d.toFixed(decimals ?? 1);
      // For most measures: positive = bad (gained fat/weight), negative = good
      // For invertDiff: negative = good (lost fat, lost waist)
      if (invertDiff) {
        diffColor = d < 0 ? "text-green-600" : d > 0 ? "text-red-600" : "";
      } else {
        diffColor = d > 0 ? "text-green-600" : d < 0 ? "text-red-600" : "";
      }
    }
  }

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-1.5 px-2 font-medium text-gray-700 bg-gray-50 sticky left-0">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="py-1.5 px-3 text-center">
          {formatVal(v)}{unit && parseFloat(v) ? unit : ""}
        </td>
      ))}
      {diff && values.length >= 2 && (
        <td className={`py-1.5 px-3 text-center font-bold ${diffColor}`}>
          {diffVal || "—"}
        </td>
      )}
    </tr>
  );
}
