/**
 * Generate epiweek results for comparison with epiweeks (Python).
 * Writes JSON to scripts/mmwr_results.json
 *
 * Usage: npx tsx scripts/generate_mmwr_results.ts
 */

import { writeFileSync } from 'fs'
import { EpiWeek } from '../src/index'

interface Results {
  dateToEpiweek: Record<string, { year: number; week: number; day: number }>
  epiweekToDate: Record<string, string>
  weeksInYear: Record<string, number>
}

function generateTestDates(): string[] {
  const dates: string[] = []

  // Test all days in years with 52 and 53 weeks
  // 2020 has 53 weeks, 2021 has 52 weeks
  for (const year of [2020, 2021]) {
    const start = new Date(year, 0, 1)
    const end = new Date(year, 11, 31)
    const current = new Date(start)
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }
  }

  // Test boundary dates around year transitions
  for (let year = 2015; year <= 2030; year++) {
    // First week of January
    for (let day = 1; day <= 7; day++) {
      dates.push(`${year}-01-${day.toString().padStart(2, '0')}`)
    }
    // Last week of December
    for (let day = 25; day <= 31; day++) {
      dates.push(`${year}-12-${day.toString().padStart(2, '0')}`)
    }
  }

  return [...new Set(dates)].sort()
}

function main() {
  const testDates = generateTestDates()

  const results: Results = {
    dateToEpiweek: {},
    epiweekToDate: {},
    weeksInYear: {},
  }

  // Test date to epiweek conversion
  for (const dateStr of testDates) {
    const [year, month, day] = dateStr.split('-').map(Number)
    const jsDate = new Date(year, month - 1, day)
    const ew = new EpiWeek(year, 1, 1)
    ew.fromJSDate(jsDate)
    results.dateToEpiweek[dateStr] = {
      year: ew.year,
      week: ew.week,
      day: ew.day,
    }
  }

  // Test epiweek to date conversion (years 2015-2030)
  for (let year = 2015; year <= 2030; year++) {
    const ew = new EpiWeek(year, 1, 1)
    const startDate = ew.toJSDate()
    const dateStr = startDate.toISOString().split('T')[0]
    results.epiweekToDate[`${year}01`] = dateStr

    // Also test last week end date
    const nWeeks = ew.nWeeks
    const ewLast = new EpiWeek(year, nWeeks, 7)
    const endDate = ewLast.toJSDate()
    results.epiweekToDate[`${year}${nWeeks.toString().padStart(2, '0')}_end`] =
      endDate.toISOString().split('T')[0]

    results.weeksInYear[year] = nWeeks
  }

  const outputPath = new URL('./mmwr_results.json', import.meta.url).pathname
  writeFileSync(outputPath, JSON.stringify(results, null, 2))
  console.log(`Written to ${outputPath}`)
  console.log(`Tested ${testDates.length} dates`)
}

main()
