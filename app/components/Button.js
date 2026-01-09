// app/components/Button.js
export default function Button({ children, className, ...props }) {
  return (
    <button
      className={`w-full p-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
