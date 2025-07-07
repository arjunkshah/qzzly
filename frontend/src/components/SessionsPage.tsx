import { RequireAuth } from "@/components/auth/RequireAuth";

export default function SessionsPage() {
  return (
    <RequireAuth>
      {/* ...existing SessionsPage content... */}
    </RequireAuth>
  );
} 