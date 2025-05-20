'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center p-4">
      <h2 className="text-xl font-bold text-white mb-4">Terjadi kesalahan</h2>
      <p className="text-[#999da1] mb-6 text-center">Maaf, terjadi kesalahan saat memuat halaman</p>
      <button
        onClick={() => reset()}
        className="bg-blue-600 text-white font-medium px-4 py-2 rounded-lg"
      >
        Coba Lagi
      </button>
    </div>
  )
} 