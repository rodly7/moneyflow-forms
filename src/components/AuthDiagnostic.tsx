
import { useAuth } from "@/contexts/OptimizedAuthContext";

const AuthDiagnostic = () => {
  const { user, profile, loading } = useAuth();
  
  console.log('🔍 Diagnostic Auth:', {
    user: !!user,
    profile: !!profile,
    loading,
    userRole: profile?.role,
    userPhone: profile?.phone
  });

  return (
    <div className="fixed bottom-4 left-4 bg-blue-100 p-2 rounded text-xs">
      <div>User: {user ? '✅' : '❌'}</div>
      <div>Profile: {profile ? '✅' : '❌'}</div>
      <div>Loading: {loading ? '⏳' : '✅'}</div>
      <div>Role: {profile?.role || 'N/A'}</div>
    </div>
  );
};

export default AuthDiagnostic;
