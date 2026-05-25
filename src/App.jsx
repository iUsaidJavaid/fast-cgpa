import { useState, useEffect, useCallback } from "react";

// ── FAST-NU Grade Tables ──────────────────────────────────────────────────────
const BS_GRADES = [
  { letter: "A+", gpa: 4.0, minPct: 90 },
  { letter: "A",  gpa: 4.0, minPct: 85 },
  { letter: "A-", gpa: 3.7, minPct: 80 },
  { letter: "B+", gpa: 3.3, minPct: 75 },
  { letter: "B",  gpa: 3.0, minPct: 70 },
  { letter: "B-", gpa: 2.7, minPct: 65 },
  { letter: "C+", gpa: 2.3, minPct: 60 },
  { letter: "C",  gpa: 2.0, minPct: 55 },
  { letter: "C-", gpa: 1.7, minPct: 50 },
  { letter: "D",  gpa: 1.0, minPct: 45 },
  { letter: "F",  gpa: 0.0, minPct: 0  },
];
const MS_GRADES = [
  { letter: "A+", gpa: 4.0, minPct: 90 },
  { letter: "A",  gpa: 4.0, minPct: 85 },
  { letter: "A-", gpa: 3.7, minPct: 80 },
  { letter: "B+", gpa: 3.3, minPct: 75 },
  { letter: "B",  gpa: 3.0, minPct: 70 },
  { letter: "B-", gpa: 2.7, minPct: 65 },
  { letter: "C",  gpa: 2.0, minPct: 60 },
  { letter: "F",  gpa: 0.0, minPct: 0  },
];

const DEFAULT_COMPONENTS = [
  { id: "q",  name: "Quizzes",     total: 10,  obtained: "", weightage: 10 },
  { id: "a",  name: "Assignments", total: 10,  obtained: "", weightage: 10 },
  { id: "s1", name: "Sessional 1", total: 25,  obtained: "", weightage: 15 },
  { id: "s2", name: "Sessional 2", total: 25,  obtained: "", weightage: 15 },
  { id: "pr", name: "Project",     total: 10,  obtained: "", weightage: 10 },
  { id: "fn", name: "Finals",      total: 100, obtained: "", weightage: 40 },
];

const newSubject = (id) => ({
  id,
  name: `Course ${id}`,
  code: "",
  credits: 3,
  gradingType: "absolute",
  components: DEFAULT_COMPONENTS.map(c => ({ ...c })),
  relStats: { classAvg: "", stdDev: "", highestMarks: "", useSimple: false },
});

// ── Grade helpers ─────────────────────────────────────────────────────────────
function getGradeTable(program) { return program === "BS" ? BS_GRADES : MS_GRADES; }

function pctToGrade(pct, program) {
  const table = getGradeTable(program);
  for (const g of table) if (pct >= g.minPct) return g;
  return table[table.length - 1];
}

function computeSubjectPct(subject) {
  const totalWeight = subject.components.reduce((s, c) => s + Number(c.weightage || 0), 0);
  if (totalWeight === 0) return null;
  let weightedPct = 0;
  let coveredWeight = 0;
  for (const c of subject.components) {
    const w = Number(c.weightage || 0);
    const ob = c.obtained === "" ? null : Number(c.obtained);
    const tot = Number(c.total || 0);
    if (ob !== null && tot > 0) {
      weightedPct += (ob / tot) * 100 * (w / 100);
      coveredWeight += w;
    }
  }
  if (coveredWeight === 0) return null;
  return { rawPct: (weightedPct / (coveredWeight / 100)), coveredWeight, weightedPct };
}

function computeRelativePct(absolutePct, relStats) {
  if (!relStats) return absolutePct;
  const { classAvg, stdDev, highestMarks, useSimple } = relStats;
  if (absolutePct === null) return null;
  if (useSimple) {
    const hm = Number(highestMarks);
    if (!hm) return absolutePct;
    return Math.min(100, (absolutePct / hm) * 100);
  }
  const avg = Number(classAvg);
  const sd = Number(stdDev);
  if (!avg || !sd) return absolutePct;
  const z = (absolutePct - avg) / sd;
  return Math.min(100, Math.max(0, 50 + z * 15 + 50));
}

// ── localStorage hook ─────────────────────────────────────────────────────────
function useLocalStorage(key, initial) {
  const [state, setState] = useState(() => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : initial; }
    catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(state)); } catch {} }, [key, state]);
  return [state, setState];
}

// ── Icon components ───────────────────────────────────────────────────────────
const Icon = ({ path, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);
const Icons = {
  dashboard: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z",
  plus: "M12 5v14M5 12h14",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  chevronDown: "M6 9l6 6 6-6",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  trend: "M22 7l-8.5 8.5-5-5L2 17",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01",
};

// ── Grade badge ───────────────────────────────────────────────────────────────
const gradeBg = { "A+": "#059669", "A": "#10b981", "A-": "#34d399",
  "B+": "#3b82f6","B": "#60a5fa","B-": "#93c5fd",
  "C+": "#f59e0b","C": "#fbbf24","C-": "#fcd34d",
  "D": "#ef4444", "F": "#991b1b" };

function GradeBadge({ letter }) {
  const bg = gradeBg[letter] || "#6b7280";
  return (
    <span style={{ background: bg }} className="text-white text-xs font-bold px-2 py-0.5 rounded-full">
      {letter}
    </span>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ value, max = 100, color = "#6366f1" }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div className="h-2 rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = "#6366f1", icon }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
        {icon && <span style={{ color }} className="opacity-70"><Icon path={icon} size={16} /></span>}
      </div>
      <div className="text-3xl font-black" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBJECT PANEL
// ═══════════════════════════════════════════════════════════════════════════════
function SubjectPanel({ subject, program, onChange, onDelete }) {
  const gradeTable = getGradeTable(program);
  const totalWeight = subject.components.reduce((s, c) => s + Number(c.weightage || 0), 0);
  const weightOk = totalWeight === 100;

  const result = computeSubjectPct(subject);
  let displayPct = result ? result.rawPct : null;
  if (subject.gradingType === "relative" && displayPct !== null) {
    displayPct = computeRelativePct(displayPct, subject.relStats);
  }
  const currentGrade = displayPct !== null ? pctToGrade(displayPct, program) : null;

  const updateComp = (idx, field, val) => {
    const comps = subject.components.map((c, i) => i === idx ? { ...c, [field]: val } : c);
    onChange({ ...subject, components: comps });
  };

  const updateRel = (field, val) => {
    onChange({ ...subject, relStats: { ...subject.relStats, [field]: val } });
  };

  // Target predictor for finals
  const finalsComp = subject.components.find(c => c.id === "fn");
  const finalsWeight = finalsComp ? Number(finalsComp.weightage || 0) : 0;
  const resultWithoutFinals = (() => {
    let wp = 0, cw = 0;
    for (const c of subject.components) {
      if (c.id === "fn") continue;
      const w = Number(c.weightage || 0);
      const ob = c.obtained === "" ? null : Number(c.obtained);
      const tot = Number(c.total || 0);
      if (ob !== null && tot > 0) { wp += (ob / tot) * 100 * (w / 100); cw += w; }
    }
    return cw > 0 ? { wp, cw } : null;
  })();

  const targets = finalsComp && resultWithoutFinals && finalsComp.obtained === ""
    ? ["A+","A","B+","B"].map(letter => {
        const g = gradeTable.find(x => x.letter === letter);
        if (!g) return null;
        const needed = (g.minPct - resultWithoutFinals.wp * 100 / 100) / (finalsWeight / 100);
        return { letter, gpa: g.gpa, needed: Math.ceil(needed), total: Number(finalsComp.total || 100) };
      }).filter(Boolean)
    : [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
        <div className="flex-1 flex flex-col sm:flex-row gap-2">
          <input value={subject.name}
            onChange={e => onChange({ ...subject, name: e.target.value })}
            className="font-bold text-gray-800 bg-transparent border-b-2 border-indigo-200 focus:border-indigo-500 outline-none text-lg w-full sm:w-48 transition-colors"
            placeholder="Course Name" />
          <input value={subject.code}
            onChange={e => onChange({ ...subject, code: e.target.value })}
            className="text-sm text-gray-500 bg-transparent border-b border-gray-200 focus:border-indigo-400 outline-none w-28 transition-colors"
            placeholder="Code (e.g. CS301)" />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {currentGrade && <GradeBadge letter={currentGrade.letter} />}
          {displayPct !== null && (
            <span className="text-sm font-semibold text-gray-600">{displayPct.toFixed(1)}%</span>
          )}
          <button onClick={onDelete} className="text-gray-300 hover:text-red-400 transition-colors">
            <Icon path={Icons.trash} size={16} />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Meta row */}
        <div className="flex flex-wrap gap-4 items-center">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Credit Hours</span>
            <select value={subject.credits}
              onChange={e => onChange({ ...subject, credits: Number(e.target.value) })}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-indigo-400 bg-gray-50">
              {[1,2,3,4].map(n => <option key={n} value={n}>{n} CH</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Grading Type</span>
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              {["absolute","relative"].map(t => (
                <button key={t}
                  onClick={() => onChange({ ...subject, gradingType: t })}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors capitalize ${
                    subject.gradingType === t
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                  }`}>{t}</button>
              ))}
            </div>
          </label>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Weightage Total</span>
            <span className={`text-sm font-bold px-3 py-1.5 rounded-lg ${
              weightOk ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
            }`}>{totalWeight}% {weightOk ? "✓" : "(must be 100%)"}</span>
          </div>
        </div>

        {/* Relative grading stats */}
        {subject.gradingType === "relative" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-amber-800">Relative Grading Parameters</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-amber-700">Simple Mode</span>
                <div onClick={() => updateRel("useSimple", !subject.relStats.useSimple)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                    subject.relStats.useSimple ? "bg-amber-500" : "bg-gray-300"
                  }`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    subject.relStats.useSimple ? "translate-x-4" : "translate-x-0.5"
                  }`} />
                </div>
              </label>
            </div>
            {subject.relStats.useSimple ? (
              <div>
                <label className="text-xs text-amber-700 font-medium">Highest Marks in Class</label>
                <input type="number" value={subject.relStats.highestMarks}
                  onChange={e => updateRel("highestMarks", e.target.value)}
                  className="mt-1 block w-32 border border-amber-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-amber-500" placeholder="e.g. 87" />
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                <div>
                  <label className="text-xs text-amber-700 font-medium">Class Average (μ)</label>
                  <input type="number" value={subject.relStats.classAvg}
                    onChange={e => updateRel("classAvg", e.target.value)}
                    className="mt-1 block w-28 border border-amber-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-amber-500" placeholder="e.g. 62" />
                </div>
                <div>
                  <label className="text-xs text-amber-700 font-medium">Std. Deviation (σ)</label>
                  <input type="number" value={subject.relStats.stdDev}
                    onChange={e => updateRel("stdDev", e.target.value)}
                    className="mt-1 block w-28 border border-amber-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-amber-500" placeholder="e.g. 12" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Components table */}
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-semibold">Component</th>
                <th className="text-center px-3 py-3 font-semibold w-20">Total</th>
                <th className="text-center px-3 py-3 font-semibold w-24">Obtained</th>
                <th className="text-center px-3 py-3 font-semibold w-20">Weight %</th>
                <th className="text-center px-3 py-3 font-semibold w-16">Score</th>
              </tr>
            </thead>
            <tbody>
              {subject.components.map((comp, idx) => {
                const scored = comp.obtained !== "" && Number(comp.total) > 0
                  ? ((Number(comp.obtained) / Number(comp.total)) * 100).toFixed(0)
                  : null;
                return (
                  <tr key={comp.id} className="border-t border-gray-50 hover:bg-indigo-50/30 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-gray-700">{comp.name}</td>
                    <td className="px-3 py-2.5">
                      <input type="number" value={comp.total}
                        onChange={e => updateComp(idx, "total", e.target.value)}
                        className="w-16 text-center border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-indigo-400 bg-gray-50" />
                    </td>
                    <td className="px-3 py-2.5">
                      <input type="number" value={comp.obtained}
                        onChange={e => updateComp(idx, "obtained", e.target.value)}
                        placeholder="—"
                        min={0} max={comp.total}
                        className="w-20 text-center border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-indigo-400 bg-white" />
                    </td>
                    <td className="px-3 py-2.5">
                      <input type="number" value={comp.weightage}
                        onChange={e => updateComp(idx, "weightage", Number(e.target.value))}
                        className="w-16 text-center border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-indigo-400 bg-gray-50" />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {scored !== null ? (
                        <span className={`text-xs font-bold ${
                          Number(scored) >= 70 ? "text-green-600" :
                          Number(scored) >= 50 ? "text-amber-500" : "text-red-500"
                        }`}>{scored}%</span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Target predictor */}
        {targets.length > 0 && (
          <div className="bg-indigo-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
              <Icon path={Icons.target} size={13} /> Finals Target to Achieve Grade
            </p>
            <div className="flex flex-wrap gap-2">
              {targets.map(t => (
                <div key={t.letter} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                  t.needed > t.total ? "bg-red-100 text-red-600" :
                  t.needed <= 0 ? "bg-green-100 text-green-600" :
                  "bg-white text-gray-700 border border-indigo-200"
                }`}>
                  <GradeBadge letter={t.letter} />
                  <span className="font-semibold">
                    {t.needed <= 0 ? "Already achieved!" :
                     t.needed > t.total ? "Not possible" :
                     `${t.needed}/${t.total}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current result */}
        {displayPct !== null && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Current Score</span>
              <span className="font-bold text-gray-800">{displayPct.toFixed(2)}%
                {currentGrade && <span className="ml-2 text-indigo-600">GPA {currentGrade.gpa.toFixed(1)}</span>}
              </span>
            </div>
            <ProgressBar value={displayPct} max={100}
              color={displayPct >= 80 ? "#10b981" : displayPct >= 65 ? "#3b82f6" : displayPct >= 50 ? "#f59e0b" : "#ef4444"} />
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function Dashboard({ subjects, program, prevCGPA, prevCredits, onChange }) {
  const gradeTable = getGradeTable(program);

  const subjectResults = subjects.map(s => {
    const r = computeSubjectPct(s);
    if (!r) return { subject: s, pct: null, grade: null };
    let pct = r.rawPct;
    if (s.gradingType === "relative") pct = computeRelativePct(pct, s.relStats);
    const grade = pctToGrade(pct, program);
    return { subject: s, pct, grade };
  });

  const semGPA = (() => {
    let totalQP = 0, totalCH = 0;
    for (const r of subjectResults) {
      if (r.grade) {
        totalQP += r.grade.gpa * r.subject.credits;
        totalCH += r.subject.credits;
      }
    }
    return totalCH > 0 ? { gpa: totalQP / totalCH, credits: totalCH } : null;
  })();

  const cumCGPA = (() => {
    const pc = Number(prevCGPA || 0);
    const ph = Number(prevCredits || 0);
    if (!semGPA) return pc ? { cgpa: pc, totalCredits: ph } : null;
    if (!pc || !ph) return { cgpa: semGPA.gpa, totalCredits: semGPA.credits };
    const totalQP = pc * ph + semGPA.gpa * semGPA.credits;
    const totalCH = ph + semGPA.credits;
    return { cgpa: totalQP / totalCH, totalCredits: totalCH };
  })();

  const cgpaColor = !cumCGPA ? "#6b7280"
    : cumCGPA.cgpa >= 3.5 ? "#059669"
    : cumCGPA.cgpa >= 3.0 ? "#3b82f6"
    : cumCGPA.cgpa >= 2.0 ? "#f59e0b" : "#ef4444";

  return (
    <div className="space-y-6">
      {/* Headline stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Semester GPA" icon={Icons.trend}
          value={semGPA ? semGPA.gpa.toFixed(2) : "—"}
          sub={semGPA ? `${semGPA.credits} credit hours` : "Add marks to calculate"}
          color="#6366f1" />
        <StatCard label="Cumulative CGPA" icon={Icons.target}
          value={cumCGPA ? cumCGPA.cgpa.toFixed(2) : "—"}
          sub={cumCGPA ? `${cumCGPA.totalCredits} total credits` : "—"}
          color={cgpaColor} />
        <StatCard label="Courses" icon={Icons.book}
          value={subjects.length}
          sub={`${subjectResults.filter(r => r.grade).length} calculated`}
          color="#8b5cf6" />
        <StatCard label="Program" icon={Icons.settings}
          value={program}
          sub="Grading Scale"
          color="#0891b2" />
      </div>

      {/* CGPA progress bar */}
      {cumCGPA && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">CGPA Progress</span>
            <span className="text-sm text-gray-500">Target: 4.00</span>
          </div>
          <ProgressBar value={cumCGPA.cgpa} max={4.0} color={cgpaColor} />
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>0.0</span><span>1.0</span><span>2.0</span><span>3.0</span><span>4.0</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[{l:"A (≥3.7)", v:3.7},{l:"B (≥3.0)", v:3.0},{l:"C (≥2.0)", v:2.0}].map(t => (
              <span key={t.l} className={`text-xs px-2 py-0.5 rounded-full ${
                cumCGPA.cgpa >= t.v ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              }`}>{t.l} {cumCGPA.cgpa >= t.v ? "✓" : `(need ${(t.v - cumCGPA.cgpa).toFixed(2)} more)`}</span>
            ))}
          </div>
        </div>
      )}

      {/* Historical CGPA inputs */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Historical Data (Previous Semesters)</h3>
        <div className="flex flex-wrap gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 font-medium">Previous CGPA</span>
            <input type="number" step="0.01" min="0" max="4" value={prevCGPA}
              onChange={e => onChange("prevCGPA", e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-32 focus:outline-none focus:border-indigo-400 bg-gray-50"
              placeholder="e.g. 3.25" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 font-medium">Total Credit Hours Earned</span>
            <input type="number" min="0" value={prevCredits}
              onChange={e => onChange("prevCredits", e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:border-indigo-400 bg-gray-50"
              placeholder="e.g. 90" />
          </label>
        </div>
      </div>

      {/* Subject summary table */}
      {subjectResults.some(r => r.grade) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Course Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Course</th>
                  <th className="text-center px-3 py-3">CH</th>
                  <th className="text-center px-3 py-3">Score</th>
                  <th className="text-center px-3 py-3">Grade</th>
                  <th className="text-center px-3 py-3">GPA Pts</th>
                  <th className="text-left px-3 py-3">Progress</th>
                </tr>
              </thead>
              <tbody>
                {subjectResults.map(({ subject, pct, grade }) => (
                  <tr key={subject.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-800">{subject.name}</div>
                      {subject.code && <div className="text-xs text-gray-400">{subject.code}</div>}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-600">{subject.credits}</td>
                    <td className="px-3 py-3 text-center font-semibold text-gray-700">
                      {pct !== null ? `${pct.toFixed(1)}%` : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {grade ? <GradeBadge letter={grade.letter} /> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-indigo-600">
                      {grade ? grade.gpa.toFixed(1) : "—"}
                    </td>
                    <td className="px-3 py-3 w-32">
                      {pct !== null && (
                        <ProgressBar value={pct} max={100}
                          color={pct >= 80 ? "#10b981" : pct >= 65 ? "#3b82f6" : pct >= 50 ? "#f59e0b" : "#ef4444"} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grade scale reference */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Grade Scale — {program} Program</h3>
        </div>
        <div className="p-4 flex flex-wrap gap-2">
          {gradeTable.map(g => (
            <div key={g.letter} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
              <GradeBadge letter={g.letter} />
              <span className="text-xs text-gray-500">≥{g.minPct}%</span>
              <span className="text-xs font-bold text-gray-700">{g.gpa.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [program, setProgram]     = useLocalStorage("fast_program", "BS");
  const [subjects, setSubjects]   = useLocalStorage("fast_subjects", [newSubject(1)]);
  const [prevCGPA, setPrevCGPA]   = useLocalStorage("fast_prevCGPA", "");
  const [prevCH, setPrevCH]       = useLocalStorage("fast_prevCH", "");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const addSubject = () => {
    const id = Date.now();
    setSubjects(prev => [...prev, newSubject(id)]);
    setActiveTab(`sub_${id}`);
  };

  const updateSubject = useCallback((id, updated) => {
    setSubjects(prev => prev.map(s => s.id === id ? updated : s));
  }, []);

  const deleteSubject = (id) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    setActiveTab("dashboard");
  };

  const handleHistoricalChange = (field, val) => {
    if (field === "prevCGPA") setPrevCGPA(val);
    else setPrevCH(val);
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Icons.dashboard },
    ...subjects.map(s => ({ id: `sub_${s.id}`, label: s.name || "Course", icon: Icons.book, subjectId: s.id })),
  ];

  const activeSubject = subjects.find(s => `sub_${s.id}` === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 font-sans" style={{ fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          {/* Mobile menu toggle */}
          <button className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
            onClick={() => setSidebarOpen(o => !o)}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shadow-md">F</div>
            <div className="hidden sm:block">
              <div className="text-sm font-black text-gray-900 leading-none">FAST-NU</div>
              <div className="text-xs text-gray-400 leading-none">CGPA Calculator</div>
            </div>
          </div>

          <div className="flex-1" />

          {/* Program toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {["BS","MS"].map(p => (
              <button key={p} onClick={() => setProgram(p)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  program === p
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}>{p}</button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex relative">
        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-20 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`fixed lg:sticky top-14 h-[calc(100vh-3.5rem)] z-20 w-60 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 overflow-hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}>
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
            {navItems.map(item => (
              <button key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left group ${
                  activeTab === item.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}>
                <span className={activeTab === item.id ? "text-white/80" : "text-gray-400 group-hover:text-gray-600"}>
                  <Icon path={item.icon} size={15} />
                </span>
                <span className="truncate flex-1">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-3 border-t border-gray-100">
            <button onClick={addSubject}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">
              <Icon path={Icons.plus} size={15} /> Add Course
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 px-4 py-6 lg:px-6">
          {activeTab === "dashboard" ? (
            <>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-black text-gray-900">Dashboard</h1>
                  <p className="text-sm text-gray-400">Real-time GPA analytics</p>
                </div>
                <button onClick={addSubject}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
                  <Icon path={Icons.plus} size={15} /> Add Course
                </button>
              </div>
              <Dashboard subjects={subjects} program={program}
                prevCGPA={prevCGPA} prevCredits={prevCH}
                onChange={handleHistoricalChange} />
            </>
          ) : activeSubject ? (
            <>
              <div className="mb-5">
                <h1 className="text-xl font-black text-gray-900">{activeSubject.name || "Course"}</h1>
                <p className="text-sm text-gray-400">{activeSubject.code || "No code set"} · {activeSubject.credits} Credit Hours</p>
              </div>
              <SubjectPanel subject={activeSubject} program={program}
                onChange={updated => updateSubject(activeSubject.id, updated)}
                onDelete={() => deleteSubject(activeSubject.id)} />
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
