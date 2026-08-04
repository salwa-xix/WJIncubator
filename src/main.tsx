import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import App from './App'
import './styles/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Slot availability changes under us during the event, so refetch on
      // focus and keep data fresh. Booking safety never depends on this —
      // the database is the authority (see Phase 2).
      refetchOnWindowFocus: true,
      staleTime: 10_000,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster position="top-center" dir="rtl" richColors closeButton />
    </QueryClientProvider>
  </React.StrictMode>,
)
