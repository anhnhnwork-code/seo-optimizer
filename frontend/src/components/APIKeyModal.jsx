import { useState } from 'react'

export default function APIKeyModal({ apiKey, onSave, onClose }) {
  const [val, setVal] = useState(apiKey)
  const [show, setShow] = useState(false)

  const save = () => {
    onSave(val.trim())
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-slate-900 text-base">Anthropic API Key</h2>
            <p className="text-xs text-slate-400 mt-1">Key được lưu trên trình duyệt của bạn, không gửi lên server của chúng tôi.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none mt-0.5">×</button>
        </div>

        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            className="input-base pr-16"
            placeholder="sk-ant-api03-..."
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            autoFocus
          />
          <button
            onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
          >
            {show ? 'Ẩn' : 'Hiện'}
          </button>
        </div>

        <div className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 space-y-1">
          <p>Lấy key tại <span className="text-blue-600 font-medium">console.anthropic.com</span> → API Keys → Create Key</p>
          <p>Key chỉ dùng cho tính năng <strong>Phân tích AI</strong> và <strong>Tối ưu ranking</strong>.</p>
        </div>

        <div className="flex gap-3">
          {apiKey && (
            <button onClick={() => { onSave(''); onClose() }}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition-colors">
              Xoá key
            </button>
          )}
          <button onClick={save}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-xl text-sm transition-colors">
            Lưu
          </button>
        </div>
      </div>
    </div>
  )
}
