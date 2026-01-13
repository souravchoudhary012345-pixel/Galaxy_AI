 

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#0B0F14] via-[#1a1f2e] to-[#0B0F14]">
      {/* HERO SECTION */}
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center text-white max-w-4xl">
          <h1 className="text-6xl font-bold mb-6 bg-linear-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Galaxy AI
          </h1>

          <p className="text-xl mb-10 text-gray-300 leading-relaxed">
            Build powerful AI workflows with an intuitive drag-and-drop interface.
            Connect LLMs, process data, and automate tasks effortlessly.
          </p>

          <Link
            href="/main"
            className="inline-block bg-linear-to-r from-blue-600 to-purple-600
                       hover:from-blue-700 hover:to-purple-700
                       text-white font-bold py-4 px-10 rounded-lg text-lg
                       transition-transform duration-300 hover:scale-105 shadow-lg"
          >
            Get Started
          </Link>
        </div>
      </div>

      {/* SIMPLIFY YOUR WORK SECTION */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-9xl font-bold mb-6 text-white">
            Simplify your Work
          </h1>

          <p className="text-lg text-gray-300 leading-relaxed max-w-3xl mx-auto">
            Galaxy AI helps you reduce complexity and focus on what truly matters.
            Design intelligent workflows without writing repetitive code, integrate
            multiple AI models seamlessly, and automate decision-making in a single
            unified platform. Whether you are building prototypes or production-grade
            systems, Galaxy AI adapts to your workflow and scales with your needs.
          </p>
        </div>
      </section>
    </div>
  );
}
