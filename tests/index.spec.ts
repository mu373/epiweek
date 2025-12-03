import { describe, it, expect } from 'vitest'
import { EpiWeek, MMWRDate } from '../src/index'

describe('EpiWeek (MMWR system - backwards compatibility)', () => {
  it('should initialize correctly', () => {
    const epiweek = new EpiWeek(2016, 48)
    expect(epiweek.year).toBe(2016)
    expect(epiweek.week).toBe(48)
    expect(epiweek.day).toBe(1) // default value
    expect(epiweek.system).toBe('mmwr') // default system
  })

  it('should support legacy day parameter', () => {
    const epiweek = new EpiWeek(2016, 48, 3)
    expect(epiweek.day).toBe(3)
    expect(epiweek.system).toBe('mmwr')
  })

  it('should support options object with day', () => {
    const epiweek = new EpiWeek(2016, 48, { day: 3 })
    expect(epiweek.day).toBe(3)
    expect(epiweek.system).toBe('mmwr')
  })

  it('should support options object with system and day', () => {
    const epiweek = new EpiWeek(2016, 48, { system: 'mmwr', day: 5 })
    expect(epiweek.day).toBe(5)
    expect(epiweek.system).toBe('mmwr')
  })

  it('should return correct first day of season', () => {
    const epiweek = new EpiWeek(2016, 48)
    const expected = new Date(2016, 0, 3) // Jan 3, 2016
    expect(epiweek.startDate.getTime()).toBe(expected.getTime())
  })

  it('should return correct JS date', () => {
    const epiweek = new EpiWeek(2016, 48)
    const expected = new Date(2016, 10, 27) // Nov 27, 2016
    expect(epiweek.toJSDate().getTime()).toBe(expected.getTime())
  })

  it('should read correctly from JS date', () => {
    const epiweek = new EpiWeek(2016)
    epiweek.fromJSDate(new Date(2016, 11, 27)) // Dec 27, 2016

    expect(epiweek.year).toBe(2016)
    expect(epiweek.week).toBe(52)
    expect(epiweek.day).toBe(3)
  })

  it('should return correct epiweek', () => {
    const epiweek = new EpiWeek(2016, 52)
    expect(epiweek.toEpiweek()).toBe(201652)
  })

  it('should read correctly from epiweek', () => {
    const epiweek = new EpiWeek(2016)
    epiweek.fromEpiweek(201732)

    expect(epiweek.year).toBe(2017)
    expect(epiweek.week).toBe(32)
    expect(epiweek.day).toBe(1)
  })

  it('should return correct number of weeks', () => {
    let epiweek = new EpiWeek(2016)
    expect(epiweek.nWeeks).toBe(52)

    epiweek = new EpiWeek(2014)
    expect(epiweek.nWeeks).toBe(53)
  })

  it('should return correct week difference', () => {
    const epiweek = new EpiWeek(2016, 52)
    const odate = new EpiWeek(2016, 3)

    expect(epiweek.diffWeek(odate)).toBe(49)
  })

  it('should apply correct week difference', () => {
    const epiweek = new EpiWeek(2016, 52, 3)
    epiweek.applyWeekDiff(56)

    expect(epiweek.year).toBe(2018)
    expect(epiweek.week).toBe(4)
    expect(epiweek.day).toBe(3)
  })
})

describe('MMWRDate deprecated alias', () => {
  it('should work as alias for EpiWeek', () => {
    const mdate = new MMWRDate(2016, 48)
    expect(mdate.year).toBe(2016)
    expect(mdate.week).toBe(48)
    expect(mdate.system).toBe('mmwr')
  })
})

describe('EpiWeek ISO system', () => {
  it('should use Monday as first day of week', () => {
    // ISO week 1 of 2024 starts on Monday Jan 1, 2024
    const epiweek = new EpiWeek(2024, 1, { system: 'iso' })
    const startDate = epiweek.startDate
    expect(startDate.getDay()).toBe(1) // Monday = 1 in JS Date.getDay()
  })

  it('should calculate ISO week 1 correctly', () => {
    // ISO 2024-W01 starts Mon Dec 31, 2023... wait, let me verify
    // Jan 4, 2024 is Thursday. ISO week 1 contains Jan 4.
    // Going back to Monday: Jan 1, 2024 is Monday, so week 1 starts Jan 1, 2024
    const epiweek = new EpiWeek(2024, 1, { system: 'iso' })
    const expected = new Date(2024, 0, 1) // Jan 1, 2024 (Monday)
    expect(epiweek.startDate.getTime()).toBe(expected.getTime())
  })

  it('should handle 52-week ISO years', () => {
    // 2024 is a leap year, but ISO 2024 has 52 weeks
    const epiweek = new EpiWeek(2024, 1, { system: 'iso' })
    expect(epiweek.nWeeks).toBe(52)
  })

  it('should handle 53-week ISO years', () => {
    // 2020 is a 53-week ISO year (Jan 1, 2020 was Wednesday)
    const epiweek = new EpiWeek(2020, 1, { system: 'iso' })
    expect(epiweek.nWeeks).toBe(53)
  })

  it('should convert fromJSDate correctly', () => {
    const epiweek = new EpiWeek(2024, 1, { system: 'iso' })
    // Wednesday, Jan 10, 2024 should be ISO week 2, day 3 (Wednesday)
    epiweek.fromJSDate(new Date(2024, 0, 10))

    expect(epiweek.year).toBe(2024)
    expect(epiweek.week).toBe(2)
    expect(epiweek.day).toBe(3) // ISO: Wed = 3
  })

  it('should convert toJSDate correctly', () => {
    // ISO 2024-W02-3 (Wed of week 2)
    const epiweek = new EpiWeek(2024, 2, { system: 'iso', day: 3 })
    const expected = new Date(2024, 0, 10) // Jan 10, 2024
    expect(epiweek.toJSDate().getTime()).toBe(expected.getTime())
  })

  it('should handle year boundary correctly', () => {
    // Dec 31, 2024 should be ISO week 1 of 2025
    const epiweek = new EpiWeek(2024, 1, { system: 'iso' })
    epiweek.fromJSDate(new Date(2024, 11, 31)) // Dec 31, 2024

    expect(epiweek.year).toBe(2025)
    expect(epiweek.week).toBe(1)
  })
})

describe('EpiWeek comparison', () => {
  it('equals returns true for same week', () => {
    const a = new EpiWeek(2025, 10)
    const b = new EpiWeek(2025, 10)
    expect(a.equals(b)).toBe(true)
  })

  it('equals returns false for different days', () => {
    const a = new EpiWeek(2025, 10, 1)
    const b = new EpiWeek(2025, 10, 2)
    expect(a.equals(b)).toBe(false)
  })

  it('equals returns false for different systems', () => {
    const a = new EpiWeek(2025, 10, { system: 'mmwr' })
    const b = new EpiWeek(2025, 10, { system: 'iso' })
    expect(a.equals(b)).toBe(false)
  })

  it('isBefore works within same year', () => {
    const a = new EpiWeek(2025, 10)
    const b = new EpiWeek(2025, 20)
    expect(a.isBefore(b)).toBe(true)
    expect(b.isBefore(a)).toBe(false)
  })

  it('isBefore works across years', () => {
    const a = new EpiWeek(2024, 52)
    const b = new EpiWeek(2025, 1)
    expect(a.isBefore(b)).toBe(true)
    expect(b.isBefore(a)).toBe(false)
  })

  it('isBefore compares days within same week', () => {
    const a = new EpiWeek(2025, 10, 1)
    const b = new EpiWeek(2025, 10, 3)
    expect(a.isBefore(b)).toBe(true)
    expect(b.isBefore(a)).toBe(false)
  })

  it('isAfter is inverse of isBefore', () => {
    const a = new EpiWeek(2025, 10)
    const b = new EpiWeek(2025, 20)
    expect(a.isAfter(b)).toBe(false)
    expect(b.isAfter(a)).toBe(true)
  })

  it('equal weeks are neither before nor after', () => {
    const a = new EpiWeek(2025, 10, 3)
    const b = new EpiWeek(2025, 10, 3)
    expect(a.isBefore(b)).toBe(false)
    expect(a.isAfter(b)).toBe(false)
  })

  it('cross-system comparison uses actual dates', () => {
    // Jan 1, 2024 is Monday
    // MMWR 2024 week 1 starts Sunday Dec 31, 2023 (week has 6 days in 2024)
    // ISO 2024 week 1 starts Monday Jan 1, 2024
    const mmwr = new EpiWeek(2024, 1, { system: 'mmwr' })
    const iso = new EpiWeek(2024, 1, { system: 'iso' })

    // MMWR week 1 day 1 (Dec 31) should be before ISO week 1 day 1 (Jan 1)
    expect(mmwr.isBefore(iso)).toBe(true)
    expect(iso.isAfter(mmwr)).toBe(true)
  })
})

describe('EpiWeek iterDates', () => {
  it('yields 7 dates', () => {
    const week = new EpiWeek(2025, 10)
    const dates = [...week.iterDates()]
    expect(dates.length).toBe(7)
  })

  it('starts on Sunday for MMWR', () => {
    const week = new EpiWeek(2025, 10)
    const dates = [...week.iterDates()]
    expect(dates[0].getDay()).toBe(0) // Sunday = 0 in JS Date.getDay()
  })

  it('ends on Saturday for MMWR', () => {
    const week = new EpiWeek(2025, 10)
    const dates = [...week.iterDates()]
    expect(dates[6].getDay()).toBe(6) // Saturday = 6
  })

  it('starts on Monday for ISO', () => {
    const week = new EpiWeek(2025, 10, { system: 'iso' })
    const dates = [...week.iterDates()]
    expect(dates[0].getDay()).toBe(1) // Monday = 1
  })

  it('ends on Sunday for ISO', () => {
    const week = new EpiWeek(2025, 10, { system: 'iso' })
    const dates = [...week.iterDates()]
    expect(dates[6].getDay()).toBe(0) // Sunday = 0
  })

  it('works with for...of', () => {
    const week = new EpiWeek(2025, 10)
    let count = 0
    for (const date of week.iterDates()) {
      expect(date instanceof Date).toBe(true)
      count++
    }
    expect(count).toBe(7)
  })

  it('dates are consecutive', () => {
    const week = new EpiWeek(2025, 10)
    const dates = [...week.iterDates()]

    for (let i = 1; i < dates.length; i++) {
      const diff = dates[i].getTime() - dates[i - 1].getTime()
      expect(diff).toBe(24 * 60 * 60 * 1000) // 1 day in ms
    }
  })
})
