import { useState, useEffect } from 'react'
import axios from 'axios'
import InputPanel from './components/InputPanel'
import ChecklistPanel from './components/ChecklistPanel'
import AIPanel from './components/AIPanel'
import OptimizePanel from './components/OptimizePanel'
import APIKeyModal from './components/APIKeyModal'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function App() {
  const [form, setForm] = useState({
    h1: '', seo_title: '', meta_desc: '',
    content: '', main_keyword: '', secondary_keywords: '',
  })
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')
  const [rightTab, setRightTab] = useState('checklist')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('anthropic_api_key') || '')
  const [showKeyModal, setShowKeyModal] = useState(false)

  const saveApiKey = (key) => {
    setApiKey(key)
    if (key) localStorage.setItem('anthropic_api_key', key)
    else localStorage.removeItem('anthropic_api_key')
  }

  const analyze = async (withAI = false) => {
    if (!form.content && !form.h1) {
      setError('Vui lòng nhập ít nhất nội dung bài viết hoặc tiêu đề H1.')
      return
    }
    if (withAI && !apiKey) {
      setShowKeyModal(true)
      return
    }
    setError('')
    withAI ? setAiLoading(true) : setLoading(true)
    try {
      let data
      if (withAI) {
        const res = await axios.post(`${API}/ai-analyze`, { article: form, api_key: apiKey })
        data = res.data
      } else {
        const res = await axios.post(`${API}/analyze`, form)
        data = res.data
      }
      setResults(data)
      setRightTab('checklist')
    } catch (e) {
      setError(e.response?.data?.detail || 'Lỗi kết nối server. Vui lòng thử lại.')
    } finally {
      setLoading(false)
      setAiLoading(false)
    }
  }

  const score = results?.score ?? null
  const scoreColor = score === null ? '' : score >= 80 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'
  const scoreBg = score === null ? '' : score >= 80 ? 'bg-green-50 border-green-200' : score >= 50 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'

  return (
    <div className="min-h-screen bg-slate-50">
      {showKeyModal && (
        <APIKeyModal apiKey={apiKey} onSave={saveApiKey} onClose={() => setShowKeyModal(false)} />
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-base">S</span>
            </div>
            <div>
              <h1 className="font-semibold text-slate-900 leading-tight">SEO Optimizer</h1>
              <p className="text-xs text-slate-400">Chuẩn checklist SEONGON</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {score !== null && (
              <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${scoreBg}`}>
                <div>
                  <p className="text-xs text-slate-500 text-right">Điểm SEO</p>
                  <p className={`text-2xl font-bold leading-tight ${scoreColor}`}>
                    {score}<span className="text-sm font-normal">/100</span>
                  </p>
                </div>
                <div className="text-sm text-slate-500">
                  <span className="text-green-600 font-medium">{results.passed}</span>/{results.total} tiêu chí
                </div>
              </div>
            )}

            {/* API Key button */}
            <button
              onClick={() => setShowKeyModal(true)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                apiKey
                  ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{apiKey ? '🔑' : '⚙️'}</span>
              <span className="hidden sm:inline">{apiKey ? 'API key đã lưu' : 'Cài đặt API key'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-7xl mx-auto px-5 py-6 grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <InputPanel
          form={form} setForm={setForm}
          onAnalyze={() => analyze(false)}
          onAIAnalyze={() => analyze(true)}
          loading={loading} aiLoading={aiLoading} error={error}
          hasApiKey={!!apiKey}
          onNeedApiKey={() => setShowKeyModal(true)}
        />

        <div className="space-y-0">
          <div className="flex gap-1 mb-4">
            <TabBtn active={rightTab === 'checklist'} onClick={() => setRightTab('checklist')}>
              📋 Checklist {score !== null ? `(${score}/100)` : ''}
            </TabBtn>
            <TabBtn active={rightTab === 'optimize'} onClick={() => setRightTab('optimize')}>
              🚀 Tối ưu ranking
            </TabBtn>
          </div>

          {rightTab === 'checklist' ? (
            results ? (
              <div className="space-y-4">
                <ChecklistPanel results={results.results} />
                {results.ai && <AIPanel ai={results.ai} />}
              </div>
            ) : (
              <EmptyState />
            )
          ) : (
            <OptimizePanel form={form} apiKey={apiKey} onNeedApiKey={() => setShowKeyModal(true)} />
          )}
        </div>
      </main>
    </div>
  )
}

function TabBtn({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
        active ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 bg-white border border-slate-200'
      }`}
    >
      {children}
    </button>
  )
}

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-14 text-center">
      <div className="text-5xl mb-4">📊</div>
      <p className="text-slate-500 text-sm">
        Nhập nội dung bài viết bên trái<br />
        và nhấn <strong>Phân tích</strong> để xem kết quả
      </p>
    </div>
  )
}
