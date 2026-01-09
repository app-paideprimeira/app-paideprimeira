// app/components/Input.js
export default function Input({ label, ...props }) {
  return (
    <div className="mb-4">
      <label className="block mb-1 font-semibold text-gray-700">
        {label}
      </label>
      <input
        className="w-full p-2 border rounded-lg focus:ring focus:ring-blue-400"
        {...props}
      />
    </div>
  );
}
