// app/components/Title.js
export default function Title({ children }) {
  return (
    <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
      {children}
    </h1>
  );
}
