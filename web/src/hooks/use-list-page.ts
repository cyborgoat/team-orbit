import { useState } from 'react'
export function useListPage() {
  const [page, setPage] = useState(1)
  return { page, setPage, limit: 20 }
}
