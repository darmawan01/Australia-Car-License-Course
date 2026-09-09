import React, { useState } from 'react';
import {
  AUSTRALIAN_ROAD_SIGNS,
  AUSTRALIAN_ROAD_MARKINGS,
  AUSTRALIAN_GLS_INFO
} from '../data/australiaRoadData';
import { OFFICIAL_DKT_QUESTIONS } from '../data/hazardScenarios';
import {
  X,
  BookOpen,
  AlertOctagon,
  ShieldCheck,
  Compass,
  FileCheck2,
  ExternalLink,
  MapPin,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface LicenseGuide2026Props {
  isOpen: boolean;
  onClose: () => void;
}

export const LicenseGuide2026: React.FC<LicenseGuide2026Props> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'gls' | 'critical_fails' | 'signs' | 'markings' | 'roundabouts' | 'dkt_quiz'>('gls');
  const [selectedState, setSelectedState] = useState<'NSW' | 'VIC' | 'QLD' | 'WA'>('NSW');
  const [quizAnswers, setQuizAnswers] = useState<{ [qId: string]: number }>({});

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 border border-blue-400/40 flex items-center justify-center text-white font-black text-sm">
              AU
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                2026 Australian Driver License & Road Rules Guide
              </h2>
              <p className="text-xs text-slate-400">
                Official RMS / Service NSW & VicRoads Road User Standards & Drive Test Criteria
              </p>
            </div>
          </div>

          <button
            id="close-guide-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 pb-2 border-b border-slate-800 bg-slate-950/40 overflow-x-auto text-xs font-bold scrollbar-none">
          <button
            onClick={() => setActiveTab('gls')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'gls'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>2026 License Stages (GLS)</span>
          </button>

          <button
            onClick={() => setActiveTab('critical_fails')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'critical_fails'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Immediate Fail Items (Critical Errors)</span>
          </button>

          <button
            onClick={() => setActiveTab('roundabouts')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'roundabouts'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Roundabout Rules 2026</span>
          </button>

          <button
            onClick={() => setActiveTab('signs')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'signs'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Australian Road Signs</span>
          </button>

          <button
            onClick={() => setActiveTab('markings')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'markings'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Line Markings</span>
          </button>

          <button
            id="tab-dkt-quiz"
            onClick={() => setActiveTab('dkt_quiz')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'dkt_quiz'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Official DKT Question Bank (NSW/VIC)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Tab 1: Graduated Licensing Scheme */}
          {activeTab === 'gls' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">Australian Graduated Licensing Scheme (GLS)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    How you progress from Learner to a Full Unrestricted License in Australia.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 p-1 rounded-lg">
                  {(['NSW', 'VIC', 'QLD', 'WA'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setSelectedState(st)}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                        selectedState === st ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AUSTRALIAN_GLS_INFO.stages.map((stage) => (
                  <div
                    key={stage.stage}
                    className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm border-2 ${stage.color}`}>
                          {stage.badge}
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          Min Age: {stage.minAge}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-2.5">{stage.stage}</h4>
                      <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                        <strong className="text-slate-200">Requirements:</strong> {stage.requirements}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      <p className="text-[11px] text-slate-400">
                        <strong className="text-amber-400 uppercase tracking-wide">Key Conditions:</strong> {stage.rules}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 120 Hours Logbook Breakdown */}
              <div className="bg-gradient-to-r from-blue-950/40 to-slate-900 p-4 rounded-xl border border-blue-900/40 text-xs text-slate-300 space-y-2">
                <h4 className="font-bold text-sm text-blue-300 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  2026 Logbook Requirements (NSW & VIC)
                </h4>
                <p>
                  Learner drivers under 25 years old must record at least <strong>120 hours of supervised driving</strong>, including a mandatory <strong>20 hours of night driving</strong> (between sunset and sunrise).
                </p>
                <p className="text-slate-400">
                  Every 1 hour completed with an accredited Australian driving instructor counts as 3 logbook hours (up to a maximum bonus of 30 hours).
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Immediate Fail Items */}
          {activeTab === 'critical_fails' && (
            <div className="space-y-4">
              <div className="bg-red-950/40 border border-red-900/60 p-4 rounded-xl text-red-200">
                <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5" />
                  Immediate Fail Items (Automatic Drive Test Failure)
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  During your practical on-road test, committing ANY of the following errors causes an immediate failure. The examiner will direct you to return to the testing center.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AUSTRALIAN_GLS_INFO.criticalImmediateFailItems.map((fail, i) => (
                  <div
                    key={fail.title}
                    className="bg-slate-950/90 border border-red-950/80 hover:border-red-900/60 rounded-xl p-3.5 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-red-600/30 text-red-400 border border-red-500/40 flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <h4 className="text-xs font-bold text-white">{fail.title}</h4>
                    </div>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed pl-7">
                      {fail.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
                <strong className="text-white">Minor Driving Faults Threshold:</strong> You can pass with minor infractions (such as delayed acceleration or imperfect steering hand glide) as long as you accumulate fewer than 15 minor points and commit zero critical safety errors.
              </div>
            </div>
          )}

          {/* Tab 3: Roundabout Rules 2026 */}
          {activeTab === 'roundabouts' && (
            <div className="space-y-5">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h3 className="text-base font-bold text-white">Australian Road Rules: Roundabouts (ARR Rule 114)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Roundabouts in Australia operate clockwise with strict lane and signalling requirements.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] font-extrabold uppercase text-blue-400 tracking-wider">Turn 1</span>
                  <h4 className="text-sm font-bold text-white mt-1">Turning Left (First Exit)</h4>
                  <ul className="text-xs text-slate-300 mt-2.5 space-y-1.5 list-disc list-inside">
                    <li>Approach in the <strong>Left Lane</strong>.</li>
                    <li>Indicate <strong>LEFT</strong> on approach.</li>
                    <li>Give way to any vehicle already circulating on your right.</li>
                    <li>Stay in the left lane through exit. Keep indicating left.</li>
                  </ul>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-400 tracking-wider">Turn 2</span>
                  <h4 className="text-sm font-bold text-white mt-1">Going Straight Ahead</h4>
                  <ul className="text-xs text-slate-300 mt-2.5 space-y-1.5 list-disc list-inside">
                    <li>Approach in either lane (as marked by road arrows).</li>
                    <li><strong>DO NOT</strong> indicate on approach.</li>
                    <li>Give way to traffic from right.</li>
                    <li>Indicate <strong>LEFT</strong> when passing the exit before the one you want.</li>
                  </ul>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] font-extrabold uppercase text-amber-400 tracking-wider">Turn 3</span>
                  <h4 className="text-sm font-bold text-white mt-1">Turning Right or U-Turn</h4>
                  <ul className="text-xs text-slate-300 mt-2.5 space-y-1.5 list-disc list-inside">
                    <li>Approach in the <strong>Right Lane</strong>.</li>
                    <li>Indicate <strong>RIGHT</strong> on approach.</li>
                    <li>Circulate around the center island in the right lane.</li>
                    <li>Change signal to <strong>LEFT</strong> just before your desired exit.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Australian Road Signs */}
          {activeTab === 'signs' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AUSTRALIAN_ROAD_SIGNS.map((sign) => (
                  <div
                    key={sign.id}
                    className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3.5"
                  >
                    <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 p-1">
                      {sign.iconType === 'stop' && (
                        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center font-black text-white text-xs shadow-inner">
                          STOP
                        </div>
                      )}
                      {sign.iconType === 'give_way' && (
                        <div className="w-0 h-0 border-l-[24px] border-l-transparent border-r-[24px] border-r-transparent border-t-[38px] border-t-red-600 relative">
                          <span className="absolute -top-8 -left-3 text-[8px] font-black text-white">GIVE</span>
                        </div>
                      )}
                      {sign.iconType.startsWith('speed_') && (
                        <div className="w-12 h-12 rounded-full border-4 border-red-600 bg-white flex items-center justify-center font-black text-slate-900 text-sm">
                          {sign.speedLimit}
                        </div>
                      )}
                      {sign.iconType === 'school_zone' && (
                        <div className="w-12 h-12 bg-amber-400 border border-black rounded p-0.5 flex flex-col items-center justify-center text-[7px] font-black text-black">
                          <span>SCHOOL</span>
                          <span className="text-[10px] text-red-600">40</span>
                        </div>
                      )}
                      {sign.iconType === 'roundabout' && (
                        <div className="w-11 h-11 bg-amber-400 rotate-45 flex items-center justify-center border border-black">
                          <Compass className="w-5 h-5 text-black -rotate-45" />
                        </div>
                      )}
                      {sign.iconType === 'pedestrian' && (
                        <div className="w-11 h-11 bg-amber-400 rotate-45 flex items-center justify-center border border-black">
                          <span className="text-[9px] font-black text-black -rotate-45">ZEBRA</span>
                        </div>
                      )}
                      {sign.iconType === 'keep_left' && (
                        <div className="w-12 h-12 bg-white border border-black flex flex-col items-center justify-center text-[7px] font-bold text-black">
                          <span>KEEP</span>
                          <span>LEFT ↙</span>
                        </div>
                      )}
                      {sign.iconType === 'kangaroo' && (
                        <div className="w-11 h-11 bg-amber-400 rotate-45 flex items-center justify-center border border-black">
                          <span className="text-[8px] font-black text-black -rotate-45">FAUNA</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800">
                          {sign.code}
                        </span>
                        <h4 className="text-xs font-bold text-white">{sign.name}</h4>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{sign.description}</p>
                      <p className="text-[11px] text-amber-300/90 mt-1.5 font-medium">
                        <strong>Test Standard:</strong> {sign.rule2026}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 5: Australian Road Markings */}
          {activeTab === 'markings' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AUSTRALIAN_ROAD_MARKINGS.map((mark) => (
                  <div
                    key={mark.id}
                    className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white">{mark.name}</h4>
                        <span className="text-[10px] font-mono text-slate-400">{mark.australianStandard}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{mark.meaning}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-amber-400">
                      <strong>Driving Assessment Impact:</strong> {mark.testConsequence}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 6: Official DKT Practice Questions */}
          {activeTab === 'dkt_quiz' && (
            <div className="space-y-4">
              <div className="bg-emerald-950/40 border border-emerald-500/40 p-3.5 rounded-xl text-xs text-emerald-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">Official Driver Knowledge Test (Class C) Question Bank</h3>
                  <p className="text-slate-300 text-[11px] mt-0.5">
                    Authentic questions sourced directly from the NSW Road User Handbook & VicRoads assessment guidelines.
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-xs bg-emerald-900/60 px-2 py-1 rounded border border-emerald-500/60">
                    {Object.keys(quizAnswers).length} / {OFFICIAL_DKT_QUESTIONS.length} Answered
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {OFFICIAL_DKT_QUESTIONS.map((q, idx) => {
                  const selected = quizAnswers[q.id];
                  const hasAnswered = selected !== undefined;
                  const isCorrect = selected === q.correctIndex;

                  return (
                    <div
                      key={q.id}
                      className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-blue-400 border border-slate-800 font-bold">
                          Question {idx + 1} • Code {q.code} • {q.category}
                        </span>
                        {hasAnswered && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            isCorrect ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                          }`}>
                            {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        {q.question}
                      </h4>

                      <div className="space-y-1.5">
                        {q.options.map((opt, optIdx) => {
                          let optStyle = 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850';
                          if (hasAnswered) {
                            if (optIdx === q.correctIndex) {
                              optStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-semibold';
                            } else if (selected === optIdx) {
                              optStyle = 'bg-red-950/80 border-red-500 text-red-200';
                            } else {
                              optStyle = 'bg-slate-900/40 border-slate-850 text-slate-500 opacity-60';
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              disabled={hasAnswered}
                              onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                              className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-start gap-2.5 ${optStyle}`}
                            >
                              <span className="w-5 h-5 rounded-full border border-current/40 flex items-center justify-center shrink-0 text-[10px] font-bold font-mono">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="flex-1 leading-snug">{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {hasAnswered && (
                        <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 bg-slate-900/50 p-2 rounded-lg">
                          <strong className="text-amber-400">Rule Explanation: </strong>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Based on the National Road Transport Commission Australian Road Rules & 2026 Testing Handbooks.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-md"
          >
            Back to Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
