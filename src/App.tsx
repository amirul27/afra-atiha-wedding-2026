import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Toaster } from "@/components/ui/toaster";

import Dashboard from "@/pages/Dashboard";
import Tasks from "@/pages/Tasks";
import Guests from "@/pages/Guests";
import Budget from "@/pages/Budget";
import Vendors from "@/pages/Vendors";
import Shopping from "@/pages/Shopping";
import Documents from "@/pages/Documents";
import Calendar from "@/pages/Calendar";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="guests" element={<Guests />} />
            <Route path="budget" element={<Budget />} />
            <Route path="vendors" element={<Vendors />} />
            <Route path="shopping" element={<Shopping />} />
            <Route path="documents" element={<Documents />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}
