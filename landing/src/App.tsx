import { useState } from 'react';
import {
  Database,
  Zap,
  Terminal,
  Cpu,
  Download,
  CheckCircle2,
  Copy,
  ExternalLink,
  ChevronDown,
  Layers,
  ShieldCheck,
  FileSpreadsheet,
  Code2,
  TableProperties,
  ArrowRight,
  HardDrive,
  Clock,
  Sparkles,
  Monitor
} from 'lucide-react';

function GithubIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export default function App() {
  const [copiedClone, setCopiedClone] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'orders'>('users');
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  const repoUrl = 'https://github.com/Jarez25/datasybil';
  const releasesUrl = 'https://github.com/Jarez25/datasybil/releases';
  const cloneCmd = 'git clone https://github.com/Jarez25/datasybil.git';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedClone(true);
    setTimeout(() => setCopiedClone(false), 2000);
  };

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Background patterns */}
      <div className="fixed inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Banner */}
      <div className="relative z-50 border-b border-emerald-500/20 bg-emerald-950/40 backdrop-blur-md px-4 py-2 text-center text-xs font-medium text-emerald-300">
        <span>⚡ DataSybil v0.1.0 Lanzamiento Oficial • Motor Nativo en Rust & Tauri v2</span>
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-3 inline-flex items-center gap-1 underline hover:text-emerald-200 transition-colors"
        >
          Ver en GitHub <ArrowRight className="w-3 h-3" />
        </a>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-600 to-emerald-400 p-[1px] shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-zinc-950 rounded-[7px] flex items-center justify-center">
                <Database className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold tracking-tight text-white">DataSybil</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono-code font-semibold">
                v0.1.0
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            <a href="#caracteristicas" className="hover:text-white transition-colors">Características</a>
            <a href="#comparativa" className="hover:text-white transition-colors">Comparativa</a>
            <a href="#motores" className="hover:text-white transition-colors">Motores</a>
            <a href="#faq" className="hover:text-white transition-colors">Preguntas</a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm font-medium text-zinc-300 hover:text-white transition-all shadow-sm"
            >
              <GithubIcon className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <a
              href="#descargar"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium text-white transition-all shadow-lg shadow-emerald-600/25 active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Descargar .exe</span>
              <span className="sm:hidden">Descargar</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Alternativa Abierta, Nativa y Ultraligera a DataGrip y DBeaver</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            El IDE de Bases de Datos <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Ultrarrápido & Ligero
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Construido en <strong>Rust</strong> y <strong>Tauri v2</strong>. Conecta a <strong>PostgreSQL</strong>, <strong>MySQL</strong> y <strong>SQLite</strong> consumiendo menos de <strong>100 MB de RAM</strong>, con editor Monaco inteligente y renderizado virtualizado a 60 FPS.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href={releasesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-base transition-all shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-[0.98]"
            >
              <Download className="w-5 h-5 text-zinc-950" />
              <span>Descargar Portable v0.1.0</span>
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-950/20 text-zinc-900 font-mono font-medium">~10 MB</span>
            </a>

            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 hover:text-white font-medium text-base transition-all active:scale-[0.98]"
            >
              <GithubIcon className="w-5 h-5" />
              <span>Ver Código en GitHub</span>
              <ExternalLink className="w-4 h-4 text-zinc-400" />
            </a>
          </div>

          {/* Quick Clone Terminal Box */}
          <div className="pt-2 flex justify-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-400 font-mono-code shadow-inner">
              <span className="text-emerald-500 select-none">$</span>
              <span className="text-zinc-300">{cloneCmd}</span>
              <button
                onClick={() => copyToClipboard(cloneCmd)}
                title="Copiar comando"
                className="ml-2 p-1 hover:text-white text-zinc-400 hover:bg-zinc-800 rounded transition-colors"
              >
                {copiedClone ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Live UI Mockup Simulation */}
        <div className="mt-14 relative rounded-2xl border border-zinc-800/80 bg-zinc-950 shadow-2xl shadow-emerald-950/30 overflow-hidden">
          {/* Window Titlebar */}
          <div className="h-10 border-b border-zinc-800/80 bg-zinc-900/80 px-4 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-3 text-xs text-zinc-400 font-medium">DataSybil — Database IDE</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                postgres_prod (conectado)
              </span>
              <span className="font-mono-code text-[11px] text-zinc-500">Latencia: 2.4 ms</span>
            </div>
          </div>

          {/* IDE Content Area */}
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px] text-xs font-sans">
            {/* Sidebar Explorer */}
            <div className="hidden md:block md:col-span-3 border-r border-zinc-800/80 bg-zinc-950/60 p-3 space-y-4">
              <div className="flex items-center justify-between text-zinc-400 px-1 font-semibold text-[11px] uppercase tracking-wider">
                <span>Conexiones</span>
                <span className="text-emerald-400 text-[10px]">3 Activas</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Producción PostgreSQL</span>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-zinc-900 text-zinc-400 transition-colors">
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  <span>MySQL Analytics</span>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-zinc-900 text-zinc-400 transition-colors">
                  <Database className="w-3.5 h-3.5 text-amber-400" />
                  <span>SQLite Demo (En Memoria)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800/60 space-y-2">
                <div className="text-[11px] font-semibold text-zinc-500 uppercase px-1">Esquema: public</div>
                <div className="space-y-1 pl-1">
                  <div className="flex items-center justify-between px-2 py-1 rounded bg-zinc-900/60 text-zinc-300">
                    <span className="flex items-center gap-2">
                      <TableProperties className="w-3.5 h-3.5 text-emerald-400" />
                      users
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono-code">~120.4k filas</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 rounded hover:bg-zinc-900/40 text-zinc-400">
                    <span className="flex items-center gap-2">
                      <TableProperties className="w-3.5 h-3.5 text-zinc-500" />
                      orders
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono-code">~450.8k filas</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 rounded hover:bg-zinc-900/40 text-zinc-400">
                    <span className="flex items-center gap-2">
                      <TableProperties className="w-3.5 h-3.5 text-zinc-500" />
                      audit_logs
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono-code">~890.1k filas</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Editor & Results Panel */}
            <div className="col-span-1 md:col-span-9 flex flex-col bg-zinc-900/30">
              {/* Tab Bar */}
              <div className="h-9 border-b border-zinc-800/80 bg-zinc-950 flex items-center px-2 gap-1">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-t text-xs font-medium border-t-2 transition-all ${
                    activeTab === 'users'
                      ? 'bg-zinc-900 text-emerald-400 border-emerald-500'
                      : 'text-zinc-500 hover:text-zinc-300 border-transparent'
                  }`}
                >
                  <Terminal className="w-3 h-3" />
                  <span>Consulta #1 (users)</span>
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-t text-xs font-medium border-t-2 transition-all ${
                    activeTab === 'orders'
                      ? 'bg-zinc-900 text-emerald-400 border-emerald-500'
                      : 'text-zinc-500 hover:text-zinc-300 border-transparent'
                  }`}
                >
                  <Terminal className="w-3 h-3" />
                  <span>Consulta #2 (orders)</span>
                </button>
                <div className="ml-auto flex items-center gap-2 pr-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono-code">
                    Ctrl + Enter para ejecutar
                  </span>
                </div>
              </div>

              {/* Code Editor Body */}
              <div className="p-4 bg-zinc-950/80 border-b border-zinc-800/80 font-mono-code text-[12px] leading-relaxed">
                <div className="flex gap-4">
                  <div className="select-none text-zinc-600 text-right pr-2 space-y-0.5 font-mono">
                    <div>1</div>
                    <div>2</div>
                    <div>3</div>
                    <div>4</div>
                  </div>
                  <div className="flex-1 space-y-0.5 text-zinc-300">
                    <p className="text-zinc-500">-- DataSybil detecta la consulta bajo el cursor automáticamente</p>
                    <p>
                      <span className="text-emerald-400 font-semibold">SELECT</span> id, full_name, email, role, created_at
                    </p>
                    <p>
                      <span className="text-emerald-400 font-semibold">FROM</span> users u
                    </p>
                    <p>
                      <span className="text-emerald-400 font-semibold">WHERE</span> u.status = <span className="text-amber-300">'active'</span>{' '}
                      <span className="text-emerald-400 font-semibold">ORDER BY</span> created_at <span className="text-emerald-400 font-semibold">DESC</span> <span className="text-emerald-400 font-semibold">LIMIT</span> 5;
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid Toolbar & Status */}
              <div className="px-4 py-2 bg-zinc-900/60 border-b border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-zinc-200">Resultados</span>
                  <span className="text-emerald-400 font-mono-code">5 filas devueltas en 2.4 ms</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-500">Filas afectadas: 0</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-[11px] text-zinc-300">Exportar Excel (.xls)</span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-[11px] text-zinc-300">Copiar JSON</span>
                </div>
              </div>

              {/* Data Table Result Simulation */}
              <div className="flex-1 overflow-x-auto bg-zinc-950 p-2">
                <table className="w-full text-left font-mono-code text-[11px]">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 font-semibold">
                      <th className="py-1.5 px-3">#</th>
                      <th className="py-1.5 px-3 text-emerald-400">id 🔑 (uuid)</th>
                      <th className="py-1.5 px-3">full_name (varchar)</th>
                      <th className="py-1.5 px-3">email (varchar)</th>
                      <th className="py-1.5 px-3">role (varchar)</th>
                      <th className="py-1.5 px-3">created_at (timestamptz)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 text-zinc-300">
                    <tr className="hover:bg-zinc-900/60 transition-colors">
                      <td className="py-1.5 px-3 text-zinc-600">1</td>
                      <td className="py-1.5 px-3 text-amber-300/90">a81e-42b1-9f...</td>
                      <td className="py-1.5 px-3">Jarez Developer</td>
                      <td className="py-1.5 px-3 text-cyan-400">jarez@example.com</td>
                      <td className="py-1.5 px-3"><span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">admin</span></td>
                      <td className="py-1.5 px-3 text-zinc-500">2026-10-12 15:30:00</td>
                    </tr>
                    <tr className="hover:bg-zinc-900/60 transition-colors">
                      <td className="py-1.5 px-3 text-zinc-600">2</td>
                      <td className="py-1.5 px-3 text-amber-300/90">71cf-8302-8a...</td>
                      <td className="py-1.5 px-3">Elena Rostova</td>
                      <td className="py-1.5 px-3 text-cyan-400">elena.r@fintech.io</td>
                      <td className="py-1.5 px-3"><span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">analyst</span></td>
                      <td className="py-1.5 px-3 text-zinc-500">2026-10-12 14:15:20</td>
                    </tr>
                    <tr className="hover:bg-zinc-900/60 transition-colors">
                      <td className="py-1.5 px-3 text-zinc-600">3</td>
                      <td className="py-1.5 px-3 text-amber-300/90">e309-11ef-93...</td>
                      <td className="py-1.5 px-3">Marcus Vance</td>
                      <td className="py-1.5 px-3 text-cyan-400">marcus@enterprise.co</td>
                      <td className="py-1.5 px-3"><span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">member</span></td>
                      <td className="py-1.5 px-3 text-zinc-500">2026-10-12 13:00:11</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Telemetry Strip */}
      <section className="border-y border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono-code">&lt; 100 MB</div>
            <div className="text-xs sm:text-sm text-zinc-400">Consumo de RAM en reposo</div>
            <div className="text-[11px] text-emerald-400 font-medium">10x menos que DBeaver o DataGrip</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono-code">~10 MB</div>
            <div className="text-xs sm:text-sm text-zinc-400">Tamaño del binario (.exe)</div>
            <div className="text-[11px] text-emerald-400 font-medium">Portable y autónomo</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono-code">&lt; 300 ms</div>
            <div className="text-xs sm:text-sm text-zinc-400">Tiempo de arranque en frío</div>
            <div className="text-[11px] text-emerald-400 font-medium">Sin JVM ni esperas molestas</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono-code">100%</div>
            <div className="text-xs sm:text-sm text-zinc-400">Open Source & Privado</div>
            <div className="text-[11px] text-emerald-400 font-medium">Licencia MIT en GitHub</div>
          </div>
        </div>
      </section>

      {/* Features Grid (Bento Box) */}
      <section id="caracteristicas" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Diseñado para la velocidad de los desarrolladores
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg">
            Combinamos la potencia de bajo nivel de Rust con una interfaz reactiva moderna para ofrecerte la herramienta SQL más ágil del mercado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-emerald-500/40 transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Núcleo Asíncrono en Rust</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Desarrollado sobre <code>Tokio</code> y <code>SQLx</code>. Concurrencia real sin hilos bloqueados, tiempos de respuesta de milisegundos y seguridad estricta de memoria.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-emerald-500/40 transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
              <Code2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Monaco Editor + IntelliSense</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              El motor de VS Code embebido. Detección automática de la sentencia bajo el cursor (estilo DataGrip), autocompletado de tablas, columnas y alias, y ejecución con <code>Ctrl + Enter</code>.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-emerald-500/40 transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <TableProperties className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Cuadrícula Virtualizada O(1)</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Maneja cientos de miles de registros sin congelar la ventana. Ordenamiento rápido por columnas de cualquier tipo, filtros en memoria e inspección de JSON o celdas extensas.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-emerald-500/40 transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Multi-motor Unificado</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Soporte completo para PostgreSQL (con llaves primarias, JSONB, UUIDs y tipos Timestamp), MySQL/MariaDB y SQLite local o en memoria con demo lista en un clic.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-emerald-500/40 transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Exportación Nativa en 1 Clic</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Diálogos nativos del sistema para guardar en Excel <code>.xls</code>, CSV con codificación UTF-8 BOM, o copiar al portapapeles en formato Markdown, JSON o sentencias <code>INSERT</code>.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-emerald-500/40 transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Privacidad y Seguridad Local</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Sin telemetría invasiva, sin cuentas forzadas y sin depender de servicios en la nube. Tus conexiones se guardan únicamente en tu máquina en el directorio seguro del usuario.
            </p>
          </div>
        </div>
      </section>

      {/* Benchmark / Comparison Section */}
      <section id="comparativa" className="py-20 bg-zinc-900/30 border-y border-zinc-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-white">Comparativa de Rendimiento</h2>
            <p className="text-zinc-400 text-sm">
              ¿Por qué los desarrolladores están cambiando herramientas pesadas por DataSybil?
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-4 px-4">Parámetro</th>
                  <th className="py-4 px-4 text-emerald-400 bg-emerald-500/5 rounded-t-lg">⚡ DataSybil</th>
                  <th className="py-4 px-4">DBeaver</th>
                  <th className="py-4 px-4">DataGrip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                <tr>
                  <td className="py-4 px-4 font-medium text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-zinc-500" />
                    Consumo de RAM
                  </td>
                  <td className="py-4 px-4 font-bold text-emerald-400 bg-emerald-500/5 font-mono-code">&lt; 100 MB</td>
                  <td className="py-4 px-4 text-zinc-400 font-mono-code">~850 MB - 1.2 GB</td>
                  <td className="py-4 px-4 text-zinc-400 font-mono-code">~1.2 GB - 2.5 GB</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-500" />
                    Tiempo de Inicio
                  </td>
                  <td className="py-4 px-4 font-bold text-emerald-400 bg-emerald-500/5 font-mono-code">&lt; 0.3 segundos</td>
                  <td className="py-4 px-4 text-zinc-400 font-mono-code">~6 - 12 segundos</td>
                  <td className="py-4 px-4 text-zinc-400 font-mono-code">~8 - 15 segundos</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-white flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-zinc-500" />
                    Tamaño del Ejecutable
                  </td>
                  <td className="py-4 px-4 font-bold text-emerald-400 bg-emerald-500/5 font-mono-code">~10 MB</td>
                  <td className="py-4 px-4 text-zinc-400 font-mono-code">~140 MB</td>
                  <td className="py-4 px-4 text-zinc-400 font-mono-code">~950 MB</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-zinc-500" />
                    Tecnología Base
                  </td>
                  <td className="py-4 px-4 font-bold text-emerald-400 bg-emerald-500/5">Rust + Tauri v2</td>
                  <td className="py-4 px-4 text-zinc-400">Java / Eclipse RCP</td>
                  <td className="py-4 px-4 text-zinc-400">Java / IntelliJ JVM</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-zinc-500" />
                    Licencia
                  </td>
                  <td className="py-4 px-4 font-bold text-emerald-400 bg-emerald-500/5">MIT (100% Libre)</td>
                  <td className="py-4 px-4 text-zinc-400">GPL / Pro ($$$)</td>
                  <td className="py-4 px-4 text-zinc-400">Comercial de Pago ($$$)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Supported Engines */}
      <section id="motores" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl font-extrabold text-white">Motores Compatibles</h2>
          <p className="text-zinc-400 text-sm">
            Drivers nativos precompilados en Rust sin necesidad de instalar conectores JDBC externos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
            <div className="text-2xl">🐘</div>
            <h3 className="text-lg font-bold text-white">PostgreSQL</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Detección de esquemas, llaves primarias, UUIDs nativos, fechas timestamptz, jsonb y conteo estimado de filas mediante estadísticas de motor.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
            <div className="text-2xl">🐬</div>
            <h3 className="text-lg font-bold text-white">MySQL & MariaDB</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Conexión directa con soporte para múltiples bases de datos del servidor, escape de palabras reservadas con backticks y extracción tipada.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
            <div className="text-2xl">🪶</div>
            <h3 className="text-lg font-bold text-white">SQLite & In-Memory</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Abre archivos <code>.db</code> o <code>.sqlite</code> al instante, o prueba consultas de inmediato con el botón de base de datos de demostración en memoria.
            </p>
          </div>
        </div>
      </section>

      {/* Download / Getting Started Section */}
      <section id="descargar" className="py-24 bg-gradient-to-b from-zinc-950 via-zinc-900/60 to-zinc-950 border-t border-zinc-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Comienza a usar DataSybil hoy
            </h2>
            <p className="text-zinc-400 text-base">
              Elige cómo deseas ejecutarlo: descarga el ejecutable portable listo para usar o clona el código fuente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Card 1: Portable Release */}
            <div className="p-8 rounded-2xl bg-zinc-900/80 border-2 border-emerald-500/50 shadow-xl shadow-emerald-500/10 flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                Recomendado
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Monitor className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white">Ejecutable Portable (.exe)</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Descárgalo y ejecútalo directamente. No requiere permisos de administrador ni instalador. Llévalo en tu memoria USB o carpeta favorita.
                </p>
                <div className="space-y-2 pt-2 text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Compatible con Windows 10 & 11 (64-bit)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Solo ~10.3 MB de descarga directa</span>
                  </div>
                </div>
              </div>

              <a
                href={releasesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold transition-all shadow-lg shadow-emerald-500/20"
              >
                <Download className="w-5 h-5 text-zinc-950" />
                <span>Descargar en GitHub Releases</span>
              </a>
            </div>

            {/* Card 2: Developer Source */}
            <div className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300">
                  <Terminal className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white">Compilar desde Código</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  ¿Quieres personalizar el código o contribuir? Clona el repositorio e inicia el entorno con un solo comando.
                </p>
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 font-mono-code text-xs text-zinc-300 space-y-1">
                  <div className="text-zinc-500"># Clonar e iniciar en modo dev:</div>
                  <div>git clone {repoUrl}.git</div>
                  <div>npm install</div>
                  <div>npm run tauri dev</div>
                </div>
              </div>

              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-all"
              >
                <GithubIcon className="w-5 h-5" />
                <span>Explorar Repositorio</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold text-white">Preguntas Frecuentes</h2>
          <p className="text-zinc-400 text-sm">Todo lo que necesitas saber sobre DataSybil</p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "¿Por qué DataSybil consume tan poca memoria RAM?",
              a: "A diferencia de DBeaver o DataGrip (que corren sobre pesadas máquinas virtuales de Java/JVM) o herramientas basadas en Electron (que levantan instancias completas de Chromium y NodeJS), DataSybil utiliza Rust para la lógica de conexión y el motor nativo de WebView2 del sistema operativo, logrando un consumo promedio de menos de 100 MB."
            },
            {
              q: "¿Mis credenciales de base de datos están seguras?",
              a: "Totalmente. DataSybil no envía ningún dato a la nube ni incluye telemetría oculta. Tus perfiles de conexión se guardan de forma local en tu propia computadora en el directorio seguro del usuario (%APPDATA% en Windows)."
            },
            {
              q: "¿Qué motores de bases de datos son compatibles?",
              a: "Actualmente soporta PostgreSQL, MySQL, MariaDB y SQLite (tanto archivos en disco como bases de datos en memoria para pruebas rápidas)."
            },
            {
              q: "¿Cómo puedo reportar un bug o solicitar una función?",
              a: "DataSybil es un proyecto de código abierto bajo licencia MIT. Puedes abrir un Issue o enviar un Pull Request directamente en nuestro repositorio de GitHub."
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className="border border-zinc-800 rounded-xl bg-zinc-900/40 overflow-hidden transition-colors"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full px-5 py-4 text-left font-medium text-white flex items-center justify-between hover:bg-zinc-900/60 transition-colors"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-zinc-400 transition-transform ${
                    faqOpen === idx ? 'rotate-180 text-emerald-400' : ''
                  }`}
                />
              </button>
              {faqOpen === idx && (
                <div className="px-5 pb-4 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/60 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8 text-center text-xs text-zinc-500 space-y-4">
        <div className="flex items-center justify-center gap-2 text-zinc-300 font-semibold text-sm">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>DataSybil</span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400 font-normal">Creado con Rust & Tauri</span>
        </div>
        <p>
          Código abierto bajo la <a href={`${repoUrl}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-300">Licencia MIT</a>.
          Desarrollado por <a href="https://github.com/Jarez25" target="_blank" rel="noopener noreferrer" className="font-medium text-emerald-400 hover:underline">Jarez25</a>.
        </p>
        <div className="flex justify-center gap-6 pt-2 text-zinc-400">
          <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
          <a href={releasesUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Descargas</a>
          <a href={`${repoUrl}/issues`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Reportar Problema</a>
        </div>
      </footer>
    </div>
  );
}
