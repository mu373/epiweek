import { describe, it, expect } from 'vitest'
import { MMWRDate } from '../src/index'

describe('MMWRDate', () => {
  it('should initialize correctly', () => {
    const mdate = new MMWRDate(2016, 48)
    expect(mdate.year).toBe(2016)
    expect(mdate.week).toBe(48)
    expect(mdate.day).toBe(1) // default value
  })

  it('should return correct first day of season', () => {
    const mdate = new MMWRDate(2016, 48)
    const expected = new Date(2016, 0, 3) // Jan 3, 2016
    expect(mdate.startDate.getTime()).toBe(expected.getTime())
  })

  it('should return correct JS date', () => {
    const mdate = new MMWRDate(2016, 48)
    const expected = new Date(2016, 10, 27) // Nov 27, 2016
    expect(mdate.toJSDate().getTime()).toBe(expected.getTime())
  })

  it('should read correctly from JS date', () => {
    const mdate = new MMWRDate(2016)
    mdate.fromJSDate(new Date(2016, 11, 27)) // Dec 27, 2016

    expect(mdate.year).toBe(2016)
    expect(mdate.week).toBe(52)
    expect(mdate.day).toBe(3)
  })

  it('should return correct epiweek', () => {
    const mdate = new MMWRDate(2016, 52)
    expect(mdate.toEpiweek()).toBe(201652)
  })

  it('should read correctly from epiweek', () => {
    const mdate = new MMWRDate(2016)
    mdate.fromEpiweek(201732)

    expect(mdate.year).toBe(2017)
    expect(mdate.week).toBe(32)
    expect(mdate.day).toBe(1)
  })

  it('should return correct number of weeks', () => {
    let mdate = new MMWRDate(2016)
    expect(mdate.nWeeks).toBe(52)

    mdate = new MMWRDate(2014)
    expect(mdate.nWeeks).toBe(53)
  })

  it('should return correct week difference', () => {
    const mdate = new MMWRDate(2016, 52)
    const odate = new MMWRDate(2016, 3)

    expect(mdate.diffWeek(odate)).toBe(49)
  })

  it('should apply correct week difference', () => {
    const mdate = new MMWRDate(2016, 52, 3)
    mdate.applyWeekDiff(56)

    expect(mdate.year).toBe(2018)
    expect(mdate.week).toBe(4)
    expect(mdate.day).toBe(3)
  })
})
