import GoldPricePanel from './GoldPricePanel'

export default function SpacesPage() {
  return (
    <main className="spaces-page gold-screen">
      <header className="gold-screen__header">
        <p className="gold-screen__eyebrow">Metals.dev</p>
        <h1 className="gold-screen__title">Live Gold Price</h1>
        <p className="gold-screen__subtitle">Real-time USD pricing for gold, focused on a single clean panel.</p>
      </header>
      <GoldPricePanel />
    </main>
  )
}
