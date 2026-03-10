import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Scale,
  Ruler,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

interface StudentAssessmentsProps {
  onBack: () => void;
}

export default function StudentAssessments({ onBack }: StudentAssessmentsProps) {
  const { data: assessments = [], isLoading } = trpc.assessments.list.useQuery({ studentId: undefined });
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const sorted = [...assessments].sort(
    (a: any, b: any) => new Date(b.assessmentDate || b.createdAt).getTime() - new Date(a.assessmentDate || a.createdAt).getTime()
  );

  const latest: any = sorted[0];
  const previous: any = sorted[1];

  const fmt = (v: any) => (v != null && v !== "" ? Number(v).toFixed(1) : "—");
  const fmtInt = (v: any) => (v != null && v !== "" ? Math.round(Number(v)).toString() : "—");
  const diff = (curr: any, prev: any) => {
    if (curr == null || prev == null || curr === "" || prev === "") return null;
    return Number(curr) - Number(prev);
  };

  const DiffBadge = ({ value, invert = false }: { value: number | null; invert?: boolean }) => {
    if (value === null || Math.abs(value) < 0.01) return null;
    const isPositive = value > 0;
    const isGood = invert ? !isPositive : isPositive;
    return (
      <span className={`inline-flex items-center text-xs font-medium ml-1 ${isGood ? "text-green-600" : "text-red-500"}`}>
        {isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
        {isPositive ? "+" : ""}{value.toFixed(1)}
      </span>
    );
  };

  const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6"];

  // Evolution data for charts
  const evolutionData = [...sorted].reverse().map((a: any) => ({
    date: new Date(a.assessmentDate || a.createdAt).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
    peso: a.weight ? Number(a.weight) : null,
    imc: a.bmi ? Number(a.bmi) : null,
    gc: a.bodyFatPct ? Number(a.bodyFatPct) : null,
  }));

  const compositionData = latest && latest.fatMass && latest.leanMass ? [
    { name: "Massa Gorda", value: Number(latest.fatMass) },
    { name: "Massa Magra", value: Number(latest.leanMass) },
  ] : [];

  return (
    <div className="px-4 pt-4 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg bg-white shadow-sm">
          <ArrowLeft className="w-5 h-5 text-blue-600" />
        </button>
        <h2 className="text-xl font-bold text-gray-900">Minhas Avaliações</h2>
      </div>

      {sorted.length === 0 ? (
        <Card className="bg-white/90 rounded-2xl shadow-lg p-8 text-center">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma avaliação física registrada.</p>
          <p className="text-sm text-gray-400 mt-1">Solicite ao seu professor para realizar uma avaliação.</p>
        </Card>
      ) : (
        <Tabs defaultValue="resumo" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="evolucao">Evolução</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          {/* RESUMO TAB */}
          <TabsContent value="resumo" className="space-y-4">
            {latest && (
              <>
                {/* Main stats cards */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none rounded-2xl shadow">
                    <CardContent className="p-4 text-center">
                      <Scale className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-blue-700">{fmt(latest.weight)}</p>
                      <p className="text-xs text-blue-600">Peso (kg)</p>
                      <DiffBadge value={diff(latest.weight, previous?.weight)} invert />
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none rounded-2xl shadow">
                    <CardContent className="p-4 text-center">
                      <Ruler className="w-6 h-6 text-green-600 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-green-700">{fmt(latest.height)}</p>
                      <p className="text-xs text-green-600">Altura (cm)</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-none rounded-2xl shadow">
                    <CardContent className="p-4 text-center">
                      <Activity className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-purple-700">{fmt(latest.bmi)}</p>
                      <p className="text-xs text-purple-600">IMC</p>
                      <DiffBadge value={diff(latest.bmi, previous?.bmi)} invert />
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-none rounded-2xl shadow">
                    <CardContent className="p-4 text-center">
                      <TrendingDown className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-orange-700">{fmt(latest.bodyFatPct)}%</p>
                      <p className="text-xs text-orange-600">Gordura Corp.</p>
                      <DiffBadge value={diff(latest.bodyFatPct, previous?.bodyFatPct)} invert />
                    </CardContent>
                  </Card>
                </div>

                {/* Body composition */}
                {compositionData.length > 0 && (
                  <Card className="bg-white/90 rounded-2xl shadow-lg">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2 text-center">Composição Corporal</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={compositionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value.toFixed(1)}kg`}
                            labelLine={false}
                          >
                            {compositionData.map((_: any, idx: number) => (
                              <Cell key={idx} fill={COLORS[idx]} />
                            ))}
                          </Pie>
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Detailed measurements */}
                <Card className="bg-white/90 rounded-2xl shadow-lg">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Medidas Detalhadas</h3>
                    <div className="space-y-2 text-sm">
                      {[
                        { label: "RCQ", val: latest.rcq, prev: previous?.rcq, inv: true },
                        { label: "Massa Gorda", val: latest.fatMass, prev: previous?.fatMass, inv: true, unit: "kg" },
                        { label: "Massa Magra", val: latest.leanMass, prev: previous?.leanMass, inv: false, unit: "kg" },
                        { label: "Massa Muscular", val: latest.muscleMass, prev: previous?.muscleMass, inv: false, unit: "kg" },
                        { label: "Massa Óssea", val: latest.boneMass, prev: previous?.boneMass, inv: false, unit: "kg" },
                        { label: "TMB", val: latest.bmr, prev: previous?.bmr, inv: false, unit: "kcal" },
                      ].map((row) => (
                        row.val != null && row.val !== "" && (
                          <div key={row.label} className="flex justify-between items-center py-1 border-b border-gray-100">
                            <span className="text-gray-600">{row.label}</span>
                            <span className="font-medium text-gray-900">
                              {fmt(row.val)} {row.unit || ""}
                              <DiffBadge value={diff(row.val, row.prev)} invert={row.inv} />
                            </span>
                          </div>
                        )
                      ))}
                    </div>

                    {/* Circumferences */}
                    {(latest.waist || latest.hips || latest.chest || latest.rightArm || latest.rightThigh) && (
                      <>
                        <h4 className="font-semibold text-gray-700 mt-4 mb-2">Perímetros (cm)</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          {[
                            { label: "Tórax", val: latest.chest, prev: previous?.chest },
                            { label: "Cintura", val: latest.waist, prev: previous?.waist },
                            { label: "Abdômen", val: latest.abdomen, prev: previous?.abdomen },
                            { label: "Quadril", val: latest.hips, prev: previous?.hips },
                            { label: "Braço D", val: latest.rightArm, prev: previous?.rightArm },
                            { label: "Braço E", val: latest.leftArm, prev: previous?.leftArm },
                            { label: "Coxa D", val: latest.rightThigh, prev: previous?.rightThigh },
                            { label: "Coxa E", val: latest.leftThigh, prev: previous?.leftThigh },
                            { label: "Panturrilha D", val: latest.rightCalf, prev: previous?.rightCalf },
                            { label: "Panturrilha E", val: latest.leftCalf, prev: previous?.leftCalf },
                            { label: "Ombro", val: latest.shoulder, prev: previous?.shoulder },
                            { label: "Busto", val: latest.bust, prev: previous?.bust },
                          ].filter(r => r.val != null && r.val !== "").map(row => (
                            <div key={row.label} className="flex justify-between py-0.5">
                              <span className="text-gray-500">{row.label}</span>
                              <span className="font-medium">{fmt(row.val)}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Somatotype */}
                    {latest.endomorphy && (
                      <>
                        <h4 className="font-semibold text-gray-700 mt-4 mb-2">Somatotipo</h4>
                        <div className="flex gap-4 text-sm">
                          <div className="text-center">
                            <p className="text-lg font-bold text-red-500">{fmt(latest.endomorphy)}</p>
                            <p className="text-xs text-gray-500">Endo</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-blue-500">{fmt(latest.mesomorphy)}</p>
                            <p className="text-xs text-gray-500">Meso</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-green-500">{fmt(latest.ectomorphy)}</p>
                            <p className="text-xs text-gray-500">Ecto</p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <p className="text-xs text-gray-400 text-center">
                  Última avaliação: {new Date(latest.assessmentDate || latest.createdAt).toLocaleDateString("pt-BR")}
                  {latest.protocol && ` | Protocolo: ${latest.protocol}`}
                </p>
              </>
            )}
          </TabsContent>

          {/* EVOLUÇÃO TAB */}
          <TabsContent value="evolucao" className="space-y-4">
            {evolutionData.length < 2 ? (
              <Card className="bg-white/90 rounded-2xl shadow-lg p-6 text-center">
                <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">É necessário pelo menos 2 avaliações para ver a evolução.</p>
              </Card>
            ) : (
              <>
                {/* Weight chart */}
                {evolutionData.some(d => d.peso != null) && (
                  <Card className="bg-white/90 rounded-2xl shadow-lg">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">Peso (kg)</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={evolutionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="peso" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Peso" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* IMC chart */}
                {evolutionData.some(d => d.imc != null) && (
                  <Card className="bg-white/90 rounded-2xl shadow-lg">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">IMC</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={evolutionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="imc" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} name="IMC" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Body fat chart */}
                {evolutionData.some(d => d.gc != null) && (
                  <Card className="bg-white/90 rounded-2xl shadow-lg">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">% Gordura Corporal</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={evolutionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="gc" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="% Gordura" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* HISTÓRICO TAB */}
          <TabsContent value="historico" className="space-y-3">
            {sorted.map((assessment: any) => {
              const isExpanded = expandedId === assessment.id;
              return (
                <Card key={assessment.id} className="bg-white/90 rounded-2xl shadow-lg overflow-hidden">
                  <CardContent className="p-0">
                    <button
                      className="w-full p-4 flex items-center justify-between text-left"
                      onClick={() => setExpandedId(isExpanded ? null : assessment.id)}
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          Avaliação #{assessment.assessmentNumber || assessment.id}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(assessment.assessmentDate || assessment.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium">{fmt(assessment.weight)} kg</p>
                          {assessment.bodyFatPct && (
                            <p className="text-xs text-gray-500">{fmt(assessment.bodyFatPct)}% GC</p>
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3 text-sm">
                        {/* General */}
                        <div className="grid grid-cols-2 gap-2">
                          <div><span className="text-gray-500">Peso:</span> <span className="font-medium">{fmt(assessment.weight)} kg</span></div>
                          <div><span className="text-gray-500">Altura:</span> <span className="font-medium">{fmt(assessment.height)} cm</span></div>
                          {assessment.bmi && <div><span className="text-gray-500">IMC:</span> <span className="font-medium">{fmt(assessment.bmi)}</span></div>}
                          {assessment.bodyFatPct && <div><span className="text-gray-500">%GC:</span> <span className="font-medium">{fmt(assessment.bodyFatPct)}%</span></div>}
                          {assessment.fatMass && <div><span className="text-gray-500">M. Gorda:</span> <span className="font-medium">{fmt(assessment.fatMass)} kg</span></div>}
                          {assessment.leanMass && <div><span className="text-gray-500">M. Magra:</span> <span className="font-medium">{fmt(assessment.leanMass)} kg</span></div>}
                          {assessment.muscleMass && <div><span className="text-gray-500">M. Muscular:</span> <span className="font-medium">{fmt(assessment.muscleMass)} kg</span></div>}
                          {assessment.boneMass && <div><span className="text-gray-500">M. Óssea:</span> <span className="font-medium">{fmt(assessment.boneMass)} kg</span></div>}
                          {assessment.rcq && <div><span className="text-gray-500">RCQ:</span> <span className="font-medium">{fmt(assessment.rcq)}</span></div>}
                          {assessment.bmr && <div><span className="text-gray-500">TMB:</span> <span className="font-medium">{fmtInt(assessment.bmr)} kcal</span></div>}
                        </div>

                        {/* Circumferences */}
                        {(assessment.waist || assessment.chest || assessment.rightArm) && (
                          <>
                            <p className="font-semibold text-gray-700 pt-1">Perímetros (cm)</p>
                            <div className="grid grid-cols-2 gap-1">
                              {[
                                { l: "Tórax", v: assessment.chest },
                                { l: "Cintura", v: assessment.waist },
                                { l: "Abdômen", v: assessment.abdomen },
                                { l: "Quadril", v: assessment.hips },
                                { l: "Braço D", v: assessment.rightArm },
                                { l: "Braço E", v: assessment.leftArm },
                                { l: "Coxa D", v: assessment.rightThigh },
                                { l: "Coxa E", v: assessment.leftThigh },
                                { l: "Pant. D", v: assessment.rightCalf },
                                { l: "Pant. E", v: assessment.leftCalf },
                              ].filter(r => r.v != null && r.v !== "").map(r => (
                                <div key={r.l}><span className="text-gray-500">{r.l}:</span> <span className="font-medium">{fmt(r.v)}</span></div>
                              ))}
                            </div>
                          </>
                        )}

                        {assessment.protocol && (
                          <p className="text-xs text-gray-400 pt-1">Protocolo: {assessment.protocol}</p>
                        )}
                        {assessment.notes && (
                          <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">{assessment.notes}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
