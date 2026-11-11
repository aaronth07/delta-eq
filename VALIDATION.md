# Validation

Tested November 11, 2026 on macOS, with Node 26.13 locally. GitHub Actions uses Node 22. The application has no npm dependencies.

## Numerical and build checks

- 35 repository regression tests pass, including the offline build and manifest.
- 17 independent checks cover every exported core function: `clamp`, `logGrid`, `parseCurve`, `cleanCurve`, `interpolate`, `coefficients`, `responseAt`, `response`, `preferenceFilters`, `analyze`, `headroom`, `exportAPO`, `exportCSV`, `validateState`, `fitPeaks`, `demo` and `rms`.
- The independent coefficient oracle uses the W3C cookbook equations and a separate complex-polynomial response evaluator.
- The SciPy crosscheck passes for 162 peaking/shelf configurations at 20,736 frequency samples. Maximum difference: 2.4428e-9 dB.
- The synthetic demo fit reduces full-range displayed RMS from 2.15 to 0.21 dB. This checks software behavior, not audible quality.
- JavaScript syntax checks and the self-contained offline build pass.

The formulas were checked against [W3C Audio EQ Cookbook](https://www.w3.org/TR/audio-eq-cookbook/). APO output was checked against the documented Preamp, PK, LSC/HSC and Q syntax in the [Equalizer APO configuration reference](https://sourceforge.net/p/equalizerapo/wiki/Configuration%20reference/). The reference documents the shelf-Q parameter but does not fully define its numerical semantics. Playback in Equalizer APO has not been tested.

Log-frequency interpolation, normalization grids, the fitter objective and the headroom margin are this application's definitions. They are not measurement or listening standards.

## Browser workflow

Automated Playwright checks pass in Chromium, Firefox and WebKit. The Browser plugin was not available. These are browser-engine tests on macOS, not physical iPhone, Windows or stock Safari acceptance tests.

| Check | Result |
| --- | --- |
| Page identity, meaningful content and plotted curves | Pass |
| TXT/CSV/TSV file imports and invalid pasted data | Pass |
| Fit target, headroom and response/correction views | Pass |
| Fractional filter edits, add/remove and Undo | Pass |
| Session JSON save/load and reload persistence | Pass |
| APO and 512-point CSV downloads | Pass |
| Responsive layouts at 320, 390, 720, 1024 and 1440 px | Pass |
| App console errors during the workflow | None |
| Standalone file opened directly and fitted offline | Pass |

An axe-core WCAG A/AA scan reports zero automated violations at 1440 and 390 px. Color-contrast checks include manual-review items, so this is not a claim of complete accessibility conformance. The Impeccable detector identified undersized secondary text; it was raised to at least 12 px. Its table-wrapper padding warning is a false positive: the intentionally flush table has padding inside its cells. Tooltip decoration was simplified to a single border.

## Independent usability and UI/UX passes

Luna at High performed three separate passes: exported functions and source references, usability, and UI/UX. The usability pass exercised every visible control, including all normalization and sample-rate choices, preference sliders, filter types and enable states, the 12-filter limit, zero-limit fitting, invalid inputs, help, exports and persistence. No reproducible blockers remained.

Explicit delayed-file-read tests passed for pending session loads versus Undo, concurrent session selection, and pending curve imports versus Flat target, Demo and Undo. After 50 valid changes and a rejected edit, all 50 Undo steps remained available.

The UI/UX pass checked 320, 390, 720, 1024 and 1440 px, keyboard focus and skip navigation, long CJK/emoji filenames, table access, and empty/error states. It found a pointer-only graph readout; keyboard navigation and a live value readout were added and verified. No page-wide overflow or visual clipping remained at the tested widths.

## Fixes in this publication

- Narrow high-Q peaks near Nyquist are included in the headroom estimate using both ordinary and prewarped grids, explicit centers and local-maximum refinement.
- Filter centers must remain at least 1 Hz below Nyquist. Imported sessions with degenerate filter frequencies are rejected.
- Empty TSV frequencies and levels are skipped rather than silently replaced by the phase column. Malformed session curve levels are rejected.
- Frequency-grid point counts must be integers, and range bounds must be finite.
- Fractional filter and preamp edits are accepted without HTML step-validation conflicts.
- Pending curve imports cannot overwrite a later flat target, demo reset or Undo. Concurrent session loads select the latest file; pending session loads respect Undo.
- Rejected edits preserve the complete Undo history, including at its 50-entry limit.
- Mobile overflow is contained inside the filter table. Mobile controls have larger touch targets, and inputs use 16 px text to avoid focus zoom.
- Keyboard users can skip to the workbench, focus the scrollable filter table and inspect graph points with Left/Right or Home/End. Point values are announced through a live region.
- Plot resizing is scheduled outside the ResizeObserver callback and ignores height-only changes, preventing the WebKit observer-loop error.
- The offline builder preserves literal replacement tokens in source and refreshes SHA-256 file checksums.

## Limits

No acoustic, listening, microphone, playback or physical-device validation has been performed. No Windows Equalizer APO execution, stock Safari session, screen-reader acceptance or clean-machine desktop distribution is claimed. The fitter uses local optimization; it is not guaranteed to find a global optimum. Gain bounds apply per filter, not to the summed response. Headroom remains a numerical estimate rather than a true-peak or clipping guarantee.

The original archive records two previously tested private measurements. They were not supplied in this archive, were not retested here and are not published. All bundled curves are synthetic.
