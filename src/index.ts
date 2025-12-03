/**
 * Main module file for mmwr-week
 */

import { addDays, getYear, differenceInDays, getISODay } from 'date-fns'
import { memoize } from 'micro-memoize'

/**
 * Epiweek in format yyyyww
 */
export type Epiweek = number

/**
 * Memoized function for number of MMWR weeks in a year
 */
const weeksInYear = memoize(function (year: number): number {
  const md = new MMWRDate(year, 1)
  const ed = new MMWRDate(year, 53)
  ed.fromJSDate(ed.toJSDate())
  return ed.year === md.year ? 53 : 52
})

/**
 * Get the start date of MMWR year (first day of week 1)
 * MMWR week starts on Sunday and week 1 is the first week with at least 4 days in the new year
 */
function getMMWRYearStart(year: number): Date {
  const janOne = new Date(year, 0, 1)
  const isoWeekday = getISODay(janOne) // 1 (Mon) to 7 (Sun)
  // Convert ISO weekday to MMWR day (Sunday = 1, Monday = 2, ..., Saturday = 7)
  // ISO: Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6, Sun=7
  // We need: Sun=0 for calculation purposes
  const dayOfWeek = isoWeekday % 7 // Sun=0, Mon=1, ..., Sat=6

  // MMWR week 1 starts on the Sunday of the week containing Jan 4th
  // Or equivalently: if Jan 1 is Sun-Wed, week 1 starts in current year
  // if Jan 1 is Thu-Sat, week 1 starts in previous year (so we go forward)
  const diff = 7 * (dayOfWeek > 3 ? 1 : 0) - dayOfWeek
  return addDays(janOne, diff)
}

/**
 * Class representing an MMWR date
 */
export class MMWRDate {
  public year: number
  public week: number
  public day: number

  constructor(year: number, week: number = 1, day: number = 1) {
    this.year = year
    this.week = week
    this.day = day
  }

  /**
   * Return year start date (first day of week 1)
   */
  get startDate(): Date {
    return getMMWRYearStart(this.year)
  }

  /**
   * Return plain JS date representation
   */
  toJSDate(): Date {
    const dayOne = this.startDate
    const diff = 7 * (this.week - 1) + (this.day - 1)
    return addDays(dayOne, diff)
  }

  /**
   * Set values using given JS date. Defaults to now.
   */
  fromJSDate(date: Date = new Date()) {
    const year = getYear(date)
    const startDates = [year - 1, year, year + 1].map((y) => getMMWRYearStart(y))
    const diffs = startDates.map((d) => differenceInDays(date, d))

    let startId = 1
    if (diffs[1] < 0) startId = 0
    else if (diffs[2] >= 0) startId = 2

    const startDate = startDates[startId]

    this.year = getYear(addDays(startDate, 7))
    this.week = Math.floor(differenceInDays(date, startDate) / 7) + 1
    // MMWR day: Sunday = 1, Monday = 2, ..., Saturday = 7
    const isoDay = getISODay(date) // Mon=1 to Sun=7
    this.day = (isoDay % 7) + 1 // Sun=1, Mon=2, ..., Sat=7
  }

  /**
   * Return date in epiweek format
   */
  toEpiweek(): Epiweek {
    return this.year * 100 + this.week
  }

  /**
   * Set values using epiweek
   */
  fromEpiweek(epiweek: Epiweek) {
    this.year = Math.floor(epiweek / 100)
    this.week = epiweek % 100
    this.day = 1
  }

  /**
   * Return number of weeks in this MMWR season
   */
  get nWeeks(): number {
    return weeksInYear(this.year)
  }

  /**
   * Return number of weeks differing from this.
   * Equivalent of this - mdate
   */
  diffWeek(mdate: MMWRDate): number {
    if (this.year === mdate.year) {
      return this.week - mdate.week
    } else {
      // Order of dates [low, high]
      let ds = [this, mdate]
      let sign = -1
      if (this.year > mdate.year) {
        ds = [mdate, this]
        sign = 1
      }

      const nWeeks = ds[0].nWeeks
      let diff = ds[1].week + nWeeks - ds[0].week

      let begin = ds[0].year + 1
      while (begin < ds[1].year) {
        diff += nWeeks
        begin++
      }
      return sign * diff
    }
  }

  /**
   * Apply week delta
   * Equivalent of this = this + delta
   */
  applyWeekDiff(delta: number) {
    let newWeek

    while (true) {
      newWeek = this.week + delta
      if (delta > 0) {
        if (newWeek > this.nWeeks) {
          delta = newWeek - this.nWeeks - 1
          this.week = 1
          this.year++
        } else {
          this.week = newWeek
          break
        }
      } else {
        if (newWeek <= 0) {
          this.year--
          this.week = this.nWeeks
          delta = newWeek
        } else {
          this.week = newWeek
          break
        }
      }
    }
  }
}
