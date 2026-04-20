import GoldPricePanel from './GoldPricePanel'

export default function GoldPricePage() {
  return (
    <main className="gold-screen">
      <header className="gold-screen__header">
        <p className="gold-screen__eyebrow">Metals.dev</p>
        <h1 className="gold-screen__title">Live Gold Price</h1>
        <p className="gold-screen__subtitle">
          Real-time USD pricing for gold with a focused panel, manual refresh, and automatic 1-minute updates.
        </p>
      </header>
      <GoldPricePanel />
    </main>
  )
}
