# Delta EQ workbench

[Open Delta EQ](https://aaronth07.github.io/delta-eq/) · [Download the offline app](https://aaronth07.github.io/delta-eq/Delta-EQ-Offline.html)

The repository and hosted app are public. Imported curves and session files are processed in your browser; the app has no upload service. Save a session JSON to keep your work.

An independent, local-first frequency-response comparison and parametric-EQ design utility. It turns two imported curves into an inspectable difference, lets you adjust a target manually, fits bounded parametric filters, and exports settings for another playback engine.

## Run without an account or subscription

Open `Delta-EQ-Offline.html` in a recent desktop browser. It is a self-contained file with no dependencies, fonts, CDN, backend, API key or network requests. Keep it together with your saved session JSON files. The hosted edition, if supplied, has the same calculations but is not needed to use the offline copy.

Alternatively, serve `dist/` using any static server. For development, run `npm test`, then `npm run build`. Node 18+ is sufficient. There are no npm packages to install. The optional `npm run serve` uses Python 3 on port 8788.

## Workflow

1. Import a measurement and a target. Frequency in Hz and level in dB must be the first two columns. TXT, CSV, TSV and FRD are accepted as text. REW-like headers and phase columns are tolerated. Comma, whitespace, tab and semicolon separators are supported; semicolon input supports decimal commas. Quoted numeric CSV fields are accepted. Units embedded in numeric cells and automatic kHz inference are not supported.
2. Normalize the two base curves using one frequency or the mean of equally log-spaced points in the shared 100–10,000 Hz band. None preserves original absolute dB offsets. There is no extrapolation outside either curve's measured range.
3. Add optional manual bass, presence and air offsets to the target. These are explicit preference choices, not a learned model or a hearing measurement.
4. Fit or manually edit up to 12 peaking/low-shelf/high-shelf filters. The automatic fitter creates peaking filters only, with Q 0.3–6. Each gain limit is per filter; summed response can exceed it. The fit is numerical, not a recommendation to boost acoustic nulls or high-frequency measurement artifacts.
5. Suggest headroom, then export APO settings or a CSV of curves. Review settings and begin at low listening level when applying them elsewhere. The app never changes system configuration or starts playback.
6. Save a session JSON for durable storage. Browser local storage is only a convenience.

## Numerical definitions

- Duplicate frequencies are averaged in dB and data are sorted by frequency.
- Interpolation is piecewise linear in dB versus log frequency.
- Comparison uses the shared range, clipped to 20–20,000 Hz and below Nyquist. The displayed error is unweighted RMS in dB over equally spaced log frequencies.
- Base curves are normalized separately. Manual preference responses are then added to the normalized target.
- Corrected response equals normalized measurement plus the sum of the designed biquad responses in dB. The plot and error exclude global preamp so tonal shape and level headroom remain distinct.
- Filters use the RBJ cookbook digital biquad formulas. Shelf Q is used directly in the cookbook alpha formula. Exports use Equalizer APO’s documented LSC/HSC Q syntax; actual playback in Equalizer APO remains untested. Sample-rate selection affects the digital frequency response. Filter centers must be at least 1 Hz below Nyquist to avoid numerical degeneracy.
- The fitter performs deterministic residual seeding and coordinate search on frequency, gain and Q, followed by joint refinement. It is local optimization, not a guaranteed global optimum. Fit calculations use 256 log-spaced points in the requested band; plot metrics use 512 points in the full shared range. Their errors therefore need not be identical.
- Headroom samples the combined response at DC, Nyquist, filter centers, and two 8,192-point grids (log frequency and log prewarped frequency), then refines local maxima and adds 1 dB. It is a numerical estimate, not a proof of true-peak or clipping safety.

## Validation

Run `npm test`, then `npm run build`. The application has no package dependencies. The build refreshes the offline HTML and SHA-256 file manifest. Optional independent checks use `python3 tests/verify_scipy.py` with NumPy and SciPy installed.

The numerical regression suite covers parsing, normalization, interpolation, filter coefficients, stability, cascading, headroom, fitting, exports and session validation. Browser checks cover imports, editing, fitting, exports, session persistence, undo and responsive layouts in Chromium, Firefox and WebKit. See `VALIDATION.md` for the tested environments and remaining limits.

A GitHub Actions workflow runs the regression suite and rebuilds the static site before deploying `main` to GitHub Pages. Assets use relative paths so the app works under the `/delta-eq/` project path. The same build includes the standalone offline HTML.

## Files

- `Delta-EQ-Offline.html`: self-contained runnable app.
- `dist/`: identical modular browser source.
- `tests/core.test.js`: numerical and validation regressions.
- `build.js`: creates the standalone file from the modular source.
- `package.json`: commands, with no package dependencies.

## Boundaries

No audio playback, microphone capture, live system EQ, HRTF processing, hearing calibration, machine learning, PEQdB model reproduction, automatic measurement-quality assessment, real-device validation or Windows APO application is included. Data from different fixtures or measurement conventions may not be directly comparable. Real headphone and speaker measurements require interpretation, especially at high frequencies and in room nulls.

## References

- Robert Bristow-Johnson, Audio EQ Cookbook, W3C: https://www.w3.org/TR/audio-eq-cookbook/
- Equalizer APO configuration reference: https://sourceforge.net/p/equalizerapo/wiki/Configuration%20reference/

Original implementation. No PEQdB source, model, branding or website extraction is used.
