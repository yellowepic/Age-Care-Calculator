document.addEventListener('DOMContentLoaded', () => {
    // Input elements
    const inputs = {
        duration: document.getElementById('duration'),
        savings: document.getElementById('savings'),
        houseValue: document.getElementById('houseValue'),
        interestRate: document.getElementById('interestRate'),
        houseGrowth: document.getElementById('houseGrowth'),
        houseRent: document.getElementById('houseRent'),
        rad: document.getElementById('rad'),
        mpir: document.getElementById('mpir'),
        basicFee: document.getElementById('basicFee'),
        ncccFee: document.getElementById('ncccFee'),
        hscFee: document.getElementById('hscFee'),
        wcfFee: document.getElementById('wcfFee'),
        otherAssets: document.getElementById('otherAssets'),
        otherIncome: document.getElementById('otherIncome')
    };

    function parseInput(inputElement) {
        if (!inputElement || !inputElement.value) return 0;
        const cleanString = inputElement.value.toString().replace(/,/g, '');
        return parseFloat(cleanString) || 0;
    }

    function formatNumberInput(value) {
        if (value === null || value === undefined) return '';
        const raw = value.toString().replace(/,/g, '');
        const parts = raw.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join('.');
    }

    const savedData = localStorage.getItem('ageCareCalculatorInputs');
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            for (const key in parsed) {
                if (inputs[key] && parsed[key] !== undefined) {
                    inputs[key].value = formatNumberInput(parsed[key]);
                }
            }
        } catch(e) { console.error('Error loading saved inputs', e); }
    }

    // Tab Listeners
    const tabSummary = document.getElementById('tab-summary');
    const tabDetail = document.getElementById('tab-detail');
    const tabChart = document.getElementById('tab-chart');
    const contentSummary = document.getElementById('content-summary');
    const contentDetail = document.getElementById('content-detail');
    const contentChart = document.getElementById('content-chart');

    const switchTab = (activeTab, activeContent) => {
        [tabSummary, tabDetail, tabChart].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
        [contentSummary, contentDetail, contentChart].forEach(content => {
            if (content) content.classList.remove('active');
        });
        
        if (activeTab) activeTab.classList.add('active');
        if (activeContent) activeContent.classList.add('active');
    };

    if (tabSummary) tabSummary.addEventListener('click', () => switchTab(tabSummary, contentSummary));
    if (tabDetail) tabDetail.addEventListener('click', () => switchTab(tabDetail, contentDetail));
    if (tabChart) tabChart.addEventListener('click', () => {
        switchTab(tabChart, contentChart);
        if (window.wealthChartInstance) window.wealthChartInstance.resize();
    });

    // Output elements
    const outputs = {
        displayDuration: document.getElementById('display-duration'),
        
        s1Fees: document.getElementById('s1-fees'),
        s1FeesBasic: document.getElementById('s1-fees-basic'),
        s1FeesWcf: document.getElementById('s1-fees-wcf'),
        s1FeesNccc: document.getElementById('s1-fees-nccc'),
        s1FeesHsc: document.getElementById('s1-fees-hsc'),
        s1FeesDap: document.getElementById('s1-fees-dap'),
        s1FeesRad: document.getElementById('s1-fees-rad'),
        s1Cash: document.getElementById('s1-cash'),
        s1Pension: document.getElementById('s1-pension'),
        s1RadRefund: document.getElementById('s1-rad-refund'),
        s1Net: document.getElementById('s1-net'),
        
        s2Fees: document.getElementById('s2-fees'),
        s2FeesBasic: document.getElementById('s2-fees-basic'),
        s2FeesWcf: document.getElementById('s2-fees-wcf'),
        s2FeesNccc: document.getElementById('s2-fees-nccc'),
        s2FeesHsc: document.getElementById('s2-fees-hsc'),
        s2FeesDap: document.getElementById('s2-fees-dap'),
        s2Cash: document.getElementById('s2-cash'),
        s2Pension: document.getElementById('s2-pension'),
        s2House: document.getElementById('s2-house'),
        s2Net: document.getElementById('s2-net'),

        s3Fees: document.getElementById('s3-fees'),
        s3FeesBasic: document.getElementById('s3-fees-basic'),
        s3FeesWcf: document.getElementById('s3-fees-wcf'),
        s3FeesNccc: document.getElementById('s3-fees-nccc'),
        s3FeesHsc: document.getElementById('s3-fees-hsc'),
        s3FeesDap: document.getElementById('s3-fees-dap'),
        s3Cash: document.getElementById('s3-cash'),
        s3RentAdded: document.getElementById('s3-rent-added'),
        s3Pension: document.getElementById('s3-pension'),
        s3House: document.getElementById('s3-house'),
        s3Net: document.getElementById('s3-net'),
        
        yoyTbodySummary: document.getElementById('yoy-tbody-summary'),
        yoyTbodyDetail: document.getElementById('yoy-tbody-detail')
    };

    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD',
            maximumFractionDigits: 0
        }).format(amount);
    }

    function calculate() {
        // Gathering raw values
        const vals = {
            duration: parseInput(inputs.duration),
            savings: parseInput(inputs.savings),
            houseValue: parseInput(inputs.houseValue),
            interestRate: parseInput(inputs.interestRate) / 100,
            houseGrowth: parseInput(inputs.houseGrowth) / 100,
            houseRent: parseInput(inputs.houseRent),
            rad: parseInput(inputs.rad),
            mpir: parseInput(inputs.mpir) / 100,
            basicFee: parseInput(inputs.basicFee),
            ncccFee: parseInput(inputs.ncccFee),
            hscFee: parseInput(inputs.hscFee),
            wcfFee: parseInput(inputs.wcfFee),
            otherAssets: parseInput(inputs.otherAssets),
            otherIncome: parseInput(inputs.otherIncome)
        };

        // Save inputs to localStorage
        const toSave = {};
        for (const key in inputs) {
            toSave[key] = inputs[key].value;
        }
        localStorage.setItem('ageCareCalculatorInputs', JSON.stringify(toSave));

        outputs.displayDuration.textContent = vals.duration;
        const daysInYear = 365.25;

        let totalBasicFees = 0;
        let totalWcfFeesPaid = 0;
        let totalNcccFeesPaid = 0;
        let totalHscFeesPaid = 0;
        
        let annualCareFeesArray = [];
        let runningNcccPaid = 0;
        const NCCC_LIFETIME_CAP = 135318.69;

        for (let year = 1; year <= vals.duration; year++) {
            let basicThisYear = vals.basicFee * daysInYear;
            let wcfThisYear = vals.wcfFee * daysInYear;
            let hscThisYear = vals.hscFee * daysInYear;
            let ncccThisYear = 0;
            
            // NCCC cap: 4 years max OR lifetime cap
            if (year <= 4 && runningNcccPaid < NCCC_LIFETIME_CAP) {
                let ncccPotential = vals.ncccFee * daysInYear;
                if (runningNcccPaid + ncccPotential > NCCC_LIFETIME_CAP) {
                    ncccThisYear = NCCC_LIFETIME_CAP - runningNcccPaid;
                } else {
                    ncccThisYear = ncccPotential;
                }
                runningNcccPaid += ncccThisYear;
            }
            
            let totalCareThisYear = basicThisYear + wcfThisYear + ncccThisYear + hscThisYear;
            annualCareFeesArray.push(totalCareThisYear);
            
            totalBasicFees += basicThisYear;
            totalWcfFeesPaid += wcfThisYear;
            totalNcccFeesPaid += ncccThisYear;
            totalHscFeesPaid += hscThisYear;
        }

        let yoyS1 = [];
        let yoyS2 = [];
        let yoyS3 = [];

        // --- Age Pension Processing (Single logic with March 2026 thresholds) ---
        function getAgePension(cash, isHomeowner, otherAssets, otherIncomeFn) {
            const MAX_PEN_FN = 1200.90;
            const ASSET_HOME = 321500;
            const ASSET_NON = 579500;
            const INCOME_FREE = 218;
            
            // Assets Test Computation
            let totalAssets = cash + otherAssets;
            let aLimit = isHomeowner ? ASSET_HOME : ASSET_NON;
            let aExcess = Math.max(0, totalAssets - aLimit);
            let aPenFn = Math.max(0, MAX_PEN_FN - (Math.floor(aExcess / 1000) * 3));

            // Income Test Computation (using dynamic Deeming constraints)
            let deemedAnn = (cash <= 64600) ? (cash * 0.0025) : ((64600 * 0.0025) + ((cash - 64600) * 0.0225));
            let totalIncFn = (deemedAnn / 26) + otherIncomeFn;
            let iExcess = Math.max(0, totalIncFn - INCOME_FREE);
            let iPenFn = Math.max(0, MAX_PEN_FN - (iExcess * 0.5));

            // The Age Pension defaults to whichever dual-test yields the lowest outcome.
            return Math.min(aPenFn, iPenFn) * 26;
        }

        // --- Scenario 1: Sell House, Pay RAD ---
        let s1TotalCash = vals.savings + vals.houseValue;
        let s1RadPaid = Math.min(s1TotalCash, vals.rad);
        let s1DapPerYear = 0;
        
        if (s1RadPaid < vals.rad) {
            let remainder = vals.rad - s1RadPaid;
            s1DapPerYear = remainder * vals.mpir;
        }
        
        let s1CurrentCash = s1TotalCash - s1RadPaid;
        let s1FeesPaid = 0;
        let s1TotalPension = 0;
        
        for(let i = 1; i <= vals.duration; i++) {
            // Non-homeowner limits (home was sold), RAD is completely exempt from testing.
            let pensionThisYear = getAgePension(s1CurrentCash, false, vals.otherAssets, vals.otherIncome);
            s1CurrentCash += pensionThisYear;
            s1TotalPension += pensionThisYear;

            s1CurrentCash += s1CurrentCash * vals.interestRate;
            let annualFees = annualCareFeesArray[i - 1] + s1DapPerYear;
            s1CurrentCash -= annualFees;
            s1FeesPaid += annualFees;
            
            let currentRetention = Math.min(0.10, 0.02 * i);
            let currentRefund = s1RadPaid - (s1RadPaid * currentRetention);
            yoyS1.push({ netWealth: s1CurrentCash + currentRefund, cash: s1CurrentCash, radRefund: currentRefund });
        }

        let retentionRate = Math.min(0.10, 0.02 * vals.duration);
        let retainedAmount = s1RadPaid * retentionRate;
        let s1RadRefund = s1RadPaid - retainedAmount;
        
        s1FeesPaid += retainedAmount;
        let s1NetWealth = s1CurrentCash + s1RadRefund;

        outputs.s1Fees.textContent = formatCurrency(s1FeesPaid);
        outputs.s1FeesBasic.textContent = formatCurrency(totalBasicFees);
        outputs.s1FeesWcf.textContent = formatCurrency(totalWcfFeesPaid);
        outputs.s1FeesNccc.textContent = formatCurrency(totalNcccFeesPaid);
        outputs.s1FeesHsc.textContent = formatCurrency(totalHscFeesPaid);
        outputs.s1FeesDap.textContent = formatCurrency(s1DapPerYear * vals.duration);
        outputs.s1FeesRad.textContent = formatCurrency(retainedAmount);

        outputs.s1Cash.textContent = formatCurrency(s1CurrentCash);
        outputs.s1Cash.className = 'value' + (s1CurrentCash < 0 ? ' negative-cash-text' : '');
        outputs.s1Pension.textContent = formatCurrency(s1TotalPension);
        outputs.s1RadRefund.textContent = formatCurrency(s1RadRefund);
        outputs.s1Net.textContent = formatCurrency(s1NetWealth);

        // --- Scenario 2: Keep House (No Rent), Pay DAP ---
        let s2DapPerYear = vals.rad * vals.mpir;
        let s2CurrentCash = vals.savings;
        let s2HouseValueObj = vals.houseValue;
        let s2FeesPaid = 0;
        let s2TotalPension = 0;

        for(let i = 1; i <= vals.duration; i++) {
            // Home is strictly exempt for the primary 2 years
            let isExemptHome = (i <= 2);
            let homeOwnerStatus = isExemptHome ? true : false;
            let assessableHomeValue = isExemptHome ? 0 : s2HouseValueObj;
            
            let pensionThisYear = getAgePension(s2CurrentCash, homeOwnerStatus, vals.otherAssets + assessableHomeValue, vals.otherIncome);
            s2CurrentCash += pensionThisYear;
            s2TotalPension += pensionThisYear;

            s2HouseValueObj += s2HouseValueObj * vals.houseGrowth;
            s2CurrentCash += s2CurrentCash * vals.interestRate;
            let annualFees = annualCareFeesArray[i - 1] + s2DapPerYear;
            s2CurrentCash -= annualFees;
            s2FeesPaid += annualFees;
            yoyS2.push({ netWealth: s2CurrentCash + s2HouseValueObj, cash: s2CurrentCash });
        }

        let s2NetWealth = s2CurrentCash + s2HouseValueObj;
        
        outputs.s2Fees.textContent = formatCurrency(s2FeesPaid);
        outputs.s2FeesBasic.textContent = formatCurrency(totalBasicFees);
        outputs.s2FeesWcf.textContent = formatCurrency(totalWcfFeesPaid);
        outputs.s2FeesNccc.textContent = formatCurrency(totalNcccFeesPaid);
        outputs.s2FeesHsc.textContent = formatCurrency(totalHscFeesPaid);
        outputs.s2FeesDap.textContent = formatCurrency(s2DapPerYear * vals.duration);

        outputs.s2Cash.textContent = formatCurrency(s2CurrentCash);
        outputs.s2Cash.className = 'value' + (s2CurrentCash < 0 ? ' negative-cash-text' : '');
        outputs.s2Pension.textContent = formatCurrency(s2TotalPension);
        outputs.s2House.textContent = formatCurrency(s2HouseValueObj);
        outputs.s2Net.textContent = formatCurrency(s2NetWealth);

        // --- Scenario 3: Keep House (Rented), Pay DAP ---
        let s3DapPerYear = vals.rad * vals.mpir;
        let s3CurrentCash = vals.savings;
        let s3HouseValueObj = vals.houseValue;
        let s3FeesPaid = 0;
        let currentRentPerYear = vals.houseRent * 52; 
        let s3TotalRentCollected = 0;
        let s3TotalPension = 0;

        for(let i = 1; i <= vals.duration; i++) {
            // Rental property is exempt from asset test for 2 years, but rent impacts the income test bounds natively.
            let isExemptHome = (i <= 2);
            let homeOwnerStatus = isExemptHome ? true : false;
            let assessableHomeValue = isExemptHome ? 0 : s3HouseValueObj;
            let fnRent = currentRentPerYear / 26;
            
            let pensionThisYear = getAgePension(s3CurrentCash, homeOwnerStatus, vals.otherAssets + assessableHomeValue, vals.otherIncome + fnRent);
            s3CurrentCash += pensionThisYear;
            s3TotalPension += pensionThisYear;

            s3HouseValueObj += s3HouseValueObj * vals.houseGrowth;
            s3CurrentCash += s3CurrentCash * vals.interestRate;
            s3CurrentCash += currentRentPerYear; 
            s3TotalRentCollected += currentRentPerYear;
            
            let annualFees = annualCareFeesArray[i - 1] + s3DapPerYear;
            s3CurrentCash -= annualFees;
            s3FeesPaid += annualFees;
            
            yoyS3.push({ netWealth: s3CurrentCash + s3HouseValueObj, cash: s3CurrentCash, rentIncome: currentRentPerYear });
            
            currentRentPerYear += currentRentPerYear * vals.houseGrowth;
        }

        let s3NetWealth = s3CurrentCash + s3HouseValueObj;

        outputs.s3Fees.textContent = formatCurrency(s3FeesPaid);
        outputs.s3FeesBasic.textContent = formatCurrency(totalBasicFees);
        outputs.s3FeesWcf.textContent = formatCurrency(totalWcfFeesPaid);
        outputs.s3FeesNccc.textContent = formatCurrency(totalNcccFeesPaid);
        outputs.s3FeesHsc.textContent = formatCurrency(totalHscFeesPaid);
        outputs.s3FeesDap.textContent = formatCurrency(s3DapPerYear * vals.duration);

        if (outputs.s3RentAdded) {
            outputs.s3RentAdded.textContent = formatCurrency(s3TotalRentCollected);
        }
        outputs.s3Cash.textContent = formatCurrency(s3CurrentCash);
        outputs.s3Cash.className = 'value' + (s3CurrentCash < 0 ? ' negative-cash-text' : '');
        outputs.s3Pension.textContent = formatCurrency(s3TotalPension);
        outputs.s3House.textContent = formatCurrency(s3HouseValueObj);
        outputs.s3Net.textContent = formatCurrency(s3NetWealth);

        const s3ThSummary = document.getElementById('s3-th-summary');
        const s3ThDetail = document.getElementById('s3-th-detail');
        if (s3ThSummary) s3ThSummary.innerHTML = `Scenario 3 (Rent)`;
        if (s3ThDetail) s3ThDetail.innerHTML = `Scenario 3 (Rent)`;

        // --- Render YoY Tables ---
        if (outputs.yoyTbodySummary && outputs.yoyTbodyDetail) {
            outputs.yoyTbodySummary.innerHTML = '';
            outputs.yoyTbodyDetail.innerHTML = '';
            
            // Year 0 (Now)
            const initialNetWealth = vals.savings + vals.houseValue;
            let s1InitialCash = vals.savings + vals.houseValue - Math.min(vals.savings + vals.houseValue, vals.rad);
            let s2InitialCash = vals.savings;
            let s3InitialCash = vals.savings;

            let s1zClass = s1InitialCash < 0 ? 'negative-cash' : '';
            let s2zClass = s2InitialCash < 0 ? 'negative-cash' : '';
            let s3zClass = s3InitialCash < 0 ? 'negative-cash' : '';

            // Summary Strings (Net Wealth Only)
            let s1zSum = formatCurrency(initialNetWealth) + (s1InitialCash < 0 ? ' <br><span class="out-of-cash-badge">Out of Cash</span>' : '');
            let s2zSum = formatCurrency(initialNetWealth) + (s2InitialCash < 0 ? ' <br><span class="out-of-cash-badge">Out of Cash</span>' : '');
            let s3zSum = formatCurrency(initialNetWealth) + (s3InitialCash < 0 ? ' <br><span class="out-of-cash-badge">Out of Cash</span>' : '');

            // Detail Strings (Net Wealth + Breakdown)
            let s1zDet = `<div style="margin-bottom: 4px;"><strong>${formatCurrency(initialNetWealth)}</strong></div>` +
                         `<div style="font-size: 0.85em; color: var(--color-text-muted); line-height: 1.4;">Cash: ${formatCurrency(s1InitialCash)}<br>RAD: ${formatCurrency(Math.min(vals.savings + vals.houseValue, vals.rad))}</div>` + 
                         (s1InitialCash < 0 ? '<span class="out-of-cash-badge" style="margin-top: 4px;">Out of Cash</span>' : '');
            
            let s2zDet = `<div style="margin-bottom: 4px;"><strong>${formatCurrency(initialNetWealth)}</strong></div>` +
                         `<div style="font-size: 0.85em; color: var(--color-text-muted); line-height: 1.4;">Cash: ${formatCurrency(s2InitialCash)}<br>House: ${formatCurrency(vals.houseValue)}</div>` + 
                         (s2InitialCash < 0 ? '<span class="out-of-cash-badge" style="margin-top: 4px;">Out of Cash</span>' : '');
            
            let s3zDet = `<div style="margin-bottom: 4px;"><strong>${formatCurrency(initialNetWealth)}</strong></div>` +
                         `<div style="font-size: 0.85em; color: var(--color-text-muted); line-height: 1.4;">Cash: ${formatCurrency(s3InitialCash)}<br>House: ${formatCurrency(vals.houseValue)}</div>` + 
                         (s3InitialCash < 0 ? '<span class="out-of-cash-badge" style="margin-top: 4px;">Out of Cash</span>' : '');

            // Append Year 0
            const tr0Sum = document.createElement('tr');
            tr0Sum.innerHTML = `<td>Now (Year 0)</td><td class="${s1zClass}">${s1zSum}</td><td class="${s2zClass}">${s2zSum}</td><td class="${s3zClass}">${s3zSum}</td><td style="color: var(--color-text-muted);">-</td>`;
            outputs.yoyTbodySummary.appendChild(tr0Sum);

            const tr0Det = document.createElement('tr');
            tr0Det.innerHTML = `<td>Now (Year 0)</td><td class="${s1zClass}">${s1zDet}</td><td class="${s2zClass}">${s2zDet}</td><td class="${s3zClass}">${s3zDet}</td><td style="color: var(--color-text-muted);">-</td>`;
            outputs.yoyTbodyDetail.appendChild(tr0Det);

            // Output Dynamic Matrix
            for(let i = 0; i < vals.duration; i++) {
                let s1c = yoyS1[i].cash < 0 ? 'negative-cash' : '';
                let s2c = yoyS2[i].cash < 0 ? 'negative-cash' : '';
                let s3c = yoyS3[i].cash < 0 ? 'negative-cash' : '';

                // Summary HTML
                let s1Sum = formatCurrency(yoyS1[i].netWealth) + (yoyS1[i].cash < 0 ? ' <br><span class="out-of-cash-badge">Out of Cash</span>' : '');
                let s2Sum = formatCurrency(yoyS2[i].netWealth) + (yoyS2[i].cash < 0 ? ' <br><span class="out-of-cash-badge">Out of Cash</span>' : '');
                let s3Sum = formatCurrency(yoyS3[i].netWealth) + (yoyS3[i].cash < 0 ? ' <br><span class="out-of-cash-badge">Out of Cash</span>' : '');

                // Detail HTML
                let s1Det = `<div style="margin-bottom: 4px;"><strong>${formatCurrency(yoyS1[i].netWealth)}</strong></div>` +
                            `<div style="font-size: 0.85em; color: var(--color-text-muted); line-height: 1.4;">Cash: ${formatCurrency(yoyS1[i].cash)}<br>RAD: ${formatCurrency(yoyS1[i].radRefund)}</div>` +
                            (yoyS1[i].cash < 0 ? '<span class="out-of-cash-badge" style="margin-top: 4px;">Out of Cash</span>' : '');
                
                let s2Det = `<div style="margin-bottom: 4px;"><strong>${formatCurrency(yoyS2[i].netWealth)}</strong></div>` +
                            `<div style="font-size: 0.85em; color: var(--color-text-muted); line-height: 1.4;">Cash: ${formatCurrency(yoyS2[i].cash)}<br>House: ${formatCurrency(yoyS2[i].netWealth - yoyS2[i].cash)}</div>` +
                            (yoyS2[i].cash < 0 ? '<span class="out-of-cash-badge" style="margin-top: 4px;">Out of Cash</span>' : '');
                
                let s3Det = `<div style="margin-bottom: 4px;"><strong>${formatCurrency(yoyS3[i].netWealth)}</strong></div>` +
                            `<div style="font-size: 0.85em; color: var(--color-text-muted); line-height: 1.4;">Cash: ${formatCurrency(yoyS3[i].cash)}<br>House: ${formatCurrency(yoyS3[i].netWealth - yoyS3[i].cash)}</div>` +
                            (yoyS3[i].cash < 0 ? '<span class="out-of-cash-badge" style="margin-top: 4px;">Out of Cash</span>' : '');

                const trSum = document.createElement('tr');
                trSum.innerHTML = `<td>Year ${i + 1}</td><td class="${s1c}">${s1Sum}</td><td class="${s2c}">${s2Sum}</td><td class="${s3c}">${s3Sum}</td><td style="color: var(--color-secondary); opacity: 0.9;">+${formatCurrency(yoyS3[i].rentIncome)}</td>`;
                outputs.yoyTbodySummary.appendChild(trSum);

                const trDet = document.createElement('tr');
                trDet.innerHTML = `<td>Year ${i + 1}</td><td class="${s1c}">${s1Det}</td><td class="${s2c}">${s2Det}</td><td class="${s3c}">${s3Det}</td><td style="color: var(--color-secondary); opacity: 0.9;">+${formatCurrency(yoyS3[i].rentIncome)}</td>`;
                outputs.yoyTbodyDetail.appendChild(trDet);
            }
        }

        // --- Render Chart ---
        const ctx = document.getElementById('wealthChart');
        if (ctx && typeof Chart !== 'undefined') {
            const initialNetWealth = vals.savings + vals.houseValue;
            const labels = ['Year 0'];
            for(let i = 1; i <= vals.duration; i++) labels.push('Year ' + i);

            const dataS1 = [initialNetWealth, ...yoyS1.map(y => y.netWealth)];
            const dataS2 = [initialNetWealth, ...yoyS2.map(y => y.netWealth)];
            const dataS3 = [initialNetWealth, ...yoyS3.map(y => y.netWealth)];

            if (window.wealthChartInstance) {
                window.wealthChartInstance.data.labels = labels;
                window.wealthChartInstance.data.datasets[0].data = dataS1;
                window.wealthChartInstance.data.datasets[1].data = dataS2;
                window.wealthChartInstance.data.datasets[2].data = dataS3;
                window.wealthChartInstance.data.datasets[2].label = 'Scenario 3 (Rent)';
                window.wealthChartInstance.update();
            } else {
                window.wealthChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Scenario 1 (Sell)',
                                data: dataS1,
                                borderColor: '#3b82f6',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                tension: 0.3,
                                fill: true,
                                pointRadius: 4,
                                pointHoverRadius: 6
                            },
                            {
                                label: 'Scenario 2 (Keep)',
                                data: dataS2,
                                borderColor: '#8b5cf6',
                                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                tension: 0.3,
                                fill: true,
                                pointRadius: 4,
                                pointHoverRadius: 6
                            },
                            {
                                label: 'Scenario 3 (Rent)',
                                data: dataS3,
                                borderColor: '#10b981',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                tension: 0.3,
                                fill: true,
                                pointRadius: 4,
                                pointHoverRadius: 6
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            mode: 'index',
                            intersect: false,
                        },
                        plugins: {
                            legend: {
                                labels: { color: '#f8fafc', font: { family: "'Outfit', sans-serif" } }
                            },
                            tooltip: {
                                titleFont: { family: "'Outfit', sans-serif", size: 14 },
                                bodyFont: { family: "'Outfit', sans-serif", size: 13 },
                                callbacks: {
                                    label: function(context) {
                                        let label = context.dataset.label || '';
                                        if (label) { label += ': '; }
                                        if (context.parsed.y !== null) {
                                            label += new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(context.parsed.y);
                                        }
                                        return label;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                ticks: {
                                    color: '#94a3b8',
                                    font: { family: "'Outfit', sans-serif" },
                                    callback: function(value) {
                                        return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', notation: 'compact' }).format(value);
                                    }
                                },
                                grid: { color: 'rgba(255, 255, 255, 0.05)' }
                            },
                            x: {
                                ticks: { color: '#94a3b8', font: { family: "'Outfit', sans-serif" } },
                                grid: { color: 'rgba(255, 255, 255, 0.05)' }
                            }
                        }
                    }
                });
            }
        }
    }

    // Preset Option Listener
    const radPreset = document.getElementById('radPreset');
    if (radPreset && inputs.rad) {
        radPreset.addEventListener('change', (e) => {
            if (e.target.value) {
                inputs.rad.value = formatNumberInput(e.target.value);
                calculate();
            }
        });

        inputs.rad.addEventListener('input', () => {
            radPreset.value = "";
        });
    }

    // Attach listeners
    Object.values(inputs).forEach(input => {
        if (input) {
            input.value = formatNumberInput(input.value);
            input.addEventListener('input', calculate);
            input.addEventListener('blur', (e) => {
                e.target.value = formatNumberInput(e.target.value);
                calculate();
            });
        }
    });

    // Initial calculation
    calculate();
});
