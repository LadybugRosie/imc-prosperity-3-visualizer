# IMC Prosperity 4 Visualizer

 Use the existing file drop UI.

  From the repo root, run:

  pnpm install
  pnpm dev

  Then open the local Vite URL, usually http://localhost:5173/imc-prosperity-3-visualizer/ or http://localhost:5173/.

  On the home page, use Load from file and drag in your CSV files:

  - for tutorial data, drop the whole set together, like prices_*.csv and trades_*.csv
  - for old Prosperity log files, drop a single log file

  I changed src/pages/home/LoadFromFile.tsx so it detects:

  - all-CSV drop: parses tutorial CSVs
  - single non-CSV file: parses a normal Prosperity log

  If you want to test exactly with your files, drag these four in together:

  - /Users/davidhovey/Downloads/Tutorial Round 1/prices_round_0_day_-2.csv
  - /Users/davidhovey/Downloads/Tutorial Round 1/prices_round_0_day_-1.csv
  - /Users/davidhovey/Downloads/Tutorial Round 1/trades_round_0_day_-2.csv
  - /Users/davidhovey/Downloads/Tutorial Round 1/trades_round_0_day_-1.csv

[![Build Status](https://github.com/jmerle/imc-prosperity-3-visualizer/workflows/Build/badge.svg)](https://github.com/jmerle/imc-prosperity-3-visualizer/actions/workflows/build.yml)

This repository contains the source code behind [jmerle.github.io/imc-prosperity-3-visualizer/](https://jmerle.github.io/imc-prosperity-3-visualizer/), adapted as a visualizer for [IMC Prosperity 4](https://prosperity.imc.com/) algorithms. It is based on my visualizers for Prosperity [1](https://github.com/jmerle/imc-prosperity-visualizer) and [2](https://github.com/jmerle/imc-prosperity-2-visualizer).
