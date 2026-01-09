export default function TipCard({ titulo, texto }) {
  return (
    <div className="bg-white shadow p-4 rounded-lg mb-4">
      <h2 className="text-xl font-semibold mb-2">{titulo}</h2>
      <p>{texto}</p>
    </div>
  );
}
