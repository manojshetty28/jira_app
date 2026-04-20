import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchGoldPrice } from '../services/goldApi'

const REFRESH_INTERVAL_MS = 60_000

function formatPrice(value) {
  if (typeof value !== 'number') return '--'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatSignedNumber(value) {
  if (typeof value !== 'number') return '--'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`
}

function formatSignedPercent(value) {
  if (typeof value !== 'number') return '--'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

function formatUpdatedTime(value) {
  if (!value) return 'Unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unavailable'
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function GoldPricePanel() {
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [refreshError, setRefreshError] = useState(null)
  const [isSetupRequired, setIsSetupRequired] = useState(false)
  const [setupHint, setSetupHint] = useState('')
  const quoteRef = useRef(null)
  const isFetchingRef = useRef(false)

  const loadQuote = useCallback(async ({ silent = false } = {}) => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true

    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const data = await fetchGoldPrice()
      quoteRef.current = data
      setQuote(data)
      setError(null)
      setRefreshError(null)
      setIsSetupRequired(false)
      setSetupHint('')
    } catch (err) {
      const message = err?.message || 'Unable to load live gold price.'
      const setupRequired = err?.code === 'METALS_DEV_API_KEY_MISSING'

      setIsSetupRequired(setupRequired)
      setSetupHint(err?.setupHint || '')

      if (setupRequired) {
        quoteRef.current = null
        setQuote(null)
        setError(message)
        setRefreshError(null)
      } else if (silent && quoteRef.current) {
        setRefreshError(message)
      } else {
        setError(message)
        setRefreshError(null)
      }
    } finally {
      isFetchingRef.current = false
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadQuote()
  }, [loadQuote])

  useEffect(() => {
    const timerId = window.setInterval(() => {
      loadQuote({ silent: true })
    }, REFRESH_INTERVAL_MS)

    return () => {
      window.clearInterval(timerId)
    }
  }, [loadQuote])

  const movementClass =
    typeof quote?.change !== 'number'
      ? 'gold-price-panel__change--neutral'
      : quote.change >= 0
        ? 'gold-price-panel__change--up'
        : 'gold-price-panel__change--down'

  return (
    <section className="gold-price-panel" aria-live="polite">
      <div className="gold-price-panel__header">
        <div>
          <p className="gold-price-panel__eyebrow">Live Metals</p>
          <h2 className="gold-price-panel__title">Gold Price (USD)</h2>
        </div>
        <button
          type="button"
          className="gold-price-panel__refresh"
          onClick={() => loadQuote({ silent: true })}
          disabled={loading || refreshing || isSetupRequired}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="gold-price-panel__loading">Loading latest XAU/USD price...</div>
      ) : isSetupRequired ? (
        <div className="gold-price-panel__setup">
          <p className="gold-price-panel__setup-title">Live gold price is ready to use once the API key is added.</p>
          <p className="gold-price-panel__setup-text">{setupHint || 'Add METALS_DEV_API_KEY to .env and restart the dev server.'}</p>
        </div>
      ) : error ? (
        <div className="gold-price-panel__error">{error}</div>
      ) : (
        <>
          <div className="gold-price-panel__hero">
            <div>
              <p className="gold-price-panel__label">Spot price</p>
              <div className="gold-price-panel__price">{formatPrice(quote?.price)}</div>
            </div>
            <div className={`gold-price-panel__change ${movementClass}`}>
              <span>{formatSignedNumber(quote?.change)}</span>
              <span>{formatSignedPercent(quote?.changePercent)}</span>
            </div>
          </div>

          <div className="gold-price-panel__meta">
            <span>Updated {formatUpdatedTime(quote?.timestamp)}</span>
            <span>{quote?.source} | {quote?.unit || 'toz'}</span>
          </div>

          {refreshError && <div className="gold-price-panel__notice">{refreshError} Showing the latest available quote.</div>}

          <div className="gold-price-panel__grid">
            <div className="gold-price-panel__stat">
              <span className="gold-price-panel__label">Bid</span>
              <strong>{formatPrice(quote?.bid)}</strong>
            </div>
            <div className="gold-price-panel__stat">
              <span className="gold-price-panel__label">Ask</span>
              <strong>{formatPrice(quote?.ask)}</strong>
            </div>
            <div className="gold-price-panel__stat">
              <span className="gold-price-panel__label">Day high</span>
              <strong>{formatPrice(quote?.high)}</strong>
            </div>
            <div className="gold-price-panel__stat">
              <span className="gold-price-panel__label">Day low</span>
              <strong>{formatPrice(quote?.low)}</strong>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
