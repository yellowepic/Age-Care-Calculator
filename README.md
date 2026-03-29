# Aged Care Financial Calculator 🏠💵

A comprehensive, responsive web application built for calculating, comparing, and projecting aged care financial scenarios under **Post-November 2025 Australian regulations**. This powerful tool allows families and financial advisors to input personal asset demographics and facility costs to simulate and contrast long-term financial outcomes.

## 🌟 Key Features

* **3-Scenario Comparison Engine**: Actively models three independent strategies simultaneously:
  1. **Sell House**: Liquidate the family home to pay the Refundable Accommodation Deposit (RAD) in full, retaining and investing remaining cash.
  2. **Keep House (Empty)**: Hold the property (gaining capital growth) and pay Daily Accommodation Payments (DAP) directly from cash savings.
  3. **Rent House**: Lease the family home to generate compounding rental income that offsets the DAP and care fees.
* **Post-2025 Regulatory Logic**: Fully operational with the latest Australian Aged Care fee structures.
  * **RAD Retention Rule**: Implements the statutory 2% annual retention mechanism (up to a 5-year/10% maximum).
  * **NCCC vs HSC**: Distinguishes between Non-Clinical Care Contributions (NCCC)—which are dynamically capped at $135,318.69 or 4 years—and uncapped Hotelling Supplement Contributions (HSC).
  * **Optional Fees**: Integrates continuous compounding for standard Basic Daily Fees and optional Wellbeing Choice/Higher Everyday Living Fees.
* **Year-on-Year Projections**: Leverages dynamic table generation and interactive `Chart.js` rendering to graph projected **Net Wealth** trajectories over customized spans (1–20 years).
* **Negative Cash Protection**: Real-time logic intelligently flags scenarios with a visual red alert if physical cash reserves are mathematically depleted. 
* **State Persistence**: Native browser `localStorage` integration secures your input state perfectly between sessions.

## 🛠️ Technology Stack

* **Frontend Engine**: Pure HTML5, CSS3, and Vanilla JavaScript (ES6+). Zero bloat.
* **Styling Matrix**: Distinctive premium Glassmorphism aesthetic operating on custom CSS variables, translucent panels, and responsive grid arrangements.
* **Data Visualization**: Dynamic trajectory graphing driven by `Chart.js` (via CDN).

## 🚀 Getting Started

This application requires absolutely zero build tools, node modules, or compile scripts. It runs entirely on client-side technologies.
1. Clone or download this repository to your local machine.
2. Double-click `index.html` to open it in any standard modern web browser (Google Chrome, Safari, Firefox, Edge).
3. The calculator works natively offline with instant scenario switching!

## 📄 Disclaimer

This calculator was meticulously designed to model aged care scenarios based on public parameters but is built exclusively for **educational and estimation purposes**. It does not consider Age Pension centerlink interactions or specialized two-year home exemptions. It should **not** substitute formal financial advice from a registered financial planner or an accountant.
