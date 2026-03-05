// =========================================================
//  Stock Chart Component
//  Candlestick/OHLC chart via TradingView Lightweight Charts v4
// =========================================================

const { useEffect, useRef, useState } = React;

// Normalize date to "YYYY-MM-DD"
function toISODate(d) {
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const date = new Date(d);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function generateOHLC(basePrice, dateStr) {
  const volatility = basePrice * 0.012;
  const open = basePrice + (Math.random() - 0.5) * volatility;
  const close = basePrice + (Math.random() - 0.5) * volatility;
  const high = Math.max(open, close) + Math.random() * volatility * 0.5;
  const low = Math.min(open, close) - Math.random() * volatility * 0.5;
  return { time: dateStr, open, high, low, close };
}

function getDaysBetween(fromDate, toDate) {
  const a = new Date(fromDate);
  const b = new Date(toDate);
  return Math.round((b - a) / 86400000);
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
}

// Tier 1: transaction-anchored; Tier 2: synthetic
function buildOHLCData(transactions, currentPrice) {
  const today = toISODate(new Date());
  const markers = [];

  if (transactions && transactions.length > 0) {
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.tradeDate) - new Date(b.tradeDate)
    );
    const txByDate = {};
    for (const tx of sorted) {
      const txDate = toISODate(tx.tradeDate);
      txByDate[txDate] = tx;
      const isBuy = (tx.status || "").toUpperCase() === "BUY";
      markers.push({
        time: txDate,
        position: isBuy ? "belowBar" : "aboveBar",
        color: isBuy ? "#10b981" : "#ef4444",
        shape: isBuy ? "arrowUp" : "arrowDown",
        text: isBuy ? "BUY" : "SELL",
      });
    }

    const firstDate = toISODate(sorted[0].tradeDate);
    const ohlc = [];
    const volume = [];
    let prevClose = sorted[0].avgPrice ?? currentPrice;

    const totalDays = getDaysBetween(firstDate, today);
    for (let i = 0; i <= totalDays; i++) {
      const date = addDays(firstDate, i);
      if (date > today) break;
      const tx = txByDate[date];
      const basePrice = tx ? (tx.avgPrice ?? prevClose) : prevClose;
      const candle = generateOHLC(basePrice, date);
      prevClose = candle.close;
      ohlc.push(candle);
      const vol = Math.round(50000 + Math.random() * 150000);
      volume.push({
        time: date,
        value: vol,
        color: candle.close >= candle.open ? "#10b981" : "#ef4444",
      });
    }

    ohlc.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
    volume.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
    return { ohlc, volume, markers };
  }

  const ohlc = [];
  const volume = [];
  const bound = currentPrice * 0.2;
  let price = currentPrice * (0.9 + Math.random() * 0.2);
  for (let i = 180; i >= 0; i--) {
    const date = addDays(today, -i);
    const candle = generateOHLC(price, date);
    price = Math.min(
      Math.max(candle.close, currentPrice - bound),
      currentPrice + bound
    );
    if (i === 0) candle.close = currentPrice;
    ohlc.push(candle);
    const vol = Math.round(50000 + Math.random() * 150000);
    volume.push({
      time: date,
      value: vol,
      color: candle.close >= candle.open ? "#10b981" : "#ef4444",
    });
  }
  ohlc.sort((a, b) => (a.time < b.time ? -1 : 1));
  volume.sort((a, b) => (a.time < b.time ? -1 : 1));
  return { ohlc, volume, markers };
}

const PERIODS = [
  { label: "1W", days: 7 },
  { label: "1M", months: 1 },
  { label: "3M", months: 3 },
  { label: "6M", months: 6 },
  { label: "1Y", months: 12 },
];

function StockChart({ symbol, transactions, currentPrice }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const [activePeriod, setActivePeriod] = useState("1W");

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === "undefined" || !window.LightweightCharts) return;

    const LWC = window.LightweightCharts;
    const width = container.clientWidth;

    const chart = LWC.createChart(container, {
      width,
      height: 400,
      layout: {
        background: { color: "#151821" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "#1f2937" },
        horzLines: { color: "#1f2937" },
      },
      crosshair: { mode: LWC.CrosshairMode.Normal },
      rightPriceScale: { borderColor: "#374151" },
      timeScale: {
        borderColor: "#374151",
        timeVisible: true,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#10b981",
      downColor: "#ef4444",
      borderUpColor: "#10b981",
      borderDownColor: "#ef4444",
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });

    const volumeSeries = chart.addHistogramSeries({
      color: "#26a69a",
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
      visible: false,
    });

    const { ohlc, volume, markers } = buildOHLCData(
      transactions || [],
      currentPrice ?? 0
    );

    if (ohlc.length > 0) {
      candleSeries.setData(ohlc);
      volumeSeries.setData(volume);
      candleSeries.setMarkers(markers);

      candleSeries.createPriceLine({
        price: currentPrice ?? 0,
        color: "#60a5fa",
        lineWidth: 2,
        lineStyle: 2,
        title: "Current",
      });

      const period = PERIODS.find((p) => p.label === "1W");
      const to = new Date();
      const from = new Date();
      if (period?.days) {
        from.setDate(from.getDate() - period.days);
      } else {
        from.setMonth(from.getMonth() - (period?.months ?? 6));
      }
      chart.timeScale().setVisibleRange({
        from: Math.floor(from.getTime() / 1000),
        to: Math.floor(to.getTime() / 1000),
      });
    }

    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        if (e.target === container && chartRef.current) {
          chartRef.current.applyOptions({ width: e.contentRect.width });
        }
      }
    });
    ro.observe(container);
    chartRef.current = chart;

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [symbol, transactions, currentPrice]);

  function setPeriod(label) {
    setActivePeriod(label);
    const chart = chartRef.current;
    if (!chart || !containerRef.current) return;

    const period = PERIODS.find((p) => p.label === label);
    const to = new Date();
    const from = new Date();
    if (period?.days) {
      from.setDate(from.getDate() - period.days);
    } else {
      from.setMonth(from.getMonth() - (period?.months ?? 6));
    }

    chart.timeScale().setVisibleRange({
      from: Math.floor(from.getTime() / 1000),
      to: Math.floor(to.getTime() / 1000),
    });
  }

  return (
    <div className="stock-chart-wrapper">
      <div className="chart-toolbar">
        {PERIODS.map((p) => (
          <button
            key={p.label}
            type="button"
            className={`chart-period-btn ${activePeriod === p.label ? "active" : ""}`}
            onClick={() => setPeriod(p.label)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div
        ref={containerRef}
        style={{ width: "100%", height: 400 }}
      />
    </div>
  );
}
