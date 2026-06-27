import { useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000'

const PRIORITY_CONFIG = {
  high:   { label: 'Ưu tiên cao',   color: 'bg-red-50 border-red-200',    dot: 'bg-red-500',    text: 'text-red-700'   },
  medium: { label: 'Ưu tiên trung', color: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-500', text: 'text-yellow-700' },
  low:    { label: 'Bổ sung thêm',  color: 'bg-green-50 border-green-200', dot: 'bg-green-500',  text: 'text-green-700' },
}

export default function OptimizePanel({ form, apiKey, onNeedApiKey }) {
  const [urls, setUrls] = useState(['', '', ''])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedRewrite, setExpandedRewrite] = useState(null)

  const setUrl = (i, v) => setUrls(u => u.map((x, j) => j === i ? v : x))

  const run = async () => {
    if (!apiKey) { onNeedApiKey(); return }
    const validUrls = urls.filter(u => u.trim().startsWith('http'))
    if (!validUrls.length) { setError('Nhập ít nhất 1 URL đối thủ hợp lệ (bắt đầu bằng http)'); return }
    if (!form.content && !form.h1) { setError('Vui lòng nhập nội dung bài viết ở tab Thông tin trước'); return }
    setError(''); setLoading(true); setResult(null)
    try {
      const { data } = await axios.post(`${API}/optimize`, {
        article: form,
        competitor_urls: validUrls,
        api_key: apiKey,
      })
      setResult(data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Lỗi kết nối. Thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  const rewriteFor = (key) => result?.rewrites?.find(r => r.key === key)

  return (
    <div className="space-y-4">
      {/* URL inputs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-800 text-base">Phân tích đối thủ & Đề xuất tối ưu</h2>
          <p className="text-xs text-slate-400 mt-0.5">Nhập URL đối thủ đang top 1–5 cho từ khóa của bạn</p>
        </div>

        <div className="space-y-2">
          {urls.map((url, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-slate-400 w-5 text-right">{i + 1}.</span>
              <input
                className="input-base flex-1"
                placeholder={`https://example.com/bai-viet-doi-thu-${i + 1}`}
                value={url}
                onChange={e => setUrl(i, e.target.value)}
              />
            </div>
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          onClick={run}
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner /> Đang crawl đối thủ & phân tích…
            </span>
          ) : '🚀 Phân tích & Đề xuất tối ưu'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Crawl status */}
          {result.competitors_crawled && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 flex flex-wrap gap-3">
              {result.competitors_crawled.map((c, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <span className={c.ok ? 'text-green-600' : 'text-red-500'}>{c.ok ? '✓' : '✗'}</span>
                  <span className="text-slate-600 max-w-[180px] truncate">{c.url}</span>
                  {c.ok && <span className="text-slate-400">({c.word_count?.toLocaleString()} từ)</span>}
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          {result.summary && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl px-5 py-4">
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1.5">Tóm tắt quan trọng nhất</p>
              <p className="text-sm text-orange-900 leading-relaxed">{result.summary}</p>
            </div>
          )}

          {/* Gap Analysis */}
          {result.gap_analysis && <GapAnalysis gaps={result.gap_analysis} />}

          {/* Priority Roadmap */}
          {result.roadmap?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">🗺️ Roadmap tối ưu theo độ ưu tiên</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {['high', 'medium', 'low'].map(level => {
                  const items = result.roadmap.filter(r => r.priority === level)
                  if (!items.length) return null
                  const cfg = PRIORITY_CONFIG[level]
                  return (
                    <div key={level} className="px-5 py-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                        <span className={`text-xs font-semibold uppercase ${cfg.text}`}>{cfg.label}</span>
                      </div>
                      <div className="space-y-2">
                        {items.map((item, i) => {
                          const rw = rewriteFor(item.rewrite_key)
                          return (
                            <div key={i} className={`border rounded-xl p-3 ${cfg.color}`}>
                              <div className="flex items-start gap-2">
                                <span className="text-xs font-medium text-slate-500 bg-white rounded px-1.5 py-0.5 mt-0.5 flex-shrink-0">{item.category}</span>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-slate-800">{item.action}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">{item.reason}</p>
                                </div>
                                {rw && (
                                  <button
                                    onClick={() => setExpandedRewrite(expandedRewrite === item.rewrite_key ? null : item.rewrite_key)}
                                    className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 flex-shrink-0"
                                  >
                                    {expandedRewrite === item.rewrite_key ? 'Ẩn' : 'Xem mẫu'}
                                  </button>
                                )}
                              </div>
                              {rw && expandedRewrite === item.rewrite_key && (
                                <RewriteBox rewrite={rw} />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function GapAnalysis({ gaps }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800">🔍 Gap Analysis</h3>
      </div>
      <div className="p-5 grid grid-cols-1 gap-4">
        {gaps.missing_sections?.length > 0 && (
          <GapSection title="Section/Heading còn thiếu" icon="📑" color="red">
            {gaps.missing_sections.map((s, i) => <Pill key={i}>{s}</Pill>)}
          </GapSection>
        )}
        {gaps.missing_keywords?.length > 0 && (
          <GapSection title="Từ khóa semantic/LSI chưa có" icon="🔑" color="blue">
            {gaps.missing_keywords.map((k, i) => <Pill key={i} blue>{k}</Pill>)}
          </GapSection>
        )}
        {gaps.depth_gaps?.length > 0 && (
          <GapSection title="Phần cần viết sâu hơn" icon="📏" color="yellow">
            {gaps.depth_gaps.map((d, i) => (
              <div key={i} className="text-xs bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                <p className="font-medium text-yellow-800">"{d.section}"</p>
                <p className="text-yellow-600 mt-0.5">
                  Bài bạn: ~{d.your_words} từ → Đối thủ TB: ~{d.competitor_avg_words} từ
                </p>
                {d.note && <p className="text-yellow-700 mt-0.5 italic">{d.note}</p>}
              </div>
            ))}
          </GapSection>
        )}
        {gaps.format_gaps?.length > 0 && (
          <GapSection title="Loại nội dung đặc biệt còn thiếu" icon="🧩" color="purple">
            {gaps.format_gaps.map((f, i) => <Pill key={i} purple>{f}</Pill>)}
          </GapSection>
        )}
        {gaps.eeat_gaps?.length > 0 && (
          <GapSection title="E-E-A-T cần cải thiện" icon="🏅" color="green">
            {gaps.eeat_gaps.map((e, i) => <Pill key={i} green>{e}</Pill>)}
          </GapSection>
        )}
      </div>
    </div>
  )
}

function GapSection({ title, icon, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{icon} {title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function Pill({ children, blue, purple, green }) {
  const cls = blue ? 'bg-blue-50 text-blue-700 border-blue-200'
    : purple ? 'bg-purple-50 text-purple-700 border-purple-200'
    : green ? 'bg-green-50 text-green-700 border-green-200'
    : 'bg-red-50 text-red-700 border-red-200'
  return (
    <span className={`text-xs border rounded-lg px-2.5 py-1 font-medium ${cls}`}>{children}</span>
  )
}

function RewriteBox({ rewrite }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(rewrite.example)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="mt-3 bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50">
        <p className="text-xs font-medium text-slate-600">✏️ {rewrite.part}</p>
        <button onClick={copy} className="text-xs text-blue-600 hover:text-blue-800">
          {copied ? '✓ Đã copy' : 'Copy'}
        </button>
      </div>
      {rewrite.instruction && (
        <p className="text-xs text-slate-500 px-3 pt-2">{rewrite.instruction}</p>
      )}
      <pre className="text-xs text-slate-700 px-3 py-3 whitespace-pre-wrap font-sans leading-relaxed overflow-x-auto">
        {rewrite.example}
      </pre>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}
