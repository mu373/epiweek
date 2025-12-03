/**
 * Main module file for epiweek
 */

import { addDays, getYear, differenceInDays, getISODay } from 'date-fns'
import { memoize } from 'micro-memoize'

/**
 * Epiweek in format yyyyww
 */
export type Epiweek = number

/**
 * Week system type - MMWR (CDC) or ISO
 */
export type WeekSystem = 'mmwr' | 'iso'

/**
 * Options for EpiWeek constructor
 */
export interface EpiWeekOptions {
  system?: WeekSystem
  day?: number
}

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
 * Get start date of ISO week year (Monday of week 1)
 * ISO week 1 contains January 4th (i.e., the first week with a Thursday in the new year)
 */
function getISOWeekYearStart(year: number): Date {
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = getISODay(jan4) // Mon=1 to Sun=7
  // Go back to Monday of that week
  return addDays(jan4, 1 - dayOfWeek)
}

/**
 * Get start date for a given year and week system
 */
function getYearStart(year: number, system: WeekSystem): Date {
  return system === 'iso' ? getISOWeekYearStart(year) : getMMWRYearStart(year)
}

/**
 * Memoized function for number of weeks in a year for a given system
 */
const weeksInYear = memoize(function (year: number, system: WeekSystem): number {
  const start = getYearStart(year, system)
  const nextStart = getYearStart(year + 1, system)
  return Math.round(differenceInDays(nextStart, start) / 7)
})

/**
 * Class representing an epidemiological week (MMWR or ISO)
 */
export class EpiWeek {
  public year: number
  public week: number
  public day: number
  public readonly system: WeekSystem

  constructor(year: number, week: number = 1, options?: EpiWeekOptions | number) {
    this.year = year
    this.week = week

    if (typeof options === 'number') {
      // Legacy API: third param is day
      this.day = options
      this.system = 'mmwr'
    } else {
      this.day = options?.day ?? 1
      this.system = options?.system ?? 'mmwr'
    }
  }

  /**
   * Return year start date (first day of week 1)
   */
  get startDate(): Date {
    return getYearStart(this.year, this.system)
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
    const startDates = [year - 1, year, year + 1].map((y) => getYearStart(y, this.system))
    const diffs = startDates.map((d) => differenceInDays(date, d))

    let startId = 1
    if (diffs[1] < 0) startId = 0
    else if (diffs[2] >= 0) startId = 2

    const startDate = startDates[startId]

    this.year = getYear(addDays(startDate, 7))
    this.week = Math.floor(differenceInDays(date, startDate) / 7) + 1

    // Day calculation differs by system
    const isoDay = getISODay(date) // Mon=1 to Sun=7
    if (this.system === 'iso') {
      this.day = isoDay // ISO: Mon=1 to Sun=7
    } else {
      this.day = (isoDay % 7) + 1 // MMWR: Sun=1 to Sat=7
    }
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
   * Return number of weeks in this epi year
   */
  get nWeeks(): number {
    return weeksInYear(this.year, this.system)
  }

  /**
   * Return number of weeks differing from this.
   * Equivalent of this - other
   */
  diffWeek(other: EpiWeek): number {
    if (this.year === other.year) {
      return this.week - other.week
    } else {
      // Order of dates [low, high]
      let ds = [this, other]
      let sign = -1
      if (this.year > other.year) {
        ds = [other, this]
        sign = 1
      }

      const nWeeks = ds[0].nWeeks
      let diff = ds[1].week + nWeeks - ds[0].week

      let begin = ds[0].year + 1
      while (begin < ds[1].year) {
        diff += weeksInYear(begin, this.system)
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

  /**
   * Check equality with another EpiWeek
   */
  equals(other: EpiWeek): boolean {
    return (
      this.system === other.system &&
      this.year === other.year &&
      this.week === other.week &&
      this.day === other.day
    )
  }

  /**
   * Check if this EpiWeek is before another
   */
  isBefore(other: EpiWeek): boolean {
    // Cross-system: compare actual dates
    if (this.system !== other.system) {
      return this.toJSDate().getTime() < other.toJSDate().getTime()
    }
    if (this.year !== other.year) return this.year < other.year
    if (this.week !== other.week) return this.week < other.week
    return this.day < other.day
  }

  /**
   * Check if this EpiWeek is after another
   */
  isAfter(other: EpiWeek): boolean {
    if (this.system !== other.system) {
      return this.toJSDate().getTime() > other.toJSDate().getTime()
    }
    if (this.year !== other.year) return this.year > other.year
    if (this.week !== other.week) return this.week > other.week
    return this.day > other.day
  }

  /**
   * Iterate over all dates in this week
   */
  *iterDates(): Generator<Date, void, unknown> {
    const weekStart = getYearStart(this.year, this.system)
    const firstDayOfWeek = addDays(weekStart, (this.week - 1) * 7)

    for (let d = 0; d < 7; d++) {
      yield addDays(firstDayOfWeek, d)
    }
  }
}

/** @deprecated Use EpiWeek instead */
export { EpiWeek as MMWRDate }
