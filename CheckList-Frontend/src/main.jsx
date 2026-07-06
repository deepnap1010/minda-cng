import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastContainer } from 'react-toastify'


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Treat data as fresh for 1 min so remounting a page / re-opening a
      // modal does NOT refire the request every time.
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      // Don't refetch everything just because the user switched browser tabs.
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      // A slow/failing request used to retry 3x (multiplying the load). Once is enough.
      retry: 1,
    },
  },
})

createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ToastContainer />
      <App />
    </BrowserRouter>
  </QueryClientProvider>
)
