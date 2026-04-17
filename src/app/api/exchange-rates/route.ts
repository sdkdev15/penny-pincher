import { NextResponse } from 'next/server';

const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest';
const BASE_CURRENCY = 'IDR';
const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'IDR'];
const CACHE_DURATION = 86400; // 1 day in seconds

// In-memory cache
let cachedRates: Record<string, number> | null = null;
let cacheTimestamp: number = 0;

export async function GET() {
  try {
    // Check if cache is still valid
    const now = Date.now() / 1000;
    if (cachedRates && now - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        rates: cachedRates,
        timestamp: cacheTimestamp,
        source: 'cache',
      });
    }

    // Fetch rates from external API
    const response = await fetch(`${EXCHANGE_RATE_API}/${BASE_CURRENCY}`, {
      next: { revalidate: CACHE_DURATION },
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    // Extract only supported currencies
    const rates: Record<string, number> = {};
    for (const currency of SUPPORTED_CURRENCIES) {
      rates[currency] = data.rates[currency] || null;
    }

    // Ensure IDR is always 1
    rates['IDR'] = 1;

    // Update cache
    cachedRates = rates;
    cacheTimestamp = Math.floor(now);

    return NextResponse.json({
      success: true,
      rates,
      timestamp: cacheTimestamp,
      source: 'live',
    });
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);

    // Return fallback rates if API fails
    const fallbackRates: Record<string, number> = {
      IDR: 1,
      USD: 1 / 16000, // Fallback: ~1 USD = 16,000 IDR
      EUR: 1 / 17500, // Fallback: ~1 EUR = 17,500 IDR
      GBP: 1 / 20000, // Fallback: ~1 GBP = 20,000 IDR
    };

    return NextResponse.json(
      {
        success: false,
        rates: fallbackRates,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'fallback',
      },
      { status: 500 }
    );
  }
}
