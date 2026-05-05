import Link from "next/link";

export function EmptyBag() {
  return (
    <div className="rounded-2xl bg-gray-100 p-10 flex items-center gap-8">
      <div className="w-28 h-28 rounded-2xl bg-green-500/10 grid place-items-center text-5xl">🛍️</div>
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Sua sacola está vazia</h2>
        <p className="text-gray-600 mt-1">
          Vá para o catálogo ou procure os livros que vão te deixar feliz.
        </p>
        <ul className="text-gray-600 list-disc ml-5 mt-2">
          <li>Quando encontrá-los, clique no botão <em>Adicionar à sacola</em> 😉</li>
        </ul>
        <Link
          href="/store"
          className="inline-block mt-4 rounded-xl bg-blue-600 text-white px-5 py-3 font-semibold hover:brightness-110"
        >
          Ir para o catálogo
        </Link>
      </div>
    </div>
  );
}
