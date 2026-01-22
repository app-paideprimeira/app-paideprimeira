export default function AuthLayout({ children }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        {children}
      </div>
    </main>
  );
}
