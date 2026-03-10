import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  ArrowLeft,
  Save,
  Loader2,
  Ruler,
  Weight,
  Heart,
  Brain,
  ClipboardList,
  BarChart3,
  User,
  Calculator,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

// ============ PROTOCOL FORMULAS ============

const PROTOCOLS = [
  { value: "jackson_pollock_7", label: "Jackson & Pollock 7 Dobras" },
  { value: "jackson_pollock_3", label: "Jackson & Pollock 3 Dobras" },
  { value: "guedes_3", label: "Guedes 3 Dobras" },
  { value: "faulkner", label: "Faulkner" },
  { value: "deurenberg", label: "Deurenberg" },
  { value: "weltman", label: "Weltman" },
  { value: "petroski", label: "Petroski" },
  { value: "durnin_womersley", label: "Durnin & Womersley" },
  { value: "slaughter", label: "Slaughter" },
];

interface AssessmentFormData {
  // Personal
  assessmentDate: string;
  assessmentNumber: number;
  protocol: string;
  // Body
  weight: string;
  height: string;
  // Circumferences
  shoulder: string;
  chest: string;
  waist: string;
  abdomen: string;
  hips: string;
  rightArm: string;
  leftArm: string;
  rightForearm: string;
  leftForearm: string;
  rightThigh: string;
  leftThigh: string;
  rightCalf: string;
  leftCalf: string;
  bust: string;
  // Skinfolds
  subscapularSkinfold: string;
  tricepsSkinfold: string;
  bicepsSkinfold: string;
  pectoralSkinfold: string;
  midaxillarySkinfold: string;
  suprailiacSkinfold: string;
  abdominalSkinfold: string;
  thighSkinfold: string;
  calfSkinfold: string;
  // Bone diameters
  humerusDiameter: string;
  wristDiameter: string;
  femurDiameter: string;
  // Blood pressure
  systolicBP: string;
  diastolicBP: string;
  restingHR: string;
  // Tests
  abdominalReps: string;
  pushupReps: string;
  cooperDistance: string;
  cooperSpeed: string;
  // JSON fields
  flexiteste: Record<string, number>;
  posturalAssessment: Record<string, Record<string, string>>;
  parq: Record<string, any>;
  // Notes
  notes: string;
  considerations: string;
  goals: string;
}

const emptyForm: AssessmentFormData = {
  assessmentDate: new Date().toISOString().split("T")[0],
  assessmentNumber: 1,
  protocol: "jackson_pollock_7",
  weight: "", height: "",
  shoulder: "", chest: "", waist: "", abdomen: "", hips: "",
  rightArm: "", leftArm: "", rightForearm: "", leftForearm: "",
  rightThigh: "", leftThigh: "", rightCalf: "", leftCalf: "", bust: "",
  subscapularSkinfold: "", tricepsSkinfold: "", bicepsSkinfold: "",
  pectoralSkinfold: "", midaxillarySkinfold: "", suprailiacSkinfold: "",
  abdominalSkinfold: "", thighSkinfold: "", calfSkinfold: "",
  humerusDiameter: "", wristDiameter: "", femurDiameter: "",
  systolicBP: "", diastolicBP: "", restingHR: "",
  abdominalReps: "", pushupReps: "", cooperDistance: "", cooperSpeed: "",
  flexiteste: {},
  posturalAssessment: {
    lateral: { lordoseCervical: "", ombros: "", abdomen: "", cifoseToracica: "", lordoseLombar: "", quadril: "", joelhos: "", pes: "" },
    posterior: { ombro: "", escapula: "", coluna: "", eips: "", pes: "" },
    anterior: { cabeca: "", eias: "", joelho: "", patela: "", tibia: "" },
  },
  parq: {},
  notes: "", considerations: "", goals: "",
};

// ============ CALCULATION FUNCTIONS ============

function calcBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function calcRCQ(waist: number, hips: number): number {
  return waist / hips;
}

function calcBMR(weightKg: number, heightCm: number, age: number, sex: string): number {
  // Harris-Benedict
  if (sex === "M") {
    return 66.5 + (13.75 * weightKg) + (5.003 * heightCm) - (6.755 * age);
  }
  return 655.1 + (9.563 * weightKg) + (1.85 * heightCm) - (4.676 * age);
}

// Body density calculations by protocol
function calcBodyDensity(
  protocol: string, sex: string, age: number,
  skinfolds: Record<string, number>,
  weightKg?: number, heightCm?: number, waist?: number
): number | null {
  const s = skinfolds;
  const sum3jp = (s.pectoralSkinfold || 0) + (s.abdominalSkinfold || 0) + (s.thighSkinfold || 0);
  const sum3jpF = (s.tricepsSkinfold || 0) + (s.suprailiacSkinfold || 0) + (s.thighSkinfold || 0);
  const sum7 = (s.subscapularSkinfold || 0) + (s.tricepsSkinfold || 0) + (s.pectoralSkinfold || 0) +
    (s.midaxillarySkinfold || 0) + (s.suprailiacSkinfold || 0) + (s.abdominalSkinfold || 0) + (s.thighSkinfold || 0);

  switch (protocol) {
    case "jackson_pollock_7": {
      if (sex === "M") {
        return 1.112 - (0.00043499 * sum7) + (0.00000055 * sum7 * sum7) - (0.00028826 * age);
      }
      return 1.097 - (0.00046971 * sum7) + (0.00000056 * sum7 * sum7) - (0.00012828 * age);
    }
    case "jackson_pollock_3": {
      if (sex === "M") {
        return 1.10938 - (0.0008267 * sum3jp) + (0.0000016 * sum3jp * sum3jp) - (0.0002574 * age);
      }
      return 1.0994921 - (0.0009929 * sum3jpF) + (0.0000023 * sum3jpF * sum3jpF) - (0.0001392 * age);
    }
    case "guedes_3": {
      const sumGuedes = (s.subscapularSkinfold || 0) + (s.suprailiacSkinfold || 0) + (s.abdominalSkinfold || 0);
      if (sex === "M") {
        return 1.17136 - (0.06706 * Math.log10(sumGuedes));
      }
      const sumF = (s.suprailiacSkinfold || 0) + (s.thighSkinfold || 0) + (s.subscapularSkinfold || 0);
      return 1.16650 - (0.07063 * Math.log10(sumF));
    }
    case "faulkner": {
      const sumFaulkner = (s.subscapularSkinfold || 0) + (s.tricepsSkinfold || 0) + (s.suprailiacSkinfold || 0) + (s.abdominalSkinfold || 0);
      const bf = (sumFaulkner * 0.153) + 5.783;
      return bf > 0 ? (4.95 / ((bf / 100) + 4.5)) : null; // reverse Siri
    }
    case "deurenberg": {
      if (!weightKg || !heightCm) return null;
      const bmi = calcBMI(weightKg, heightCm);
      const bf = (1.2 * bmi) + (0.23 * age) - (sex === "M" ? 10.8 : 0) - 5.4;
      return bf > 0 ? (4.95 / ((bf / 100) + 4.5)) : null;
    }
    case "weltman": {
      if (!waist || !weightKg || !heightCm) return null;
      if (sex === "M") {
        const bf = (0.31457 * waist) - (0.10969 * weightKg) + 10.8336;
        return bf > 0 ? (4.95 / ((bf / 100) + 4.5)) : null;
      }
      const bf = (0.11077 * waist) - (0.17666 * (heightCm / 100)) + (0.14354 * weightKg) + 51.03301;
      return bf > 0 ? (4.95 / ((bf / 100) + 4.5)) : null;
    }
    case "petroski": {
      const sumPetroski = (s.subscapularSkinfold || 0) + (s.tricepsSkinfold || 0) + (s.suprailiacSkinfold || 0) +
        (s.calfSkinfold || 0);
      if (sex === "M") {
        return 1.10726863 - (0.00081201 * sumPetroski) + (0.00000212 * sumPetroski * sumPetroski) - (0.00041761 * age);
      }
      return 1.02902361 - (0.00067159 * sumPetroski) + (0.00000242 * sumPetroski * sumPetroski) - (0.00026073 * age);
    }
    case "durnin_womersley": {
      const sumDW = (s.bicepsSkinfold || 0) + (s.tricepsSkinfold || 0) + (s.subscapularSkinfold || 0) + (s.suprailiacSkinfold || 0);
      const logSum = Math.log10(sumDW);
      if (sex === "M") {
        if (age < 20) return 1.1620 - (0.0630 * logSum);
        if (age < 30) return 1.1631 - (0.0632 * logSum);
        if (age < 40) return 1.1422 - (0.0544 * logSum);
        if (age < 50) return 1.1620 - (0.0700 * logSum);
        return 1.1715 - (0.0779 * logSum);
      }
      if (age < 20) return 1.1549 - (0.0678 * logSum);
      if (age < 30) return 1.1599 - (0.0717 * logSum);
      if (age < 40) return 1.1423 - (0.0632 * logSum);
      if (age < 50) return 1.1333 - (0.0612 * logSum);
      return 1.1339 - (0.0645 * logSum);
    }
    case "slaughter": {
      const tri = s.tricepsSkinfold || 0;
      const sub = s.subscapularSkinfold || 0;
      if (sex === "M") {
        const bf = 1.21 * (tri + sub) - 0.008 * (tri + sub) * (tri + sub) - 1.7;
        return bf > 0 ? (4.95 / ((bf / 100) + 4.5)) : null;
      }
      const bf = 1.33 * (tri + sub) - 0.013 * (tri + sub) * (tri + sub) - 2.5;
      return bf > 0 ? (4.95 / ((bf / 100) + 4.5)) : null;
    }
    default:
      return null;
  }
}

function calcBodyFatFromDensity(density: number): number {
  // Siri equation
  return ((4.95 / density) - 4.50) * 100;
}

// Somatotype calculations (Heath-Carter)
function calcSomatotype(
  skinfolds: Record<string, number>,
  diameters: { humerus: number; femur: number },
  circumferences: { rightArm: number; rightCalf: number },
  heightCm: number, weightKg: number
) {
  const tri = skinfolds.tricepsSkinfold || 0;
  const sub = skinfolds.subscapularSkinfold || 0;
  const sup = skinfolds.suprailiacSkinfold || 0;
  const calf = skinfolds.calfSkinfold || 0;

  // Endomorphy
  const sumSF = tri + sub + sup;
  const correctedSum = sumSF * (170.18 / heightCm);
  const endo = -0.7182 + (0.1451 * correctedSum) - (0.00068 * correctedSum * correctedSum) + (0.0000014 * correctedSum * correctedSum * correctedSum);

  // Mesomorphy
  const humerus = diameters.humerus || 0;
  const femur = diameters.femur || 0;
  const armCorr = (circumferences.rightArm || 0) - (tri / 10);
  const calfCorr = (circumferences.rightCalf || 0) - (calf / 10);
  const meso = (0.858 * humerus) + (0.601 * femur) + (0.188 * armCorr) + (0.161 * calfCorr) - (0.131 * heightCm) + 4.5;

  // Ectomorphy
  const heightM = heightCm / 100;
  const HWR = heightCm / Math.pow(weightKg, 1 / 3);
  let ecto = 0;
  if (HWR >= 40.75) {
    ecto = (0.732 * HWR) - 28.58;
  } else if (HWR > 38.25) {
    ecto = (0.463 * HWR) - 17.63;
  } else {
    ecto = 0.1;
  }

  return {
    endomorphy: Math.max(0.1, Math.round(endo * 10) / 10),
    mesomorphy: Math.max(0.1, Math.round(meso * 10) / 10),
    ectomorphy: Math.max(0.1, Math.round(ecto * 10) / 10),
  };
}

// ============ TYPES ============

interface PhysicalAssessmentFormProps {
  studentId: number;
  studentName: string;
  studentSex?: string; // "M" or "F"
  studentBirthDate?: string;
  existingAssessment?: any; // existing assessment to edit
  onBack: () => void;
  onSaved?: () => void;
}

// ============ COMPONENT ============

export default function PhysicalAssessmentForm({
  studentId,
  studentName,
  studentSex = "M",
  studentBirthDate,
  existingAssessment,
  onBack,
  onSaved,
}: PhysicalAssessmentFormProps) {
  const [form, setForm] = useState<AssessmentFormData>(() => {
    if (existingAssessment) {
      return loadFromAssessment(existingAssessment);
    }
    return { ...emptyForm };
  });

  const [activeTab, setActiveTab] = useState("medidas");
  const [saving, setSaving] = useState(false);

  const createMutation = trpc.assessments.createFull.useMutation();
  const updateMutation = trpc.assessments.updateFull.useMutation();

  // Calculate age from birth date
  const age = useMemo(() => {
    if (!studentBirthDate) return 25; // default
    const birth = new Date(studentBirthDate);
    const today = new Date();
    let a = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--;
    return a;
  }, [studentBirthDate]);

  // Auto-calculate results
  const calculated = useMemo(() => {
    const w = parseFloat(form.weight) || 0;
    const h = parseFloat(form.height) || 0;
    const waist = parseFloat(form.waist) || 0;
    const hips = parseFloat(form.hips) || 0;

    const bmi = w > 0 && h > 0 ? calcBMI(w, h) : 0;
    const rcq = waist > 0 && hips > 0 ? calcRCQ(waist, hips) : 0;
    const bmr = w > 0 && h > 0 ? calcBMR(w, h, age, studentSex) : 0;

    // Skinfolds object
    const sf: Record<string, number> = {
      subscapularSkinfold: parseFloat(form.subscapularSkinfold) || 0,
      tricepsSkinfold: parseFloat(form.tricepsSkinfold) || 0,
      bicepsSkinfold: parseFloat(form.bicepsSkinfold) || 0,
      pectoralSkinfold: parseFloat(form.pectoralSkinfold) || 0,
      midaxillarySkinfold: parseFloat(form.midaxillarySkinfold) || 0,
      suprailiacSkinfold: parseFloat(form.suprailiacSkinfold) || 0,
      abdominalSkinfold: parseFloat(form.abdominalSkinfold) || 0,
      thighSkinfold: parseFloat(form.thighSkinfold) || 0,
      calfSkinfold: parseFloat(form.calfSkinfold) || 0,
    };

    const density = calcBodyDensity(form.protocol, studentSex, age, sf, w, h, waist);
    const bodyFatPct = density && density > 0 ? calcBodyFatFromDensity(density) : 0;
    const fatMass = bodyFatPct > 0 && w > 0 ? (bodyFatPct / 100) * w : 0;
    const leanMass = w > 0 && fatMass > 0 ? w - fatMass : 0;

    // Body composition fractionation (Matiegka)
    const residualMass = w > 0 ? (studentSex === "M" ? w * 0.241 : w * 0.209) : 0;
    const boneMass = w > 0 && h > 0 ? calcBoneMass(h, parseFloat(form.humerusDiameter) || 0, parseFloat(form.femurDiameter) || 0, parseFloat(form.wristDiameter) || 0) : 0;
    const muscleMass = w > 0 ? w - fatMass - residualMass - boneMass : 0;

    // Somatotype
    const soma = calcSomatotype(
      sf,
      { humerus: parseFloat(form.humerusDiameter) || 0, femur: parseFloat(form.femurDiameter) || 0 },
      { rightArm: parseFloat(form.rightArm) || 0, rightCalf: parseFloat(form.rightCalf) || 0 },
      h, w
    );

    // BMI classification
    let bmiClass = "";
    if (bmi > 0) {
      if (bmi < 18.5) bmiClass = "Abaixo do peso";
      else if (bmi < 25) bmiClass = "Normal";
      else if (bmi < 30) bmiClass = "Sobrepeso";
      else if (bmi < 35) bmiClass = "Obesidade I";
      else if (bmi < 40) bmiClass = "Obesidade II";
      else bmiClass = "Obesidade III";
    }

    // Body fat classification
    let bfClass = "";
    if (bodyFatPct > 0) {
      if (studentSex === "M") {
        if (bodyFatPct < 6) bfClass = "Essencial";
        else if (bodyFatPct < 14) bfClass = "Atleta";
        else if (bodyFatPct < 18) bfClass = "Fitness";
        else if (bodyFatPct < 25) bfClass = "Normal";
        else bfClass = "Acima";
      } else {
        if (bodyFatPct < 14) bfClass = "Essencial";
        else if (bodyFatPct < 21) bfClass = "Atleta";
        else if (bodyFatPct < 25) bfClass = "Fitness";
        else if (bodyFatPct < 32) bfClass = "Normal";
        else bfClass = "Acima";
      }
    }

    // Dominant somatotype
    let somatoLabel = "";
    const { endomorphy: endo, mesomorphy: meso, ectomorphy: ecto } = soma;
    if (endo > meso && endo > ecto) somatoLabel = "Endomorfo";
    else if (meso > endo && meso > ecto) somatoLabel = "Mesomorfo";
    else if (ecto > endo && ecto > meso) somatoLabel = "Ectomorfo";
    else somatoLabel = "Meso-Endomorfo";

    return {
      bmi, bmiClass, bfClass, rcq, bmr, bodyFatPct, fatMass, leanMass, muscleMass, residualMass, boneMass,
      ...soma, somatoLabel, density,
    };
  }, [form, age, studentSex]);

  function calcBoneMass(h: number, humerus: number, femur: number, wrist: number): number {
    if (humerus <= 0 || femur <= 0) return 0;
    // Von Döbeln simplified
    const hm = h / 100;
    return 3.02 * Math.pow(hm * hm * humerus * femur * 0.001, 0.712);
  }

  const updateField = useCallback((field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const updatePostural = useCallback((view: string, field: string, value: string) => {
    setForm(prev => ({
      ...prev,
      posturalAssessment: {
        ...prev.posturalAssessment,
        [view]: { ...prev.posturalAssessment[view], [field]: value },
      },
    }));
  }, []);

  const updateParq = useCallback((field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      parq: { ...prev.parq, [field]: value },
    }));
  }, []);

  const updateFlexiteste = useCallback((field: string, value: number) => {
    setForm(prev => ({
      ...prev,
      flexiteste: { ...prev.flexiteste, [field]: value },
    }));
  }, []);

  async function handleSave() {
    if (!form.assessmentDate) {
      toast.error("Data da avaliação é obrigatória");
      return;
    }

    setSaving(true);
    try {
      const toNum = (v: string) => v ? parseFloat(v) : undefined;
      const payload = {
        studentId,
        assessmentDate: form.assessmentDate,
        assessmentNumber: form.assessmentNumber,
        protocol: form.protocol,
        weight: toNum(form.weight),
        height: toNum(form.height),
        shoulder: toNum(form.shoulder),
        chest: toNum(form.chest),
        waist: toNum(form.waist),
        abdomen: toNum(form.abdomen),
        hips: toNum(form.hips),
        rightArm: toNum(form.rightArm),
        leftArm: toNum(form.leftArm),
        rightForearm: toNum(form.rightForearm),
        leftForearm: toNum(form.leftForearm),
        rightThigh: toNum(form.rightThigh),
        leftThigh: toNum(form.leftThigh),
        rightCalf: toNum(form.rightCalf),
        leftCalf: toNum(form.leftCalf),
        bust: toNum(form.bust),
        subscapularSkinfold: toNum(form.subscapularSkinfold),
        tricepsSkinfold: toNum(form.tricepsSkinfold),
        bicepsSkinfold: toNum(form.bicepsSkinfold),
        pectoralSkinfold: toNum(form.pectoralSkinfold),
        midaxillarySkinfold: toNum(form.midaxillarySkinfold),
        suprailiacSkinfold: toNum(form.suprailiacSkinfold),
        abdominalSkinfold: toNum(form.abdominalSkinfold),
        thighSkinfold: toNum(form.thighSkinfold),
        calfSkinfold: toNum(form.calfSkinfold),
        humerusDiameter: toNum(form.humerusDiameter),
        wristDiameter: toNum(form.wristDiameter),
        femurDiameter: toNum(form.femurDiameter),
        systolicBP: toNum(form.systolicBP) ? Math.round(toNum(form.systolicBP)!) : undefined,
        diastolicBP: toNum(form.diastolicBP) ? Math.round(toNum(form.diastolicBP)!) : undefined,
        restingHR: toNum(form.restingHR) ? Math.round(toNum(form.restingHR)!) : undefined,
        abdominalReps: toNum(form.abdominalReps) ? Math.round(toNum(form.abdominalReps)!) : undefined,
        pushupReps: toNum(form.pushupReps) ? Math.round(toNum(form.pushupReps)!) : undefined,
        cooperDistance: toNum(form.cooperDistance),
        cooperSpeed: toNum(form.cooperSpeed),
        flexiteste: Object.keys(form.flexiteste).length > 0 ? JSON.stringify(form.flexiteste) : undefined,
        posturalAssessment: JSON.stringify(form.posturalAssessment),
        parq: Object.keys(form.parq).length > 0 ? JSON.stringify(form.parq) : undefined,
        // Calculated values
        bmi: calculated.bmi > 0 ? calculated.bmi : undefined,
        rcq: calculated.rcq > 0 ? calculated.rcq : undefined,
        bodyFat: calculated.bodyFatPct > 0 ? calculated.bodyFatPct : undefined,
        fatMass: calculated.fatMass > 0 ? calculated.fatMass : undefined,
        leanMass: calculated.leanMass > 0 ? calculated.leanMass : undefined,
        muscleMass: calculated.muscleMass > 0 ? calculated.muscleMass : undefined,
        residualMass: calculated.residualMass > 0 ? calculated.residualMass : undefined,
        boneMass: calculated.boneMass > 0 ? calculated.boneMass : undefined,
        bmr: calculated.bmr > 0 ? calculated.bmr : undefined,
        somatotype: calculated.somatoLabel || undefined,
        endomorphy: calculated.endomorphy > 0 ? calculated.endomorphy : undefined,
        mesomorphy: calculated.mesomorphy > 0 ? calculated.mesomorphy : undefined,
        ectomorphy: calculated.ectomorphy > 0 ? calculated.ectomorphy : undefined,
        notes: form.notes || undefined,
        considerations: form.considerations || undefined,
        goals: form.goals || undefined,
      };

      if (existingAssessment?.id) {
        await updateMutation.mutateAsync({ id: existingAssessment.id, ...payload } as any);
        toast.success("Avaliação atualizada com sucesso!");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Avaliação criada com sucesso!");
      }
      onSaved?.();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar avaliação");
    } finally {
      setSaving(false);
    }
  }

  // ============ INPUT HELPER ============
  function NumInput({ label, field, unit, placeholder }: { label: string; field: string; unit?: string; placeholder?: string }) {
    return (
      <div>
        <Label className="text-xs text-gray-600">{label} {unit && <span className="text-gray-400">({unit})</span>}</Label>
        <Input
          type="number"
          step="0.01"
          value={(form as any)[field] || ""}
          onChange={(e) => updateField(field, e.target.value)}
          placeholder={placeholder || "0.00"}
          className="h-8 text-sm"
        />
      </div>
    );
  }

  // ============ RENDER ============
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Avaliação Física {form.assessmentNumber > 0 ? form.assessmentNumber : ""}
            </h2>
            <p className="text-sm text-gray-500">{studentName} • {studentSex === "M" ? "Masculino" : "Feminino"} • {age} anos</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {existingAssessment ? "Atualizar" : "Salvar"}
        </Button>
      </div>

      {/* Basic Info Row */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <Label className="text-xs">Data</Label>
              <Input type="date" value={form.assessmentDate} onChange={(e) => updateField("assessmentDate", e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Avaliação Nº</Label>
              <Select value={String(form.assessmentNumber)} onValueChange={(v) => setForm(prev => ({ ...prev, assessmentNumber: parseInt(v) }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map(n => <SelectItem key={n} value={String(n)}>{n}ª Avaliação</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Peso (kg)</Label>
              <Input type="number" step="0.1" value={form.weight} onChange={(e) => updateField("weight", e.target.value)} placeholder="70.0" className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Altura (cm)</Label>
              <Input type="number" step="0.1" value={form.height} onChange={(e) => updateField("height", e.target.value)} placeholder="170.0" className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Protocolo Dobras</Label>
              <Select value={form.protocol} onValueChange={(v) => updateField("protocol", v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROTOCOLS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="medidas" className="text-xs"><Ruler className="w-3 h-3 mr-1" />Medidas</TabsTrigger>
          <TabsTrigger value="dobras" className="text-xs"><Activity className="w-3 h-3 mr-1" />Dobras</TabsTrigger>
          <TabsTrigger value="testes" className="text-xs"><Heart className="w-3 h-3 mr-1" />Testes</TabsTrigger>
          <TabsTrigger value="postural" className="text-xs"><User className="w-3 h-3 mr-1" />Postural</TabsTrigger>
          <TabsTrigger value="parq" className="text-xs"><ClipboardList className="w-3 h-3 mr-1" />PAR-Q</TabsTrigger>
          <TabsTrigger value="resultados" className="text-xs"><Calculator className="w-3 h-3 mr-1" />Resultados</TabsTrigger>
          <TabsTrigger value="observacoes" className="text-xs"><Brain className="w-3 h-3 mr-1" />Obs</TabsTrigger>
        </TabsList>

        {/* TAB: Medidas / Perímetros */}
        <TabsContent value="medidas">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Perímetros (cm)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <NumInput label="Ombro" field="shoulder" unit="cm" />
                  <NumInput label="Tórax" field="chest" unit="cm" />
                  <NumInput label="Busto" field="bust" unit="cm" />
                  <NumInput label="Cintura" field="waist" unit="cm" />
                  <NumInput label="Abdômen" field="abdomen" unit="cm" />
                  <NumInput label="Quadril" field="hips" unit="cm" />
                  <NumInput label="Braço Dir." field="rightArm" unit="cm" />
                  <NumInput label="Braço Esq." field="leftArm" unit="cm" />
                  <NumInput label="Antebraço Dir." field="rightForearm" unit="cm" />
                  <NumInput label="Antebraço Esq." field="leftForearm" unit="cm" />
                  <NumInput label="Coxa Dir." field="rightThigh" unit="cm" />
                  <NumInput label="Coxa Esq." field="leftThigh" unit="cm" />
                  <NumInput label="Panturrilha Dir." field="rightCalf" unit="cm" />
                  <NumInput label="Panturrilha Esq." field="leftCalf" unit="cm" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Diâmetros Ósseos (cm)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <NumInput label="Bi-epicôndilo Umeral" field="humerusDiameter" unit="cm" />
                  <NumInput label="Bi-estilóide" field="wristDiameter" unit="cm" />
                  <NumInput label="Bi-côndilo Femural" field="femurDiameter" unit="cm" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: Dobras Cutâneas */}
        <TabsContent value="dobras">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Body diagram with labels */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Pontos de Medição</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative mx-auto" style={{ width: "100%", maxWidth: 420 }}>
                  <img src="/images/assessment/body-front-back.jpeg" alt="Pontos de dobras cutâneas" className="w-full rounded" />
                  {/* Labels with arrows - Front body (left side) */}
                  <div className="absolute text-[10px] font-bold text-orange-700 bg-orange-100/90 px-1 rounded" style={{ top: "18%", left: "2%" }}>
                    Peitoral
                    <div className="absolute w-8 h-0 border-t border-orange-500" style={{ top: "50%", right: "-32px" }} />
                  </div>
                  <div className="absolute text-[10px] font-bold text-blue-700 bg-blue-100/90 px-1 rounded" style={{ top: "25%", left: "0%" }}>
                    Bíceps
                    <div className="absolute w-5 h-0 border-t border-blue-500" style={{ top: "50%", right: "-20px" }} />
                  </div>
                  <div className="absolute text-[10px] font-bold text-purple-700 bg-purple-100/90 px-1 rounded transform -rotate-45" style={{ top: "42%", left: "0%" }}>
                    Supra-ilíaca
                  </div>
                  <div className="absolute text-[10px] font-bold text-green-700 bg-green-100/90 px-1 rounded" style={{ top: "28%", left: "22%" }}>
                    Axilar média
                  </div>
                  <div className="absolute text-[10px] font-bold text-red-700 bg-red-100/90 px-1 rounded" style={{ top: "36%", left: "18%" }}>
                    Abdominal
                  </div>
                  <div className="absolute text-[10px] font-bold text-teal-700 bg-teal-100/90 px-1 rounded" style={{ top: "58%", left: "8%" }}>
                    Coxa
                  </div>
                  <div className="absolute text-[10px] font-bold text-gray-700 bg-gray-100/90 px-1 rounded" style={{ top: "76%", left: "10%" }}>
                    Panturrilha
                  </div>
                  {/* Back body (right side) */}
                  <div className="absolute text-[10px] font-bold text-pink-700 bg-pink-100/90 px-1 rounded" style={{ top: "16%", right: "2%" }}>
                    Subescapular
                  </div>
                  <div className="absolute text-[10px] font-bold text-indigo-700 bg-indigo-100/90 px-1 rounded" style={{ top: "26%", right: "0%" }}>
                    Tríceps
                  </div>
                </div>
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                  {getProtocolSkinfolds(form.protocol)}
                </div>
              </CardContent>
            </Card>

            {/* Input fields */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  Dobras Cutâneas (mm) — {PROTOCOLS.find(p => p.value === form.protocol)?.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <NumInput label="Subescapular" field="subscapularSkinfold" unit="mm" />
                  <NumInput label="Tríceps" field="tricepsSkinfold" unit="mm" />
                  <NumInput label="Bíceps" field="bicepsSkinfold" unit="mm" />
                  <NumInput label="Peitoral" field="pectoralSkinfold" unit="mm" />
                  <NumInput label="Axilar Média" field="midaxillarySkinfold" unit="mm" />
                  <NumInput label="Supra-ilíaca" field="suprailiacSkinfold" unit="mm" />
                  <NumInput label="Abdominal" field="abdominalSkinfold" unit="mm" />
                  <NumInput label="Coxa" field="thighSkinfold" unit="mm" />
                  <NumInput label="Panturrilha" field="calfSkinfold" unit="mm" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: Testes Físicos */}
        <TabsContent value="testes">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Pressão Arterial / FC</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <NumInput label="PAS" field="systolicBP" unit="mmHg" />
                  <NumInput label="PAD" field="diastolicBP" unit="mmHg" />
                  <NumInput label="FC Repouso" field="restingHR" unit="bpm" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Testes de Força</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <NumInput label="Abdominal" field="abdominalReps" unit="reps" />
                  <NumInput label="Flexão de Braço" field="pushupReps" unit="reps" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Teste de Cooper</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <NumInput label="Distância" field="cooperDistance" unit="m" />
                  <NumInput label="Velocidade Média" field="cooperSpeed" unit="km/h" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: Avaliação Postural */}
        <TabsContent value="postural">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Lateral View */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Vista Lateral</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative mx-auto mb-3" style={{ maxWidth: 160 }}>
                  <img src="/images/assessment/body-front.jpeg" alt="Vista lateral" className="w-full object-contain opacity-80" />
                  {/* Postural labels */}
                  <div className="absolute text-[8px] font-bold text-blue-700 bg-blue-50/90 px-0.5 rounded" style={{ top: "5%", left: "-5px" }}>Cervical</div>
                  <div className="absolute text-[8px] font-bold text-blue-700 bg-blue-50/90 px-0.5 rounded" style={{ top: "12%", left: "-5px" }}>Ombros</div>
                  <div className="absolute text-[8px] font-bold text-blue-700 bg-blue-50/90 px-0.5 rounded" style={{ top: "18%", right: "-5px" }}>Cifose T.</div>
                  <div className="absolute text-[8px] font-bold text-blue-700 bg-blue-50/90 px-0.5 rounded" style={{ top: "26%", right: "-5px" }}>Lordose L.</div>
                  <div className="absolute text-[8px] font-bold text-blue-700 bg-blue-50/90 px-0.5 rounded" style={{ top: "34%", left: "-5px" }}>Abdômen</div>
                  <div className="absolute text-[8px] font-bold text-blue-700 bg-blue-50/90 px-0.5 rounded" style={{ top: "42%", right: "-5px" }}>Quadril</div>
                  <div className="absolute text-[8px] font-bold text-blue-700 bg-blue-50/90 px-0.5 rounded" style={{ top: "62%", left: "-5px" }}>Joelhos</div>
                  <div className="absolute text-[8px] font-bold text-blue-700 bg-blue-50/90 px-0.5 rounded" style={{ top: "82%", left: "-5px" }}>Pés</div>
                </div>
                <div className="space-y-2">
                  {[
                    { key: "lordoseCervical", label: "Lordose Cervical" },
                    { key: "ombros", label: "Ombros" },
                    { key: "cifoseToracica", label: "Cifose Torácica" },
                    { key: "lordoseLombar", label: "Lordose Lombar" },
                    { key: "abdomen", label: "Abdômen" },
                    { key: "quadril", label: "Quadril" },
                    { key: "joelhos", label: "Joelhos" },
                    { key: "pes", label: "Pés" },
                  ].map(item => (
                    <div key={item.key}>
                      <Label className="text-xs text-gray-600">{item.label}</Label>
                      <Select
                        value={form.posturalAssessment.lateral?.[item.key] || ""}
                        onValueChange={(v) => updatePostural("lateral", item.key, v)}
                      >
                        <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="aumentada">Aumentada</SelectItem>
                          <SelectItem value="diminuida">Diminuída</SelectItem>
                          <SelectItem value="retificada">Retificada</SelectItem>
                          <SelectItem value="protuso">Protuso</SelectItem>
                          <SelectItem value="anteriorizado">Anteriorizado</SelectItem>
                          <SelectItem value="posteriorizado">Posteriorizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Posterior View */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Vista Posterior</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative mx-auto mb-3" style={{ maxWidth: 160 }}>
                  <img src="/images/assessment/body-front-back.jpeg" alt="Vista posterior" className="w-full object-contain opacity-80" />
                  <div className="absolute text-[8px] font-bold text-red-700 bg-red-50/90 px-0.5 rounded" style={{ top: "12%", right: "-5px" }}>Ombro</div>
                  <div className="absolute text-[8px] font-bold text-red-700 bg-red-50/90 px-0.5 rounded" style={{ top: "20%", right: "-5px" }}>Escápula</div>
                  <div className="absolute text-[8px] font-bold text-red-700 bg-red-50/90 px-0.5 rounded" style={{ top: "30%", right: "-5px" }}>Coluna</div>
                  <div className="absolute text-[8px] font-bold text-red-700 bg-red-50/90 px-0.5 rounded" style={{ top: "40%", right: "-5px" }}>EIPS</div>
                  <div className="absolute text-[8px] font-bold text-red-700 bg-red-50/90 px-0.5 rounded" style={{ top: "82%", right: "-5px" }}>Pés</div>
                </div>
                <div className="space-y-2">
                  {[
                    { key: "ombro", label: "Ombros" },
                    { key: "escapula", label: "Escápula" },
                    { key: "coluna", label: "Coluna" },
                    { key: "eips", label: "EIPS" },
                    { key: "pes", label: "Pés" },
                  ].map(item => (
                    <div key={item.key}>
                      <Label className="text-xs text-gray-600">{item.label}</Label>
                      <Select
                        value={form.posturalAssessment.posterior?.[item.key] || ""}
                        onValueChange={(v) => updatePostural("posterior", item.key, v)}
                      >
                        <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="elevado_d">Elevado D</SelectItem>
                          <SelectItem value="elevado_e">Elevado E</SelectItem>
                          <SelectItem value="alada">Alada</SelectItem>
                          <SelectItem value="escoliose_d">Escoliose D</SelectItem>
                          <SelectItem value="escoliose_e">Escoliose E</SelectItem>
                          <SelectItem value="valgo">Valgo</SelectItem>
                          <SelectItem value="varo">Varo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Anterior View */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Vista Anterior</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative mx-auto mb-3" style={{ maxWidth: 160 }}>
                  <img src="/images/assessment/body-front.jpeg" alt="Vista anterior" className="w-full object-contain opacity-80" />
                  <div className="absolute text-[8px] font-bold text-green-700 bg-green-50/90 px-0.5 rounded" style={{ top: "5%", left: "-5px" }}>Cabeça</div>
                  <div className="absolute text-[8px] font-bold text-green-700 bg-green-50/90 px-0.5 rounded" style={{ top: "38%", left: "-5px" }}>EIAS</div>
                  <div className="absolute text-[8px] font-bold text-green-700 bg-green-50/90 px-0.5 rounded" style={{ top: "55%", right: "-5px" }}>Joelho</div>
                  <div className="absolute text-[8px] font-bold text-green-700 bg-green-50/90 px-0.5 rounded" style={{ top: "62%", left: "-5px" }}>Patela</div>
                  <div className="absolute text-[8px] font-bold text-green-700 bg-green-50/90 px-0.5 rounded" style={{ top: "75%", right: "-5px" }}>Tíbia</div>
                </div>
                <div className="space-y-2">
                  {[
                    { key: "cabeca", label: "Cabeça" },
                    { key: "eias", label: "EIAS" },
                    { key: "joelho", label: "Joelhos" },
                    { key: "patela", label: "Patela" },
                    { key: "tibia", label: "Tíbia" },
                  ].map(item => (
                    <div key={item.key}>
                      <Label className="text-xs text-gray-600">{item.label}</Label>
                      <Select
                        value={form.posturalAssessment.anterior?.[item.key] || ""}
                        onValueChange={(v) => updatePostural("anterior", item.key, v)}
                      >
                        <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="inclinada_d">Inclinada D</SelectItem>
                          <SelectItem value="inclinada_e">Inclinada E</SelectItem>
                          <SelectItem value="elevado_d">Elevado D</SelectItem>
                          <SelectItem value="elevado_e">Elevado E</SelectItem>
                          <SelectItem value="valgo">Valgo</SelectItem>
                          <SelectItem value="varo">Varo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: PAR-Q / Anamnese */}
        <TabsContent value="parq">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">PAR-Q (Questionário de Prontidão para Atividade Física)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { key: "heartProblem", label: "Algum médico já disse que você possui algum problema de coração e recomendou atividade física apenas sob supervisão médica?" },
                    { key: "chestPain", label: "Você sente dor no peito provocada por atividades físicas?" },
                    { key: "recentChestPain", label: "Você sentiu dor no peito no último mês?" },
                    { key: "dizziness", label: "Você tende a perder a consciência ou cair como resultado de tonteira?" },
                    { key: "boneProblem", label: "Você tem algum problema ósseo ou articular que poderia piorar com atividades físicas?" },
                    { key: "bpMedication", label: "Algum médico está prescrevendo medicamento para pressão arterial ou problema cardíaco?" },
                    { key: "otherReason", label: "Existe alguma outra razão pela qual você não deveria praticar atividade física?" },
                  ].map(item => (
                    <div key={item.key} className="flex items-start gap-2">
                      <Checkbox
                        id={`parq-${item.key}`}
                        checked={!!form.parq[item.key]}
                        onCheckedChange={(v) => updateParq(item.key, !!v)}
                        className="mt-0.5"
                      />
                      <Label htmlFor={`parq-${item.key}`} className="text-xs leading-tight cursor-pointer">{item.label}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Anamnese</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Doenças na família</Label>
                    <Input value={form.parq.familyDiseases || ""} onChange={(e) => updateParq("familyDiseases", e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Doenças pessoais</Label>
                    <Input value={form.parq.personalDiseases || ""} onChange={(e) => updateParq("personalDiseases", e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Restrições ao exercício</Label>
                    <Input value={form.parq.exerciseRestrictions || ""} onChange={(e) => updateParq("exerciseRestrictions", e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Cirurgias</Label>
                    <Input value={form.parq.surgeries || ""} onChange={(e) => updateParq("surgeries", e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Alergias</Label>
                    <Input value={form.parq.allergies || ""} onChange={(e) => updateParq("allergies", e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Lesões</Label>
                    <Input value={form.parq.injuries || ""} onChange={(e) => updateParq("injuries", e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Medicamentos em uso</Label>
                    <Input value={form.parq.medications || ""} onChange={(e) => updateParq("medications", e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Dores corporais</Label>
                    <Input value={form.parq.bodyPain || ""} onChange={(e) => updateParq("bodyPain", e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="parq-smoking" checked={!!form.parq.smoking} onCheckedChange={(v) => updateParq("smoking", !!v)} />
                    <Label htmlFor="parq-smoking" className="text-xs cursor-pointer">Fumante</Label>
                  </div>
                  <div>
                    <Label className="text-xs">Objetivos</Label>
                    <Textarea value={form.parq.objectives || ""} onChange={(e) => updateParq("objectives", e.target.value)} className="text-sm" rows={2} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Flexiteste */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Flexiteste (Nível 0-4)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: "flexaoOmbro", label: "Flexão de Ombro" },
                    { key: "extensaoOmbro", label: "Extensão de Ombro" },
                    { key: "aducaoOmbro", label: "Adução Horizontal de Ombro" },
                    { key: "abducaoOmbro", label: "Abdução de Ombro" },
                    { key: "flexaoCotovelo", label: "Flexão de Cotovelo" },
                    { key: "extensaoCotovelo", label: "Extensão de Cotovelo" },
                    { key: "flexaoPunho", label: "Flexão de Punho" },
                    { key: "extensaoPunho", label: "Extensão de Punho" },
                    { key: "flexaoQuadril", label: "Flexão de Quadril" },
                    { key: "extensaoQuadril", label: "Extensão de Quadril" },
                    { key: "flexaoJoelho", label: "Flexão de Joelho" },
                    { key: "extensaoJoelho", label: "Extensão de Joelho" },
                    { key: "flexaoTronco", label: "Flexão de Tronco" },
                    { key: "extensaoTronco", label: "Extensão de Tronco" },
                    { key: "flexaoLatTronco", label: "Flexão Lateral de Tronco" },
                    { key: "dorsoFlexaoPlantar", label: "Dorso Flexão Plantar" },
                  ].map(item => (
                    <div key={item.key}>
                      <Label className="text-xs text-gray-600">{item.label}</Label>
                      <Select
                        value={String(form.flexiteste[item.key] ?? "")}
                        onValueChange={(v) => updateFlexiteste(item.key, parseInt(v))}
                      >
                        <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="-" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0 - Muito baixa</SelectItem>
                          <SelectItem value="1">1 - Baixa</SelectItem>
                          <SelectItem value="2">2 - Média</SelectItem>
                          <SelectItem value="3">3 - Alta</SelectItem>
                          <SelectItem value="4">4 - Muito alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                {Object.keys(form.flexiteste).length > 0 && (
                  <div className="mt-3 p-2 bg-green-50 rounded text-sm text-green-700 font-medium">
                    Flexibilidade Global: {Object.values(form.flexiteste).reduce((a, b) => a + b, 0)} / {Object.keys(form.flexiteste).length * 4}
                    {" "}({((Object.values(form.flexiteste).reduce((a, b) => a + b, 0) / (Object.keys(form.flexiteste).length * 4)) * 100).toFixed(0)}%)
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: Resultados Calculados */}
        <TabsContent value="resultados">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Composição Corporal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <ResultRow label="IMC" value={calculated.bmi.toFixed(1)} unit="kg/m²" classification={calculated.bmiClass} />
                  <ResultRow label="RCQ" value={calculated.rcq.toFixed(3)} classification={getRCQClassification(calculated.rcq, studentSex, age)} />
                  <ResultRow label="% Gordura" value={calculated.bodyFatPct.toFixed(1)} unit="%" classification={calculated.bfClass} />
                  <ResultRow label="Massa Gorda" value={calculated.fatMass.toFixed(1)} unit="kg" />
                  <ResultRow label="Massa Magra" value={calculated.leanMass.toFixed(1)} unit="kg" />
                  <ResultRow label="Massa Muscular" value={calculated.muscleMass.toFixed(1)} unit="kg" />
                  <ResultRow label="Massa Residual" value={calculated.residualMass.toFixed(1)} unit="kg" />
                  <ResultRow label="Massa Óssea" value={calculated.boneMass.toFixed(1)} unit="kg" />
                  <ResultRow label="TMB (Harris-Benedict)" value={calculated.bmr.toFixed(0)} unit="kcal/dia" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Somatotipo (Heath-Carter)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <ResultRow label="Endomorfia" value={calculated.endomorphy.toFixed(1)} />
                  <ResultRow label="Mesomorfia" value={calculated.mesomorphy.toFixed(1)} />
                  <ResultRow label="Ectomorfia" value={calculated.ectomorphy.toFixed(1)} />
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-sm text-gray-600">Classificação</p>
                    <p className="text-lg font-bold text-blue-700">{calculated.somatoLabel || "—"}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {calculated.endomorphy.toFixed(1)} - {calculated.mesomorphy.toFixed(1)} - {calculated.ectomorphy.toFixed(1)}
                    </p>
                  </div>
                </div>

                {/* Simple visual representation */}
                {calculated.bodyFatPct > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Composição Corporal</p>
                    <div className="flex h-6 rounded-full overflow-hidden">
                      <div className="bg-yellow-400 flex items-center justify-center text-[10px] font-bold text-yellow-800"
                        style={{ width: `${(calculated.fatMass / parseFloat(form.weight || "1")) * 100}%` }}>
                        Gord.
                      </div>
                      <div className="bg-red-400 flex items-center justify-center text-[10px] font-bold text-red-800"
                        style={{ width: `${(calculated.muscleMass / parseFloat(form.weight || "1")) * 100}%` }}>
                        Musc.
                      </div>
                      <div className="bg-blue-300 flex items-center justify-center text-[10px] font-bold text-blue-800"
                        style={{ width: `${(calculated.residualMass / parseFloat(form.weight || "1")) * 100}%` }}>
                        Res.
                      </div>
                      <div className="bg-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-600"
                        style={{ width: `${(calculated.boneMass / parseFloat(form.weight || "1")) * 100}%` }}>
                        Oss.
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: Observações */}
        <TabsContent value="observacoes">
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div>
                <Label className="text-sm font-semibold">Objetivos</Label>
                <Textarea value={form.goals} onChange={(e) => updateField("goals", e.target.value)} rows={3} placeholder="Objetivos do aluno..." />
              </div>
              <div>
                <Label className="text-sm font-semibold">Observações</Label>
                <Textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)} rows={3} placeholder="Observações gerais..." />
              </div>
              <div>
                <Label className="text-sm font-semibold">Considerações Finais</Label>
                <Textarea value={form.considerations} onChange={(e) => updateField("considerations", e.target.value)} rows={3} placeholder="Considerações e recomendações..." />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============ HELPER COMPONENTS ============

function ResultRow({ label, value, unit, classification }: { label: string; value: string; unit?: string; classification?: string }) {
  const numVal = parseFloat(value);
  if (!numVal || numVal === 0) return null;
  return (
    <div className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="text-right">
        <span className="text-sm font-semibold">{value} {unit && <span className="text-gray-400 font-normal">{unit}</span>}</span>
        {classification && <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{classification}</span>}
      </div>
    </div>
  );
}

// ============ HELPER FUNCTIONS ============

function getProtocolSkinfolds(protocol: string): string {
  const info: Record<string, string> = {
    jackson_pollock_7: "Dobras utilizadas: Subescapular, Tríceps, Peitoral, Axilar Média, Supra-ilíaca, Abdominal, Coxa",
    jackson_pollock_3: "Dobras utilizadas: Homens: Peitoral, Abdominal, Coxa | Mulheres: Tríceps, Supra-ilíaca, Coxa",
    guedes_3: "Dobras utilizadas: Homens: Subescapular, Supra-ilíaca, Abdominal | Mulheres: Supra-ilíaca, Coxa, Subescapular",
    faulkner: "Dobras utilizadas: Subescapular, Tríceps, Supra-ilíaca, Abdominal",
    deurenberg: "Utiliza IMC (peso e altura), idade e sexo — não requer dobras cutâneas",
    weltman: "Utiliza circunferência da cintura, peso e altura — não requer dobras cutâneas",
    petroski: "Dobras utilizadas: Subescapular, Tríceps, Supra-ilíaca, Panturrilha",
    durnin_womersley: "Dobras utilizadas: Bíceps, Tríceps, Subescapular, Supra-ilíaca",
    slaughter: "Dobras utilizadas: Tríceps, Subescapular (para crianças e adolescentes)",
  };
  return info[protocol] || "";
}

function getRCQClassification(rcq: number, sex: string, age: number): string {
  if (rcq <= 0) return "";
  if (sex === "M") {
    if (rcq < 0.83) return "Baixo";
    if (rcq < 0.90) return "Moderado";
    if (rcq < 0.95) return "Alto";
    return "Muito alto";
  }
  if (rcq < 0.72) return "Baixo";
  if (rcq < 0.82) return "Moderado";
  if (rcq < 0.87) return "Alto";
  return "Muito alto";
}

function loadFromAssessment(a: any): AssessmentFormData {
  const toStr = (v: any) => v != null ? String(v) : "";
  let flexiteste = {};
  let posturalAssessment = emptyForm.posturalAssessment;
  let parq = {};

  try { if (a.flexiteste) flexiteste = JSON.parse(a.flexiteste); } catch {}
  try { if (a.posturalAssessment) posturalAssessment = JSON.parse(a.posturalAssessment); } catch {}
  try { if (a.parq) parq = JSON.parse(a.parq); } catch {}

  return {
    assessmentDate: a.assessmentDate ? new Date(a.assessmentDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    assessmentNumber: a.assessmentNumber || 1,
    protocol: a.protocol || "jackson_pollock_7",
    weight: toStr(a.weight), height: toStr(a.height),
    shoulder: toStr(a.shoulder), chest: toStr(a.chest), waist: toStr(a.waist),
    abdomen: toStr(a.abdomen), hips: toStr(a.hips),
    rightArm: toStr(a.rightArm), leftArm: toStr(a.leftArm),
    rightForearm: toStr(a.rightForearm), leftForearm: toStr(a.leftForearm),
    rightThigh: toStr(a.rightThigh), leftThigh: toStr(a.leftThigh),
    rightCalf: toStr(a.rightCalf), leftCalf: toStr(a.leftCalf), bust: toStr(a.bust),
    subscapularSkinfold: toStr(a.subscapularSkinfold), tricepsSkinfold: toStr(a.tricepsSkinfold),
    bicepsSkinfold: toStr(a.bicepsSkinfold), pectoralSkinfold: toStr(a.pectoralSkinfold),
    midaxillarySkinfold: toStr(a.midaxillarySkinfold), suprailiacSkinfold: toStr(a.suprailiacSkinfold),
    abdominalSkinfold: toStr(a.abdominalSkinfold), thighSkinfold: toStr(a.thighSkinfold),
    calfSkinfold: toStr(a.calfSkinfold),
    humerusDiameter: toStr(a.humerusDiameter), wristDiameter: toStr(a.wristDiameter), femurDiameter: toStr(a.femurDiameter),
    systolicBP: toStr(a.systolicBP), diastolicBP: toStr(a.diastolicBP), restingHR: toStr(a.restingHR),
    abdominalReps: toStr(a.abdominalReps), pushupReps: toStr(a.pushupReps),
    cooperDistance: toStr(a.cooperDistance), cooperSpeed: toStr(a.cooperSpeed),
    flexiteste, posturalAssessment, parq,
    notes: a.notes || "", considerations: a.considerations || "", goals: a.goals || "",
  };
}
