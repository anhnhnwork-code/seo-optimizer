export default function AIPanel({ ai }) {
  if (!ai) return null

  return (
    <div className="bg-white rounded-2xl border border-violet-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-violet-100 bg-violet-50 flex items-center gap-2">
        <span className="text-lg">✨</span>
        <h2 className="font-semibold text-violet-900">Phân tích AI (Claude)</h2>
      </div>

      <div className="p-5 space-y-5">
        {/* Overall */}
        {ai.overall_assessment && (
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Đánh giá tổng thể</h3>
            <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3 leading-relaxed">{ai.overall_assessment}</p>
          </div>
        )}

        {/* Quick checks */}
        <div className="grid grid-cols-3 gap-2">
          <QuickCheck
            label="Chính tả"
            pass={ai.spelling_pass}
            note={ai.spelling_errors?.length ? `${ai.spelling_errors.length} lỗi` : 'Không có lỗi'}
          />
          <QuickCheck
            label="Insight tiêu đề"
            pass={ai.title_insight_pass}
            note={ai.title_insight_note}
          />
          <QuickCheck
            label="Insight meta desc"
            pass={ai.meta_insight_pass}
            note={ai.meta_insight_note}
          />
        </div>

        {/* Spelling errors */}
        {ai.spelling_errors?.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Lỗi chính tả phát hiện</h3>
            <div className="flex flex-wrap gap-2">
              {ai.spelling_errors.map((err, i) => (
                <span key={i} className="text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg px-2 py-1">{err}</span>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {ai.suggestions?.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Gợi ý cải thiện</h3>
            <div className="space-y-3">
              {ai.suggestions.map((s, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-violet-700 uppercase">{s.area}</p>
                  <p className="text-sm text-slate-700"><span className="font-medium text-red-600">Vấn đề:</span> {s.issue}</p>
                  <p className="text-sm text-slate-700"><span className="font-medium text-blue-600">Gợi ý:</span> {s.suggestion}</p>
                  {s.example && (
                    <p className="text-sm text-slate-600 bg-blue-50 rounded-lg px-3 py-2 italic">"{s.example}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function QuickCheck({ label, pass, note }) {
  return (
    <div className={`rounded-xl p-3 text-center ${pass ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
      <p className={`text-lg font-bold ${pass ? 'text-green-600' : 'text-red-600'}`}>{pass ? '✓' : '✗'}</p>
      <p className="text-xs font-medium text-slate-700 mt-0.5">{label}</p>
      {note && <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{note}</p>}
    </div>
  )
}
