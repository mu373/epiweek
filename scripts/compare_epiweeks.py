#!/usr/bin/env python3
"""
Compare epiweek (TypeScript) with epiweeks (Python) library.

This script validates that both libraries produce identical results for:
1. Date to epiweek conversion
2. Epiweek to date conversion
3. Number of weeks in a year

Usage:
    npx tsx scripts/generate_mmwr_results.ts  # Generate mmwr_results.json first
    uv run scripts/compare_epiweeks.py
"""

# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "epiweeks>=2.1.0",
# ]
# ///

import json
import sys
from datetime import date
from pathlib import Path
from typing import NamedTuple

from epiweeks import Week, Year


class ComparisonResult(NamedTuple):
    test_name: str
    passed: bool
    details: str


def load_epiweek_results() -> dict:
    """Load epiweek (TS) results from JSON file."""
    json_path = Path(__file__).parent / "mmwr_results.json"
    if not json_path.exists():
        print(f"Error: {json_path} not found.", file=sys.stderr)
        print("Run 'npx tsx scripts/generate_mmwr_results.ts' first.", file=sys.stderr)
        sys.exit(1)
    return json.loads(json_path.read_text())


def compare_date_to_epiweek(ts_results: dict) -> ComparisonResult:
    """Compare date to epiweek conversion."""
    mismatches = []
    test_dates = list(ts_results["dateToEpiweek"].keys())

    for date_str in test_dates:
        year, month, day = map(int, date_str.split("-"))
        d = date(year, month, day)

        # epiweeks library (CDC system)
        py_week = Week.fromdate(d, system="cdc")
        py_result = {"year": py_week.year, "week": py_week.week}

        # epiweek (TS) library
        ts_result = ts_results["dateToEpiweek"][date_str]
        ts_comparable = {"year": ts_result["year"], "week": ts_result["week"]}

        if py_result != ts_comparable:
            mismatches.append(
                f"{date_str}: epiweeks(py)={py_result}, epiweek(ts)={ts_comparable}"
            )

    if mismatches:
        return ComparisonResult(
            test_name="Date to Epiweek",
            passed=False,
            details=f"Found {len(mismatches)} mismatches:\n"
            + "\n".join(mismatches[:20])
            + ("\n..." if len(mismatches) > 20 else ""),
        )
    return ComparisonResult(
        test_name="Date to Epiweek",
        passed=True,
        details=f"All {len(test_dates)} dates match",
    )


def compare_epiweek_to_date(ts_results: dict) -> ComparisonResult:
    """Compare epiweek to date conversion (week start dates)."""
    mismatches = []

    for year in range(2015, 2031):
        # Test week 1 start date
        py_week = Week(year, 1, system="cdc")
        py_start = py_week.startdate().isoformat()

        ts_start = ts_results["epiweekToDate"].get(f"{year}01")

        if py_start != ts_start:
            mismatches.append(
                f"Year {year} Week 1 start: epiweeks(py)={py_start}, epiweek(ts)={ts_start}"
            )

        # Test last week end date
        py_year = Year(year, system="cdc")
        py_last_week = list(py_year.iterweeks())[-1]
        py_end = py_last_week.enddate().isoformat()

        nweeks = ts_results["weeksInYear"].get(str(year), 52)
        ts_end = ts_results["epiweekToDate"].get(f"{year}{nweeks:02d}_end")

        if py_end != ts_end:
            mismatches.append(
                f"Year {year} Week {nweeks} end: epiweeks(py)={py_end}, epiweek(ts)={ts_end}"
            )

    if mismatches:
        return ComparisonResult(
            test_name="Epiweek to Date",
            passed=False,
            details=f"Found {len(mismatches)} mismatches:\n" + "\n".join(mismatches),
        )
    return ComparisonResult(
        test_name="Epiweek to Date",
        passed=True,
        details="All year start/end dates match",
    )


def compare_weeks_in_year(ts_results: dict) -> ComparisonResult:
    """Compare number of weeks in each year."""
    mismatches = []

    for year in range(2015, 2031):
        py_year = Year(year, system="cdc")
        py_weeks = len(list(py_year.iterweeks()))

        ts_weeks = ts_results["weeksInYear"].get(str(year))

        if py_weeks != ts_weeks:
            mismatches.append(
                f"Year {year}: epiweeks(py)={py_weeks} weeks, epiweek(ts)={ts_weeks} weeks"
            )

    if mismatches:
        return ComparisonResult(
            test_name="Weeks in Year",
            passed=False,
            details=f"Found {len(mismatches)} mismatches:\n" + "\n".join(mismatches),
        )
    return ComparisonResult(
        test_name="Weeks in Year",
        passed=True,
        details="All years have matching week counts",
    )


def main():
    print("=" * 60)
    print("Comparing epiweek (TypeScript) with epiweeks (Python)")
    print("=" * 60)
    print()

    # Load epiweek (TS) results
    print("Loading epiweek (TS) results...")
    ts_results = load_epiweek_results()
    test_count = len(ts_results["dateToEpiweek"])
    print(f"Loaded {test_count} date conversions")
    print()

    # Run comparisons
    results = [
        compare_date_to_epiweek(ts_results),
        compare_epiweek_to_date(ts_results),
        compare_weeks_in_year(ts_results),
    ]

    # Print results
    all_passed = True
    for result in results:
        status = "PASS" if result.passed else "FAIL"
        print(f"[{status}] {result.test_name}")
        print(f"       {result.details}")
        print()
        if not result.passed:
            all_passed = False

    # Summary
    print("=" * 60)
    if all_passed:
        print("All comparisons PASSED")
        print("epiweek (TS) produces identical results to epiweeks (Python)")
        sys.exit(0)
    else:
        print("Some comparisons FAILED")
        print("epiweek (TS) differs from epiweeks (Python)")
        sys.exit(1)


if __name__ == "__main__":
    main()
