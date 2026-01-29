export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="h-2 w-64 bg-zeroe-gradient rounded-full mb-8 mx-auto" />
        <h1 className="text-4xl font-heading font-black text-charcoal mb-4">
          Zeroe Pulse AI
        </h1>
        <p className="text-slate-blue text-lg font-body mb-8">
          AI-powered sales intelligence platform
        </p>
        <a
          href="/login"
          className="btn-primary inline-block"
        >
          Get Started
        </a>
      </div>
    </main>
  );
}
