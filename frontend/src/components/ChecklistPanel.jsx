import { useState } from 'react'

const GROUP_COLORS = {
  'Tiêu chuẩn SEO': 'bg-blue-100 text-blue-700',
  'Tiêu chuẩn dễ đọc': 'bg-emerald-100 text-emerald-700',
}

export default function ChecklistPanel({ results }) {
  const [filter, setFilter] = useState('all')

  const grouped = results.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = []
    acc[r.category].push(r)
    return acc
  }, {})

  const filtered = Object.entries(grouped).filter(([, items]) => {
    if (filter === 'pass') return items.every(i => i.pass)
    if (filter === 'fail') return items.some(i => !i.pass)
    return true
  })

  const passed = results.filter(r => r.pass).length
  const failed = results.length - passed

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800">Kết quả Checklist</h2>
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full font-medium">✓ {passed} đạt</span>
          <span className="px-2 py-1 bg-red-50 text-red-700 rounded-full font-medium">✗ {failed} chưa đạt</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 px-5 pt-3 pb-1">
        {[['all','Tất cả'], ['fail','Chưa đạt'], ['pass','Đã đạt']].map(([v, label]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === v ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="divide-y divide-slate-50 max-h-[520px] overflow-y-auto px-2 pb-2">
        {filtered.map(([category, items]) => {
          const catPassed = items.every(i => i.pass)
          return (
            <div key={category} className="px-3 py-3">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${catPassed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {catPassed ? '✓' : '✗'}
                </span>
                <span className="text-sm font-medium text-slate-800">{category}</span>
              </div>
              <div className="ml-7 space-y-1.5">
                {items.map(item => (
                  <CheckItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-8">Không có kết quả</p>
        )}
      </div>
    </div>
  )
}

function CheckItem({ item }) {
  const [open, setOpen] = useState(false)
  return (
    <button
      onClick={() => setOpen(o => !o)}
      className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
        item.pass ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'
      }`}
    >
      <div className="flex items-start gap-2">
        <span className={`mt-0.5 flex-shrink-0 text-xs font-bold ${item.pass ? 'text-green-600' : 'text-red-600'}`}>
          {item.pass ? '✓' : '✗'}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`font-medium leading-tight ${item.pass ? 'text-green-800' : 'text-red-800'}`}>
            {item.check}
          </p>
          {item.value && (
            <p className={`text-xs mt-0.5 ${item.pass ? 'text-green-600' : 'text-red-600'}`}>
              {item.value}
            </p>
          )}
        </div>
        {item.group && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
            GROUP_COLORS[item.group] || 'bg-slate-100 text-slate-500'
          }`}>
            {item.group === 'Tiêu chuẩn SEO' ? 'SEO' : 'Dễ đọc'}
          </span>
        )}
      </div>
    </button>
  )
}
