# scripts/archive — the retired suites

The 0.3.0 → 1.5.8-era batch suites live here, out of the battery's path.
Their pinned laws were superseded release after release (every surviving
law rides a newer suite), so the battery retired them — history stays
browsable, verdicts do not. Nothing runs this folder: `node --test
'scripts/*.test.mjs'` does not cross directories, and the battery runner
(`run_battery_171.sh`) never listed them. The maintained battery — the
same 60 the dev box runs, plus the 1.6.2 pack-main gate — is what CI
runs on every push.
