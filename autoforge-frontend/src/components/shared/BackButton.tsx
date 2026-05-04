import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function BackButton() {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(-1)}
      className="w-10 h-10 rounded-full bg-forge-orange hover:bg-forge-orange-light text-white flex items-center justify-center shadow-lg shadow-forge-orange/20 transition-all hover:scale-105 active:scale-95 mb-4"
      aria-label="Go back"
    >
      <ArrowLeft size={18} />
    </button>
  )
}
