export default function InputPanel({ form, setForm, onAnalyze, onAIAnalyze, loading, aiLoading, error, hasApiKey, onNeedApiKey }) {
  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const charCount = (val, max) => {
    const len = val.length
    const color = len > max ? 'text-red-500' : len > max * 0.85 ? 'text-yellow-500' : 'text-slate-400'
    return <span className={`text-xs ${color}`}>{len}/{max}</span>
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
      <h2 className="font-semibold text-slate-800 text-base">Thông tin bài viết</h2>

      {/* Keywords row */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Từ khóa chính *" hint="VD: dịch vụ SEO">
          <input
            className="input-base"
            placeholder="dịch vụ SEO tổng thể"
            value={form.main_keyword}
            onChange={set('main_keyword')}
          />
        </Field>
        <Field label="Từ khóa phụ" hint="Cách nhau bằng dấu phẩy">
          <input
            className="input-base"
            placeholder="SEO website, SEO onpage"
            value={form.secondary_keywords}
            onChange={set('secondary_keywords')}
          />
        </Field>
      </div>

      {/* H1 */}
      <Field label="Tiêu đề H1" right={charCount(form.h1, 65)}>
        <input
          className="input-base"
          placeholder="Tiêu đề chính của bài viết"
          value={form.h1}
          onChange={set('h1')}
        />
      </Field>

      {/* SEO Title */}
      <Field label="Tiêu đề SEO (Meta Title)" right={charCount(form.seo_title, 65)}>
        <input
          className="input-base"
          placeholder="Tiêu đề hiển thị trên Google (≤ 65 ký tự)"
          value={form.seo_title}
          onChange={set('seo_title')}
        />
      </Field>

      {/* Meta Description */}
      <Field label="Mô tả SEO (Meta Description)" right={charCount(form.meta_desc, 160)}>
        <textarea
          className="input-base resize-none h-20"
          placeholder="Mô tả ngắn hiển thị trên Google (120–160 ký tự)"
          value={form.meta_desc}
          onChange={set('meta_desc')}
        />
      </Field>

      {/* Content */}
      <Field label="Nội dung bài viết (HTML hoặc văn bản)" hint="Dán HTML từ editor">
        <textarea
          className="input-base resize-y min-h-[200px] font-mono text-xs"
          placeholder={'<h2>Giới thiệu</h2>\n<p>Nội dung bài viết...</p>'}
          value={form.content}
          onChange={set('content')}
        />
        {form.content && (
          <p className="text-xs text-slate-400 mt-1">
            {form.content.length.toLocaleString()} ký tự
          </p>
        )}
      </Field>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={onAnalyze}
          disabled={loading || aiLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
        >
          {loading ? 'Đang phân tích…' : '🔍 Phân tích SEO'}
        </button>
        <button
          onClick={hasApiKey ? onAIAnalyze : onNeedApiKey}
          disabled={loading || aiLoading}
          className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
        >
          {aiLoading ? 'AI đang xử lý…' : hasApiKey ? '✨ Phân tích AI' : '🔑 Nhập key để dùng AI'}
        </button>
      </div>
      <p className="text-xs text-slate-400 text-center">
        ✨ Phân tích AI dùng Anthropic API key của bạn, lưu trên trình duyệt
      </p>
    </div>
  )
}

function Field({ label, hint, right, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-slate-700">
          {label}
          {hint && <span className="text-slate-400 font-normal ml-1">— {hint}</span>}
        </label>
        {right}
      </div>
      {children}
    </div>
  )
}
