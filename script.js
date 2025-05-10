document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.sidebar ul li');
    const contentSections = document.querySelectorAll('.content-section');
    let activeChart = null; // To keep track of the current chart instance or instances

    // --- Navigation Logic ---
    function handleLinkActivation(linkElement) {
        if (!linkElement) return; // Guard clause

        const sectionId = linkElement.getAttribute('data-section');

        navLinks.forEach(nav => {
            nav.classList.remove('active-nav');
            nav.removeAttribute('aria-current'); // ARIA accessibility
        });
        linkElement.classList.add('active-nav');
        linkElement.setAttribute('aria-current', 'page'); // ARIA accessibility

        contentSections.forEach(section => {
            if (section.id === sectionId) {
                section.classList.add('active');
                loadSectionContent(sectionId); 
            } else {
                section.classList.remove('active');
            }
        });
    }

    navLinks.forEach(link => {
        link.setAttribute('role', 'menuitem'); // ARIA accessibility
        link.setAttribute('tabindex', '0'); // Make LIs focusable

        link.addEventListener('click', (event) => {
            handleLinkActivation(event.currentTarget);
        });

        link.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') { 
                event.preventDefault(); 
                handleLinkActivation(event.currentTarget);
            }
        });
    });
    
    const sidebarNav = document.querySelector('.sidebar ul#nav-links'); 
    if (sidebarNav) {
        sidebarNav.setAttribute('role', 'menubar'); 
        sidebarNav.setAttribute('aria-orientation', 'vertical');
    }

    const initialSectionLink = document.querySelector('.sidebar ul li[data-section="intro"]');
    if (initialSectionLink) {
        handleLinkActivation(initialSectionLink); 
    }
    // --- End Navigation Logic ---


    function loadSectionContent(sectionId) {
    // Destroy previous chart(s) if exists to prevent memory leaks and redraw issues
    if (activeChart) {
        if (typeof activeChart.destroy === 'function') {
            activeChart.destroy();
        } else if (Array.isArray(activeChart)) { // Handle multiple charts (e.g. Eta-squared)
            activeChart.forEach(chart => { if (chart && typeof chart.destroy === 'function') chart.destroy(); });
        }
        activeChart = null;
    }

    const sectionElement = document.getElementById(sectionId);
    // Content for 'intro' and 'general-misconceptions' is mostly static in HTML.
    // For 'sig-vs-effect', the HTML is in index.html, but needs JS setup.
    // For others, content is fully injected by JS.

    switch (sectionId) {
        case 'intro':
            // Static content in HTML, no dynamic JS needed here other than display
            break;
        case 'sig-vs-effect':
            // HTML is in index.html, JS setup needed
            // Use setTimeout to ensure DOM is fully rendered
            setTimeout(() => {
                setupSigVsEffectDemo();
            }, 0);
            break;
        case 'cohens-d':
            setupCohensDDemo(sectionElement);
            break;
        case 'hedges-g':
            setupHedgesGDemo(sectionElement);
            break;
        case 'pearsons-r':
            setupPearsonsRDemo(sectionElement);
            break;
        case 'eta-squared':
            setupEtaSquaredDemo(sectionElement);
            break;
        case 'odds-ratio':
            setupOddsRatioDemo(sectionElement);
            break;
        case 'relative-risk':
            setupRelativeRiskDemo(sectionElement);
            break;
        case 'nnt-nnh':
            setupNNTNNHDemo(sectionElement);
            break;
        case 'smd':
            setupSMDDemo(sectionElement);
            break;
        case 'cramers-v':
            setupCramersVDemo(sectionElement);
            break;
        case 'r-squared':
            setupRSquaredDemo(sectionElement);
            break;
        case 'general-misconceptions':
            // Static content in HTML
            break;
    }
}

    // --- Helper for normal distribution PDF ---
    function normalPDF(x, mu, sigma) {
        return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
    }

    // --- Helper to generate data for chart ---
    function generateNormalDistributionData(mu, sigma, numPoints, minX, maxX) {
        const data = [];
        const step = (maxX - minX) / numPoints;
        for (let i = 0; i <= numPoints; i++) {
            const x = minX + i * step;
            data.push({ x: x, y: normalPDF(x, mu, sigma) });
        }
        return data;
    }
    
    // --- Standard Normal CDF (Approximation -  Hart algorithm) ---
    function standardNormalCDF(z) {
        const t = 1 / (1 + 0.2316419 * Math.abs(z));
        const d = 0.3989423 * Math.exp(-z * z / 2);
        let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
        if (z > 0) prob = 1 - prob;
        return prob;
    }

    // --- START: Pearson's R / R-Squared Helper Functions ---
    function generateCorrelatedDataPR(n, targetR) {
        const mean = [0, 0];
        const covMatrix = [
            [1, targetR],
            [targetR, 1]
        ];
    
        const L = [
            [1, 0],
            [targetR, Math.sqrt(1 - targetR * targetR)]
        ];
    
        const points = [];
        for (let i = 0; i < n; i++) {
            let u1 = 0, u2 = 0;
            for(let j=0; j<6; j++) { u1 += Math.random(); u2 += Math.random(); }
            const z1 = u1 - 3; 
            const z2 = u2 - 3;
    
            const x = mean[0] + L[0][0] * z1 + L[0][1] * z2;
            const y = mean[1] + L[1][0] * z1 + L[1][1] * z2;
            points.push({ x: x*5+5, y: y*5+5 });
        }
        return points;
    }
    
    function calculatePearsonsR(points) {
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
        const n = points.length;
        if (n < 2) return 0;

        points.forEach(p => {
            sumX += p.x;
            sumY += p.y;
            sumXY += p.x * p.y;
            sumX2 += p.x * p.x;
            sumY2 += p.y * p.y;
        });

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        if (denominator === 0) return 0;
        return numerator / denominator;
    } // <<<< CRITICAL FIX: ADDED THIS MISSING CLOSING BRACE
    // --- END: Pearson's R / R-Squared Helper Functions ---


    // --- START: Significance vs. Effect Size Demo ---
    function setupSigVsEffectDemo() {
    // Elements are already in HTML for this section
    const canvasElement = document.getElementById('sigVsEffectChart'); 
    if (!canvasElement) {
        console.error("ERROR: Canvas element with ID 'sigVsEffectChart' not found in the DOM for sig-vs-effect demo!");
        return; 
    }

    const sampleSizeSlider = document.getElementById('svs-sample-size');
    const meanDiffSlider = document.getElementById('svs-mean-diff');
    const stdDevSlider = document.getElementById('svs-std-dev');
    const sampleSizeVal = document.getElementById('svs-sample-size-val');
    const meanDiffVal = document.getElementById('svs-mean-diff-val');
    const stdDevVal = document.getElementById('svs-std-dev-val');
    const cohensDOutput = document.getElementById('svs-cohens-d');
    const pValueOutput = document.getElementById('svs-p-value');
    
    // Check if all required elements exist
    if (!sampleSizeSlider || !meanDiffSlider || !stdDevSlider || 
        !sampleSizeVal || !meanDiffVal || !stdDevVal || 
        !cohensDOutput || !pValueOutput) {
        console.error("Required elements not found for sig-vs-effect demo!");
        return;
    }

    try {
        const ctx = canvasElement.getContext('2d'); 
        if (!ctx) {
            console.error("Failed to get canvas context for sig-vs-effect demo!");
            return;
        }
        let currentChart; 

        function updateDemo() {
            const n = parseInt(sampleSizeSlider.value);
            const meanDiff = parseFloat(meanDiffSlider.value);
            const sd = parseFloat(stdDevSlider.value);

            sampleSizeVal.textContent = n;
            meanDiffVal.textContent = meanDiff.toFixed(2);
            stdDevVal.textContent = sd.toFixed(2);

            const d = sd > 0 ? meanDiff / sd : 0; // Avoid division by zero if sd is 0
            cohensDOutput.textContent = d.toFixed(2);

            let p_text = "N/A";
            if (sd > 0 && n >= 5) { // Added check for sd > 0
                const se = sd * Math.sqrt(2 / n); 
                const t = meanDiff / se;
                let p = 2 * (1 - standardNormalCDF(Math.abs(t))); 
                p_text = p < 0.001 ? "< 0.001" : p.toFixed(3);
            } else if (n < 5) {
                p_text = "N too small";
            } else if (sd <= 0) {
                p_text = "SD invalid";
            }
            
            pValueOutput.textContent = p_text;
            
            const data1 = sd > 0 ? generateNormalDistributionData(0, sd, 100, -3.5*sd, 3.5*sd) : [];
            const data2 = sd > 0 ? generateNormalDistributionData(meanDiff, sd, 100, meanDiff - 3.5*sd, meanDiff + 3.5*sd) : [];
            
            if (currentChart) currentChart.destroy();
            currentChart = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [
                        { label: 'Group 1 (Control)', data: data1, borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.2)', fill: true, tension: 0.1, pointRadius: 0 },
                        { label: 'Group 2 (Treatment)', data: data2, borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.2)', fill: true, tension: 0.1, pointRadius: 0 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: { x: { type: 'linear', position: 'bottom', title: { display: true, text: 'Value' } }, y: { title: { display: true, text: 'Density' }, beginAtZero: true } },
                    plugins: { title: { display: true, text: 'Distribution Overlap & p-value' }, tooltip: { enabled: false } }
                }
            });
            activeChart = currentChart; 
        }

        [sampleSizeSlider, meanDiffSlider, stdDevSlider].forEach(slider => {
            slider.removeEventListener('input', updateDemo); 
            slider.addEventListener('input', updateDemo);
        });
        updateDemo(); 
    } catch (error) {
        console.error("Error in sig-vs-effect demo:", error);
    }
}

    // --- END: Significance vs. Effect Size Demo ---

    // --- START: Cohen's d Demo ---
    function setupCohensDDemo(sectionElement) {
        sectionElement.innerHTML = `
            <h2>Cohen's d</h2>
            <p>Measures the difference between two means in terms of standard deviations.
               Formula: <code>d = (M2 - M1) / SD_pooled</code> (or sometimes just SD of control group or average SD).
            </p>
            <div class="interactive-demo">
                <label for="cd-mean1">Mean 1 (M1): <span id="cd-mean1-val">50</span></label>
                <input type="range" id="cd-mean1" min="0" max="100" value="50" step="1">
                <label for="cd-mean2">Mean 2 (M2): <span id="cd-mean2-val">55</span></label>
                <input type="range" id="cd-mean2" min="0" max="100" value="55" step="1">
                <label for="cd-sd">Standard Deviation (pooled, SD): <span id="cd-sd-val">10</span></label>
                <input type="range" id="cd-sd" min="1" max="30" value="10" step="0.5">
                <p>Calculated Cohen's d: <strong id="cd-value">0.50</strong></p>
                <div class="chart-container" style="height:300px;"><canvas id="cohensDChart"></canvas></div>
                <p class="interpretation-note">Common benchmarks: 0.2 (small), 0.5 (medium), 0.8 (large). <strong>BUT</strong> context matters immensely! These are just guidelines.</p>
            </div>
            <div class="misconception-box">
                <strong>Misconception:</strong> "A Cohen's d of 0.5 means a 50% improvement or that 50% of one group is above the other."
                <br><strong>Clarification:</strong> It means the means are half a standard deviation apart. The percentage of non-overlap (U3 or CLES) associated with d=0.5 is approximately 69% (i.e., 69% of the 'treatment' group will be above the mean of the 'control' group, assuming normal distributions and M2 > M1).
            </div>
            <div class="example-box">
                <strong>Real-World Misinterpretation Example: Education Software</strong>
                <p>A new educational software shows a Cohen's d of 0.2 on test scores compared to traditional teaching. The company markets this as a "proven effective" solution.
                <br><strong>Problem:</strong> While 0.2 might be statistically significant with a large sample, it's a small effect. In education, this might mean an average improvement of just 1-2 questions on a 50-question test if the SD is around 5-10 points. Is this small gain worth the cost and effort of implementing the new software? Decision-makers might overestimate the practical impact if they only hear "statistically significant" or see "positive effect" without understanding the magnitude (0.2).</p>
            </div>
        `;

        const m1Slider = document.getElementById('cd-mean1');
        const m2Slider = document.getElementById('cd-mean2');
        const sdSlider = document.getElementById('cd-sd');
        const m1Val = document.getElementById('cd-mean1-val');
        const m2Val = document.getElementById('cd-mean2-val');
        const sdVal = document.getElementById('cd-sd-val');
        const cdValue = document.getElementById('cd-value');
        const ctx = document.getElementById('cohensDChart').getContext('2d');
        let currentChart;

        function updateCohensD() {
            const mean1 = parseFloat(m1Slider.value);
            const mean2 = parseFloat(m2Slider.value);
            const sd = parseFloat(sdSlider.value);

            m1Val.textContent = mean1;
            m2Val.textContent = mean2;
            sdVal.textContent = sd;

            const d = sd > 0 ? (mean2 - mean1) / sd : 0;
            cdValue.textContent = d.toFixed(2);

            const data1 = sd > 0 ? generateNormalDistributionData(mean1, sd, 100, Math.min(mean1, mean2) - 3.5 * sd, Math.max(mean1, mean2) + 3.5 * sd) : [];
            const data2 = sd > 0 ? generateNormalDistributionData(mean2, sd, 100, Math.min(mean1, mean2) - 3.5 * sd, Math.max(mean1, mean2) + 3.5 * sd) : [];
            
            if (currentChart) currentChart.destroy();
            currentChart = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [
                        { label: 'Group 1', data: data1, borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.2)', fill: true, tension: 0.1, pointRadius: 0 },
                        { label: 'Group 2', data: data2, borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.2)', fill: true, tension: 0.1, pointRadius: 0 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: { x: { type: 'linear', position: 'bottom', title: {display: true, text: "Score"} }, y: { title: {display: true, text: "Density"}, beginAtZero: true } },
                    plugins: { title: { display: true, text: 'Group Distributions & Overlap' }, tooltip: {enabled: false} }
                }
            });
            activeChart = currentChart;
        }
        [m1Slider, m2Slider, sdSlider].forEach(s => {
            s.removeEventListener('input', updateCohensD);
            s.addEventListener('input', updateCohensD);
        });
        updateCohensD();
    }
    // --- END: Cohen's d Demo ---

    // --- START: Hedges' g Demo ---
    function setupHedgesGDemo(sectionElement) {
        sectionElement.innerHTML = `
            <h2>Hedges' g</h2>
            <p>Similar to Cohen's d, but includes a correction factor for small sample sizes, making it less biased.
               Formula: <code>g = d * J</code>, where <code>J</code> is the correction factor: <code>J ≈ 1 - (3 / (4 * df - 1))</code> and <code>df = n1 + n2 - 2</code>.
            </p>
            <div class="interactive-demo">
                <label for="hg-mean1">Mean 1 (M1): <span id="hg-mean1-val">50</span></label>
                <input type="range" id="hg-mean1" min="0" max="100" value="50" step="1">
                <label for="hg-mean2">Mean 2 (M2): <span id="hg-mean2-val">55</span></label>
                <input type="range" id="hg-mean2" min="0" max="100" value="55" step="1">
                <label for="hg-sd">Std Dev (pooled, SD): <span id="hg-sd-val">10</span></label>
                <input type="range" id="hg-sd" min="1" max="30" value="10" step="0.5">
                <label for="hg-n1">Sample Size N1: <span id="hg-n1-val">15</span></label>
                <input type="range" id="hg-n1" min="2" max="100" value="15" step="1"> 
                <label for="hg-n2">Sample Size N2: <span id="hg-n2-val">15</span></label>
                <input type="range" id="hg-n2" min="2" max="100" value="15" step="1">

                <p>Uncorrected Cohen's d: <strong id="hg-cohens-d">0.50</strong></p>
                <p>Calculated Hedges' g: <strong id="hg-value">0.4X</strong></p>
                <div class="chart-container" style="height:300px;"><canvas id="hedgesGChart"></canvas></div>
                <p class="interpretation-note">Particularly useful when sample sizes are small (e.g., <20 per group) or uneven. As sample sizes increase, 'g' approaches 'd'.</p>
            </div>
            <div class="misconception-box">
                <strong>Misconception:</strong> "Cohen's d is always fine, no need for Hedges' g."
                <br><strong>Clarification:</strong> Cohen's d can slightly overestimate the effect size in small samples. Hedges' g provides a more conservative (unbiased) estimate in these situations. For larger samples (e.g., N > 20 per group), the difference is often negligible.
            </div>
            <div class="example-box">
                <strong>Real-World Example: Pilot Study for a New Drug</strong>
                <p>A pilot study with 8 patients in the treatment group (N1=8) and 7 in placebo (N2=7) finds a Cohen's d of 0.7 for symptom reduction.
                <br><strong>Problem:</strong> With such small samples, this 'd' might be an overestimate. Calculating Hedges' g (df = 8+7-2 = 13; J ≈ 1 - (3 / (4*13 - 1)) ≈ 1 - (3/51) ≈ 0.941) would yield g ≈ 0.7 * 0.941 ≈ 0.66. This smaller, more realistic effect size is crucial for planning larger, more expensive trials, as overestimating the effect can lead to underpowered follow-up studies.</p>
            </div>
        `;
        
        const m1Slider_hg = document.getElementById('hg-mean1');
        const m2Slider_hg = document.getElementById('hg-mean2');
        const sdSlider_hg = document.getElementById('hg-sd');
        const n1Slider_hg = document.getElementById('hg-n1');
        const n2Slider_hg = document.getElementById('hg-n2');

        const m1Val_hg = document.getElementById('hg-mean1-val');
        const m2Val_hg = document.getElementById('hg-mean2-val');
        const sdVal_hg = document.getElementById('hg-sd-val');
        const n1Val_hg = document.getElementById('hg-n1-val');
        const n2Val_hg = document.getElementById('hg-n2-val');

        const hgCohensD_out = document.getElementById('hg-cohens-d');
        const hgValue_out = document.getElementById('hg-value');
        const ctx_hg = document.getElementById('hedgesGChart').getContext('2d');
        let currentChart_hg;

        function updateHedgesG() {
            const mean1 = parseFloat(m1Slider_hg.value);
            const mean2 = parseFloat(m2Slider_hg.value);
            const sd = parseFloat(sdSlider_hg.value);
            const n1 = parseInt(n1Slider_hg.value);
            const n2 = parseInt(n2Slider_hg.value);

            m1Val_hg.textContent = mean1;
            m2Val_hg.textContent = mean2;
            sdVal_hg.textContent = sd;
            n1Val_hg.textContent = n1;
            n2Val_hg.textContent = n2;

            const d = sd > 0 ? (mean2 - mean1) / sd : 0;
            hgCohensD_out.textContent = d.toFixed(2);

            let g_text = "N/A";
            if (sd > 0) {
                const df = n1 + n2 - 2;
                if (df > 0) { 
                    const J_denominator = 4 * df - 1;
                    if (J_denominator !== 0) { // Avoid division by zero for J factor
                        const J = 1 - (3 / J_denominator);
                        const g = d * J;
                        g_text = g.toFixed(2);
                    } else {
                        g_text = "N/A (df issue)";
                    }
                }
            }
            hgValue_out.textContent = g_text;

            const data1_hg = sd > 0 ? generateNormalDistributionData(mean1, sd, 100, Math.min(mean1, mean2) - 3.5 * sd, Math.max(mean1, mean2) + 3.5 * sd) : [];
            const data2_hg = sd > 0 ? generateNormalDistributionData(mean2, sd, 100, Math.min(mean1, mean2) - 3.5 * sd, Math.max(mean1, mean2) + 3.5 * sd) : [];
            
            if (currentChart_hg) currentChart_hg.destroy();
            currentChart_hg = new Chart(ctx_hg, {
                type: 'line',
                data: {
                    datasets: [
                        { label: 'Group 1', data: data1_hg, borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.2)', fill: true, tension: 0.1, pointRadius: 0 },
                        { label: 'Group 2', data: data2_hg, borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.2)', fill: true, tension: 0.1, pointRadius: 0 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: { x: { type: 'linear', position: 'bottom', title: {display: true, text: "Score"} }, y: { title: {display: true, text: "Density"}, beginAtZero: true } },
                    plugins: { title: { display: true, text: 'Group Distributions (Hedges g)' }, tooltip: {enabled: false} }
                }
            });
            activeChart = currentChart_hg;
        }
        [m1Slider_hg, m2Slider_hg, sdSlider_hg, n1Slider_hg, n2Slider_hg].forEach(s => {
            s.removeEventListener('input', updateHedgesG);
            s.addEventListener('input', updateHedgesG);
        });
        updateHedgesG();
    }
    // --- END: Hedges' g Demo ---

    // --- START: Pearson's r Demo ---
    function setupPearsonsRDemo(sectionElement) {
        sectionElement.innerHTML = `
            <h2>Pearson's r (Correlation Coefficient)</h2>
            <p>Measures the strength and direction of a linear relationship between two continuous variables.
               Values range from -1 (perfect negative linear correlation) to +1 (perfect positive linear correlation), with 0 indicating no linear correlation.
            </p>
            <div class="interactive-demo">
                <label for="pr-correlation-strength">Select Correlation Preset:</label>
                <select id="pr-correlation-strength">
                    <option value="0.0">None (r ≈ 0.0)</option>
                    <option value="0.3">Weak Positive (r ≈ 0.3)</option>
                    <option value="0.7" selected>Moderate Positive (r ≈ 0.7)</option>
                    <option value="0.9">Strong Positive (r ≈ 0.9)</option>
                    <option value="-0.3">Weak Negative (r ≈ -0.3)</option>
                    <option value="-0.7">Moderate Negative (r ≈ -0.7)</option>
                    <option value="-0.9">Strong Negative (r ≈ -0.9)</option>
                </select>
                <label for="pr-num-points">Number of Data Points: <span id="pr-num-points-val">50</span></label>
                <input type="range" id="pr-num-points" min="10" max="200" value="50" step="10">

                <p>Target r: <strong id="pr-target-r">0.70</strong> | Calculated Pearson's r: <strong id="pr-value">0.XX</strong></p>
                <div class="chart-container" style="height:350px;"><canvas id="pearsonsRChart"></canvas></div>
                <p class="interpretation-note">Benchmarks (guidelines): |0.1| (small), |0.3| (medium), |0.5| (large). Context is crucial. Squaring 'r' gives R-squared (proportion of variance explained by linear relationship).</p>
            </div>
            <div class="misconception-box">
                <strong>Misconception:</strong> "Correlation implies causation."
                <br><strong>Clarification:</strong> This is the most famous one! Just because ice cream sales and crime rates are correlated doesn't mean ice cream causes crime (a third variable, hot weather, likely influences both). 'r' only measures linear association.
            </div>
            <div class="misconception-box">
                <strong>Misconception:</strong> "An r of 0.6 is twice as strong as an r of 0.3."
                <br><strong>Clarification:</strong> 'r' is not on a ratio scale. It's better to compare R-squared values (r=0.6 -> R²=0.36; r=0.3 -> R²=0.09). Here, 0.36 is four times 0.09, meaning one relationship explains four times more variance than the other.
            </div>
            <div class="example-box">
                <strong>Real-World Misinterpretation Example: Coffee and Longevity</strong>
                <p>A study finds a Pearson's r of 0.25 between daily coffee consumption and lifespan. Headlines exclaim: "Coffee Makes You Live Longer!"
                <br><strong>Problem:</strong> 1) Correlation is not causation. Coffee drinkers might have other healthy habits (e.g., more active, wealthier, better diet) that are the true causes. 2) An r of 0.25 (R² = 0.0625) is a small to medium effect, meaning coffee consumption is linearly associated with only about 6.25% of the variance in lifespan in this dataset. The headline grossly overstates both the causality and the magnitude of the relationship.</p>
            </div>
        `; 

        const strengthSelect_pr = document.getElementById('pr-correlation-strength');
        const numPointsSlider_pr = document.getElementById('pr-num-points');
        const numPointsVal_pr = document.getElementById('pr-num-points-val');
        const prTargetR_out = document.getElementById('pr-target-r');
        const prValue_out = document.getElementById('pr-value');
        const ctx_pr = document.getElementById('pearsonsRChart').getContext('2d');
        let currentChart_pr;

        function updatePearsonsR() { 
            const targetR = parseFloat(strengthSelect_pr.value);
            const n = parseInt(numPointsSlider_pr.value);
            numPointsVal_pr.textContent = n;
            prTargetR_out.textContent = targetR.toFixed(2);

            const dataPoints = generateCorrelatedDataPR(n, targetR); 
            const actualR = calculatePearsonsR(dataPoints);
            prValue_out.textContent = actualR.toFixed(2);
            
            if (currentChart_pr) currentChart_pr.destroy();
            currentChart_pr = new Chart(ctx_pr, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Data Points',
                        data: dataPoints,
                        backgroundColor: 'rgba(255, 99, 132, 0.6)',
                        pointRadius: 4
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: {
                        x: { type: 'linear', position: 'bottom', title: {display: true, text: "Variable X"} },
                        y: { title: {display: true, text: "Variable Y"} }
                    },
                    plugins: { title: { display: true, text: 'Scatter Plot of Correlated Data' } }
                }
            });
            activeChart = currentChart_pr;
        } 

        strengthSelect_pr.addEventListener('change', updatePearsonsR);
        numPointsSlider_pr.addEventListener('input', updatePearsonsR);
        updatePearsonsR(); 

    } 
    // --- END: Pearson's r Demo ---

    // --- START: Eta-squared Demo ---
    function setupEtaSquaredDemo(sectionElement) {
        sectionElement.innerHTML = `
            <h2>Eta-squared (η²) and Partial Eta-squared (η<sub>p</sub>²)</h2>
            <p>η² quantifies the proportion of total variance in a dependent variable that is associated with an independent variable (factor) in an ANOVA.
               Formula (one-way ANOVA): η² = SS<sub>between</sub> / SS<sub>total</sub>.
            </p>
            <p>Partial η² is used in multi-factor ANOVA, representing variance explained by one factor, controlling for others.
               Formula (for factor A): η<sub>p</sub>² = SS<sub>A</sub> / (SS<sub>A</sub> + SS<sub>error</sub>). This demo focuses on simple η².
            </p>
            <div class="interactive-demo">
                <h4>Simplified One-Way ANOVA Demo (3 Groups)</h4>
                <label for="eta-mean1">Group 1 Mean: <span id="eta-mean1-val">10</span></label>
                <input type="range" id="eta-mean1" min="0" max="30" value="10" step="1">
                <label for="eta-mean2">Group 2 Mean: <span id="eta-mean2-val">15</span></label>
                <input type="range" id="eta-mean2" min="0" max="30" value="15" step="1">
                <label for="eta-mean3">Group 3 Mean: <span id="eta-mean3-val">20</span></label>
                <input type="range" id="eta-mean3" min="0" max="30" value="20" step="1">
                <label for="eta-sd-within">Within-Group SD (common): <span id="eta-sd-within-val">3</span></label>
                <input type="range" id="eta-sd-within" min="1" max="10" value="3" step="0.5">
                <p>Simulated Sample Size per Group (fixed for demo): N=30</p>

                <p>Calculated Eta-squared (η²): <strong id="eta-value">0.XX</strong></p>
                <div class="chart-container dual-chart">
                    <div style="width: 48%; height:250px;"><canvas id="etaBarChart"></canvas></div>
                    <div style="width: 48%; height:250px;"><canvas id="etaPieChart"></canvas></div>
                </div>
                <p class="interpretation-note">Benchmarks: 0.01 (small), 0.06 (medium), 0.14 (large). η² represents the percentage of total variance explained by group differences.</p>
            </div>
            <div class="misconception-box">
                <strong>Misconception:</strong> "η² = 0.10 means the factor has a 10% direct impact on individual scores."
                <br><strong>Clarification:</strong> It means 10% of the *variability* in scores across all individuals in the sample is attributable to group differences. It doesn't predict individual outcomes directly or imply causality without experimental design.
            </div>
            <div class="misconception-box">
                <strong>Misconception:</strong> "Partial η² from different factors in the same multi-way ANOVA add up to the total R² of the model."
                <br><strong>Clarification:</strong> They do not typically sum up this way because they use different denominators (each partial η² considers only the variance from that factor and error, not other factors). Total model R² accounts for all predictors simultaneously.
            </div>
            <div class="example-box">
                <strong>Real-World Misinterpretation Example: Teaching Methods</strong>
                <p>A study compares three teaching methods and finds η² = 0.08 for the 'teaching method' factor on exam scores.
                <br><strong>Problem:</strong> A researcher might claim "Teaching method explains 8% of student performance." While technically true for variance in the sample, it can be misleading. If other factors (prior knowledge, motivation, socioeconomic status) account for far more variance, 8% might be practically small. Also, if the *differences between specific method means* are tiny (e.g., Method A = 75%, Method B = 76%, Method C = 77%), the practical significance is low despite the η² value. Focusing only on η² can obscure the actual differences between group means.</p>
            </div>
            <style>.dual-chart { display: flex; justify-content: space-between; align-items: center; }</style>
        `;
        
        const m1S_eta = document.getElementById('eta-mean1');
        const m2S_eta = document.getElementById('eta-mean2');
        const m3S_eta = document.getElementById('eta-mean3');
        const sdWithinS_eta = document.getElementById('eta-sd-within');
        const m1V_eta = document.getElementById('eta-mean1-val');
        const m2V_eta = document.getElementById('eta-mean2-val');
        const m3V_eta = document.getElementById('eta-mean3-val');
        const sdWithinV_eta = document.getElementById('eta-sd-within-val');
        const etaVal_out = document.getElementById('eta-value');
        const barCtx_eta = document.getElementById('etaBarChart').getContext('2d');
        const pieCtx_eta = document.getElementById('etaPieChart').getContext('2d');
        let barChartInstance_eta, pieChartInstance_eta;

        const N_PER_GROUP_ETA = 30; 

        function updateEtaSquared() {
            const m1 = parseFloat(m1S_eta.value);
            const m2 = parseFloat(m2S_eta.value);
            const m3 = parseFloat(m3S_eta.value);
            const sdWithin = parseFloat(sdWithinS_eta.value); 
            const varWithin = sdWithin * sdWithin;

            m1V_eta.textContent = m1;
            m2V_eta.textContent = m2;
            m3V_eta.textContent = m3;
            sdWithinV_eta.textContent = sdWithin;

            const means = [m1, m2, m3];
            const k = means.length; 
            
            const grandMean = means.reduce((sum, val) => sum + val, 0) / k;
            
            let ssBetween = 0;
            means.forEach(groupMean => {
                ssBetween += N_PER_GROUP_ETA * Math.pow(groupMean - grandMean, 2);
            });
            
            const ssError = (N_PER_GROUP_ETA - 1) * varWithin * k;

            const ssTotal = ssBetween + ssError;
            const etaSquared = ssTotal > 0 ? ssBetween / ssTotal : 0;
            etaVal_out.textContent = etaSquared.toFixed(3);

            if (barChartInstance_eta) barChartInstance_eta.destroy();
            barChartInstance_eta = new Chart(barCtx_eta, {
                type: 'bar',
                data: {
                    labels: ['Group 1', 'Group 2', 'Group 3'],
                    datasets: [{
                        label: 'Group Means',
                        data: [m1, m2, m3],
                        backgroundColor: ['rgba(75, 192, 192, 0.7)', 'rgba(255, 159, 64, 0.7)', 'rgba(153, 102, 255, 0.7)'],
                        borderColor: ['rgb(75, 192, 192)', 'rgb(255, 159, 64)', 'rgb(153, 102, 255)'],
                        borderWidth: 1
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, title: {display:true, text:"Mean Score"} } }, plugins: {legend: {display:false}} }
            });

            if (pieChartInstance_eta) pieChartInstance_eta.destroy();
            pieChartInstance_eta = new Chart(pieCtx_eta, {
                type: 'pie',
                data: {
                    labels: [`Factor (${(etaSquared*100).toFixed(1)}%)`, `Error (${((1-etaSquared)*100).toFixed(1)}%)`],
                    datasets: [{
                        data: [ssBetween > 0 ? ssBetween : 0.0001, ssError > 0 ? ssError : 0.0001], // Avoid 0 for pie
                        backgroundColor: ['rgba(54, 162, 235, 0.8)', 'rgba(255, 99, 132, 0.8)'],
                        borderColor: ['#FFFFFF', '#FFFFFF'],
                        borderWidth: 2
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Proportion of Variance'}}}
            });
            activeChart = [barChartInstance_eta, pieChartInstance_eta]; 
        }
        [m1S_eta, m2S_eta, m3S_eta, sdWithinS_eta].forEach(s => {
            s.removeEventListener('input', updateEtaSquared);
            s.addEventListener('input', updateEtaSquared);
        });
        updateEtaSquared();
    }
    // --- END: Eta-squared Demo ---

    // --- START: Odds Ratio Demo ---
    function setupOddsRatioDemo(sectionElement) {
        sectionElement.innerHTML = `
            <h2>Odds Ratio (OR)</h2>
            <p>Compares the odds of an event occurring in one group (e.g., exposed/treatment) to the odds of it occurring in another group (e.g., unexposed/control).
               Formula: OR = (Odds<sub>Exposed</sub>) / (Odds<sub>Unexposed</sub>) = (a/b) / (c/d) = ad / bc.
            </p>
            <table class="contingency-table">
                <thead><tr><th></th><th>Event (+)</th><th>Event (-)</th><th>Total</th></tr></thead>
                <tbody>
                    <tr><th>Exposed/Treatment</th><td><input type="number" id="or-a" value="30" min="0" class="table-input"> (a)</td><td><input type="number" id="or-b" value="70" min="0" class="table-input"> (b)</td><td id="or-row1-total">100</td></tr>
                    <tr><th>Unexposed/Control</th><td><input type="number" id="or-c" value="10" min="0" class="table-input"> (c)</td><td><input type="number" id="or-d" value="90" min="0" class="table-input"> (d)</td><td id="or-row2-total">100</td></tr>
                </tbody>
                <tfoot><tr><td>Total</td><td id="or-col1-total">40</td><td id="or-col2-total">160</td><td id="or-grand-total">200</td></tr></tfoot>
            </table>
            <div class="interactive-demo">
                <p>Odds of event in Exposed Group (a/b): <strong id="or-odds-exposed">-</strong></p>
                <p>Odds of event in Unexposed Group (c/d): <strong id="or-odds-unexposed">-</strong></p>
                <p>Calculated Odds Ratio (OR): <strong id="or-value">-</strong></p>
                <div class="chart-container" style="height:250px;"><canvas id="oddsRatioChart"></canvas></div> 
                <p class="interpretation-note">OR > 1: Higher odds in exposed. OR < 1: Lower odds in exposed. OR = 1: No difference in odds.
                <br>Example: OR=2 means the odds of the event are twice as high in the exposed group compared to the unexposed group.
                </p>
            </div>
            <div class="misconception-box">
                <strong>Misconception:</strong> "Odds Ratio (OR) is the same as Relative Risk (RR)."
                <br><strong>Clarification:</strong> They are different! OR approximates RR when the event is rare (e.g., prevalence < 10%). For common events, OR can overestimate RR significantly (if OR>1) or underestimate RR (if OR<1 and looking at risk reduction). Odds = P(event) / (1-P(event)). Risk = P(event).
            </div>
            <div class="example-box">
                <strong>Real-World Misinterpretation Example: Disease Association Study</strong>
                <p>A case-control study finds an OR of 3.0 for the association between a specific gene variant (exposure) and a common disease (event rate ~20% in controls without gene). The researchers report: "Individuals with the gene variant are three times as likely to develop the disease."
                <br><strong>Problem:</strong> This interprets the OR as an RR. Because the disease is common, an OR of 3.0 will be further from 1 than the RR. If P(event|unexposed)=0.2, odds<sub>unexposed</sub>=0.2/0.8=0.25. If OR=3, odds<sub>exposed</sub>=0.25*3=0.75. Then P(event|exposed)=0.75/(1+0.75) ≈ 0.429. The RR = P(event|exposed) / P(event|unexposed) ≈ 0.429 / 0.2 ≈ 2.14. So, the risk is about 2.14 times higher, not 3 times. The "three times as likely" statement is an exaggeration.</p>
            </div>
        `;
        
        const orA_in = document.getElementById('or-a');
        const orB_in = document.getElementById('or-b');
        const orC_in = document.getElementById('or-c');
        const orD_in = document.getElementById('or-d');
        const orR1Tot = document.getElementById('or-row1-total');
        const orR2Tot = document.getElementById('or-row2-total');
        const orC1Tot = document.getElementById('or-col1-total');
        const orC2Tot = document.getElementById('or-col2-total');
        const orGrandTot = document.getElementById('or-grand-total');

        const orOddsExposed_out = document.getElementById('or-odds-exposed');
        const orOddsUnexposed_out = document.getElementById('or-odds-unexposed');
        const orValue_out = document.getElementById('or-value');
        const ctx_or = document.getElementById('oddsRatioChart').getContext('2d');
        let currentChart_or;

        function updateOddsRatio() {
            const a = parseInt(orA_in.value) || 0;
            const b = parseInt(orB_in.value) || 0;
            const c = parseInt(orC_in.value) || 0;
            const d = parseInt(orD_in.value) || 0;

            orR1Tot.textContent = a + b;
            orR2Tot.textContent = c + d;
            orC1Tot.textContent = a + c;
            orC2Tot.textContent = b + d;
            orGrandTot.textContent = a + b + c + d;

            let oddsExp_text = "N/A (b=0)";
            let probExp = 0;
            if (b > 0) {
                oddsExp_text = (a / b).toFixed(3);
            }
            if ((a+b) > 0) probExp = a / (a+b);


            let oddsUnexp_text = "N/A (d=0)";
            let probUnexp = 0;
            if (d > 0) {
                oddsUnexp_text = (c / d).toFixed(3);
            }
             if ((c+d) > 0) probUnexp = c / (c+d);


            let calcOR_text = "N/A";
            if (b > 0 && d > 0) { // Need b and d for odds calc for both groups
                 if (c > 0) { // Need c for the standard OR formula denominator
                    calcOR_text = ((a * d) / (b * c)).toFixed(3);
                 } else if (a === 0) { // c is 0, if a is also 0, OR is undefined or 1 depending on convention
                    calcOR_text = "0/0 or 1";
                 } else { // c is 0, a > 0
                    calcOR_text = "Infinity";
                 }
            } else if (b === 0 && a > 0 && d > 0 && c === 0) { // odds_exp=inf, odds_unexp=0/d=0 -> OR = inf
                calcOR_text = "Infinity";
            } else if (d === 0 && c > 0 && b > 0 && a === 0) { // odds_unexp=inf, odds_exp=0/b=0 -> OR = 0
                calcOR_text = "0.000";
            } // Other zero cell cases can be complex, Haldane correction often used for OR with zeros.

            orOddsExposed_out.textContent = oddsExp_text;
            orOddsUnexposed_out.textContent = oddsUnexp_text;
            orValue_out.textContent = calcOR_text;

            if (currentChart_or) currentChart_or.destroy();
            currentChart_or = new Chart(ctx_or, {
                type: 'bar',
                data: {
                    labels: ['Exposed Group', 'Unexposed Group'],
                    datasets: [{
                        label: 'Probability of Event P(Event)',
                        data: [probExp, probUnexp],
                        backgroundColor: ['rgba(255, 99, 132, 0.7)', 'rgba(75, 192, 192, 0.7)'],
                        borderColor: ['rgb(255, 99, 132)', 'rgb(75, 192, 192)'],
                        borderWidth:1
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true, max: 1, title: {display:true, text:"P(Event)"} } },
                    plugins: { title: {display:true, text:"Event Probability by Group"} }
                }
            });
            activeChart = currentChart_or;
        }
        [orA_in, orB_in, orC_in, orD_in].forEach(input => {
            input.removeEventListener('input', updateOddsRatio);
            input.addEventListener('input', updateOddsRatio);
        });
        updateOddsRatio();
    }
    // --- END: Odds Ratio Demo ---

    // --- START: Relative Risk Demo ---
    function setupRelativeRiskDemo(sectionElement) {
        sectionElement.innerHTML = `
            <h2>Relative Risk (RR) or Risk Ratio</h2>
            <p>Compares the probability (risk) of an event occurring in an exposed group to the probability of it occurring in an unexposed group.
               Typically used in cohort studies or RCTs. Formula: RR = Risk<sub>Exposed</sub> / Risk<sub>Unexposed</sub> = [a / (a+b)] / [c / (c+d)].
            </p>
            <table class="contingency-table">
                <thead><tr><th></th><th>Event (+)</th><th>Event (-)</th><th>Total</th></tr></thead>
                <tbody>
                    <tr><th>Exposed</th><td><input type="number" id="rr-a" value="30" min="0" class="table-input"> (a)</td><td><input type="number" id="rr-b" value="70" min="0" class="table-input"> (b)</td><td id="rr-row1-total">100</td></tr>
                    <tr><th>Unexposed</th><td><input type="number" id="rr-c" value="10" min="0" class="table-input"> (c)</td><td><input type="number" id="rr-d" value="90" min="0" class="table-input"> (d)</td><td id="rr-row2-total">100</td></tr>
                </tbody>
                <tfoot><tr><td>Total</td><td id="rr-col1-total">40</td><td id="rr-col2-total">160</td><td id="rr-grand-total">200</td></tr></tfoot>
            </table>
            <div class="interactive-demo">
                <p>Risk in Exposed Group (a / (a+b)): <strong id="rr-risk-exposed">-</strong></p>
                <p>Risk in Unexposed Group (c / (c+d)): <strong id="rr-risk-unexposed">-</strong></p>
                <p>Calculated Relative Risk (RR): <strong id="rr-value">-</strong></p>
                <div class="chart-container" style="height:250px;"><canvas id="relativeRiskChart"></canvas></div>
                <p class="interpretation-note">RR > 1: Increased risk in exposed. RR < 1: Decreased risk in exposed. RR = 1: No difference in risk.
                <br>Example: RR=2 means the risk of the event is twice as high in the exposed group. RR=0.5 means the risk is halved.
                </p>
            </div>
            <div class="misconception-box">
                <strong>Misconception:</strong> "A large RR always means a large public health impact or a dramatic individual change."
                <br><strong>Clarification:</strong> If the baseline risk (in unexposed) is very low, even a large RR might result in a small absolute risk increase. E.g., if baseline risk of a side effect is 0.01% (1 in 10,000), an RR of 5 means the risk becomes 0.05% (5 in 10,000). This is a 400% relative increase, but a tiny absolute increase of 0.04% (4 additional cases per 10,000). Always consider Absolute Risk Reduction/Increase (ARR/ARI).
            </div>
            <div class="example-box">
                <strong>Real-World Misinterpretation Example: Side Effect Reporting</strong>
                <p>A new drug reports a side effect (e.g., mild nausea) with an RR of 5.0 compared to placebo. The baseline rate of nausea in the placebo group is 1% (0.01).
                <br><strong>Problem:</strong> Headlines scream "Drug increases nausea risk by 400%!" (or 5 times the risk). While true in relative terms (risk goes from 1% to 5%), the absolute risk increase (ARI) is 4% (from 1 in 100 people to 5 in 100 people). For a life-saving drug, this might be an acceptable trade-off. Focusing only on the large RR can be alarming without considering the absolute risk and the NNH (Number Needed to Harm). In this case, NNH = 1/ARI = 1/0.04 = 25. (For every 25 people treated, 1 extra person experiences nausea).</p>
            </div>
        `;
        const rrA_in = document.getElementById('rr-a');
        const rrB_in = document.getElementById('rr-b');
        const rrC_in = document.getElementById('rr-c');
        const rrD_in = document.getElementById('rr-d');
        const rrR1Tot = document.getElementById('rr-row1-total');
        const rrR2Tot = document.getElementById('rr-row2-total');
        const rrC1Tot = document.getElementById('rr-col1-total');
        const rrC2Tot = document.getElementById('rr-col2-total');
        const rrGrandTot = document.getElementById('rr-grand-total');

        const rrRiskExposed_out = document.getElementById('rr-risk-exposed');
        const rrRiskUnexposed_out = document.getElementById('rr-risk-unexposed');
        const rrValue_out = document.getElementById('rr-value');
        const ctx_rr = document.getElementById('relativeRiskChart').getContext('2d');
        let currentChart_rr;

        function updateRelativeRisk() {
            const a = parseInt(rrA_in.value) || 0;
            const b = parseInt(rrB_in.value) || 0;
            const c = parseInt(rrC_in.value) || 0;
            const d = parseInt(rrD_in.value) || 0;

            rrR1Tot.textContent = a + b;
            rrR2Tot.textContent = c + d;
            rrC1Tot.textContent = a + c;
            rrC2Tot.textContent = b + d;
            rrGrandTot.textContent = a + b + c + d;

            const totalExp = a + b;
            const totalUnexp = c + d;

            let riskExp = 0, riskUnexp = 0, calcRR_text = "N/A";

            if (totalExp > 0) riskExp = a / totalExp;
            if (totalUnexp > 0) riskUnexp = c / totalUnexp;
            
            rrRiskExposed_out.textContent = riskExp.toFixed(3);
            rrRiskUnexposed_out.textContent = riskUnexp.toFixed(3);

            if (totalUnexp > 0 && riskUnexp > 0) { 
                calcRR_text = (riskExp / riskUnexp).toFixed(3);
            } else if (totalUnexp > 0 && riskUnexp === 0 && riskExp > 0) { 
                calcRR_text = "Infinity";
            } else if (totalUnexp > 0 && riskUnexp === 0 && riskExp === 0) { 
                calcRR_text = "Indeterminate (0/0)";
            } else if (totalUnexp === 0 && totalExp > 0) { 
                 calcRR_text = "N/A (No unexposed group)";
            } else if (totalUnexp === 0 && totalExp === 0) {
                calcRR_text = "N/A (No data)";
            }


            rrValue_out.textContent = calcRR_text;

            if (currentChart_rr) currentChart_rr.destroy();
            currentChart_rr = new Chart(ctx_rr, {
                type: 'bar',
                data: {
                    labels: ['Exposed Group', 'Unexposed Group'],
                    datasets: [{
                        label: 'Risk of Event P(Event)',
                        data: [riskExp, riskUnexp],
                        backgroundColor: ['rgba(255, 99, 132, 0.7)', 'rgba(75, 192, 192, 0.7)'],
                        borderColor: ['rgb(255, 99, 132)', 'rgb(75, 192, 192)'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true, max: 1, title: {display:true, text:"P(Event)"} } },
                    plugins: { title: {display:true, text:"Event Risk by Group"} }
                }
            });
            activeChart = currentChart_rr;
        }
        [rrA_in, rrB_in, rrC_in, rrD_in].forEach(input => {
            input.removeEventListener('input', updateRelativeRisk);
            input.addEventListener('input', updateRelativeRisk);
        });
        updateRelativeRisk();
    }
    // --- END: Relative Risk Demo ---

    // --- START: NNT/NNH Demo ---
    function setupNNTNNHDemo(sectionElement) {
        sectionElement.innerHTML = `
            <h2>Number Needed to Treat (NNT) / Number Needed to Harm (NNH)</h2>
            <p>NNT: The average number of patients who need to be treated to prevent one additional bad outcome (or achieve one additional good outcome).
               Formula: NNT = 1 / ARR (Absolute Risk Reduction). ARR = CER - EER (Control Event Rate - Experimental Event Rate for bad outcome).
            </p>
            <p>NNH: The average number of patients who need to be treated for one additional patient to experience an adverse event.
               Formula: NNH = 1 / ARI (Absolute Risk Increase). ARI = EER<sub>adverse</sub> - CER<sub>adverse</sub>.
            </p>
            <div class="interactive-demo">
                <h4>Calculate NNT (for beneficial outcome - lower rate of bad event is good)</h4>
                <label for="nnt-cer">Control Event Rate (CER - e.g., % bad outcome in placebo): <span id="nnt-cer-val">0.20</span> (20%)</label>
                <input type="range" id="nnt-cer" min="0.01" max="1" value="0.20" step="0.01">
                <label for="nnt-eer">Experimental Event Rate (EER - e.g., % bad outcome in treatment): <span id="nnt-eer-val">0.10</span> (10%)</label>
                <input type="range" id="nnt-eer" min="0" max="0.99" value="0.10" step="0.01">
                
                <p>Absolute Risk Reduction (ARR = CER - EER): <strong id="nnt-arr">-</strong></p>
                <p>Calculated NNT: <strong id="nnt-value">-</strong></p>
                <div id="nnt-visualization" class="nnt-vis-container"></div>

                <h4>Calculate NNH (for adverse outcome - higher rate of bad event is bad)</h4>
                <label for="nnh-cer-adv">Control Adverse Event Rate (CER_adv): <span id="nnh-cer-adv-val">0.02</span> (2%)</label>
                <input type="range" id="nnh-cer-adv" min="0" max="0.99" value="0.02" step="0.01">
                <label for="nnh-eer-adv">Experimental Adverse Event Rate (EER_adv): <span id="nnh-eer-adv-val">0.05</span> (5%)</label>
                <input type="range" id="nnh-eer-adv" min="0.01" max="1" value="0.05" step="0.01">

                <p>Absolute Risk Increase (ARI = EER_adv - CER_adv): <strong id="nnh-ari">-</strong></p>
                <p>Calculated NNH: <strong id="nnh-value">-</strong></p>
                 <div id="nnh-visualization" class="nnt-vis-container"></div>
                <p class="interpretation-note">Lower NNT is better (more effective). Higher NNH is better (safer).
                Ideal NNT is 1. If ARR is negative (EER > CER), treatment is harmful for that outcome, and NNT becomes an NNH.
                </p>
            </div>
            <div class="misconception-box">
                <strong>Misconception:</strong> "An NNT of 10 means exactly 1 in 10 patients will benefit and the other 9 get no effect."
                <br><strong>Clarification:</strong> It's an average. Over many groups of 10 patients, on average, one additional patient will benefit *who would not have benefited if they were in the control group*. Some of the 10 might have recovered anyway (like controls), some might not benefit even with treatment. NNT is specific to a certain timeframe and comparison.
            </div>
            <div class="example-box">
                <strong>Real-World Misinterpretation Example: Statin Drugs</strong>
                <p>A study shows a statin drug has an NNT of 100 to prevent one major cardiovascular event over 5 years for low-risk individuals (e.g. CER=3%, EER=2%).
                <br><strong>Problem:</strong> Patients might hear "statin prevents heart attacks" and assume a large personal benefit. An NNT of 100 means 99 out of 100 similar low-risk individuals taking the drug for 5 years will *not* avoid a major cardiovascular event *that they would have otherwise had due to the drug's effect*. The drug prevented an event in 1 person *that would have happened under control conditions*. If the NNH for side effects (e.g., muscle pain, ARI=0.02 or 2%) is 50, then for every 100 people treated, 1 event is prevented, but 2 people experience side effects they wouldn't have otherwise. This benefit/harm balance is crucial.</p>
            </div>
            <style>.nnt-vis-container { display: flex; flex-wrap: wrap; margin-top:10px; margin-bottom:10px; align-items:center; } .nnt-vis-container p {margin-left:10px;}</style>
        `;
        
        const nntCerSlider = document.getElementById('nnt-cer');
        const nntEerSlider = document.getElementById('nnt-eer');
        const nntCerVal = document.getElementById('nnt-cer-val');
        const nntEerVal = document.getElementById('nnt-eer-val');
        const nntArrOutput = document.getElementById('nnt-arr');
        const nntValueOutput = document.getElementById('nnt-value');
        const nntVisEl = document.getElementById('nnt-visualization');

        const nnhCerAdvSlider = document.getElementById('nnh-cer-adv');
        const nnhEerAdvSlider = document.getElementById('nnh-eer-adv');
        const nnhCerAdvVal = document.getElementById('nnh-cer-adv-val');
        const nnhEerAdvVal = document.getElementById('nnh-eer-adv-val');
        const nnhAriOutput = document.getElementById('nnh-ari');
        const nnhValueOutput = document.getElementById('nnh-value');
        const nnhVisEl = document.getElementById('nnh-visualization');

        function createNNIconVisualization(n_val, type) {
            let visHtml = '';
            const roundedN = Math.max(1, Math.round(n_val)); 
            const maxIcons = 30; 
            const displayN = Math.min(roundedN, maxIcons);

            for (let i = 1; i <= displayN; i++) {
                let iconClass = "fas fa-user";
                let iconColor = "#cccccc"; 
                let titleText = "No additional effect relative to control";
                if (i === 1) { 
                    if (type === 'nnt') {
                        iconClass = "fas fa-user-check"; iconColor = "green"; titleText = "One additional person benefits";
                    } else { 
                        iconClass = "fas fa-user-injured"; iconColor = "red"; titleText = "One additional person harmed";
                    }
                }
                visHtml += `<i class="${iconClass}" style="font-size: 20px; color: ${iconColor}; margin: 2px;" title="${titleText}"></i>`;
            }
            if (roundedN > maxIcons) {
                visHtml += `<span style="align-self:center; margin-left: 5px; font-size:18px;">... (+${roundedN - maxIcons})</span>`;
            }
            
            let explanationText = "";
            if (isFinite(roundedN) && roundedN > 0) { // only show text if N is a valid positive number
                if (type === 'nnt') {
                    explanationText = `<p>Treat <strong>${roundedN}</strong>: <strong>1</strong> additional person benefits.</p>`;
                } else {
                    explanationText = `<p>Treat <strong>${roundedN}</strong>: <strong>1</strong> additional person harmed.</p>`;
                }
            }
            return visHtml + explanationText;
        }

        function updateNNT() {
            const cer = parseFloat(nntCerSlider.value);
            const eer = parseFloat(nntEerSlider.value);
            nntCerVal.textContent = `${cer.toFixed(2)} (${(cer*100).toFixed(0)}%)`;
            nntEerVal.textContent = `${eer.toFixed(2)} (${(eer*100).toFixed(0)}%)`;
            
            const arr = cer - eer;
            nntArrOutput.textContent = arr.toFixed(3);

            if (arr > 0) { 
                const nnt = 1 / arr;
                nntValueOutput.textContent = nnt.toFixed(1);
                nntVisEl.innerHTML = createNNIconVisualization(nnt, 'nnt');
            } else if (arr < 0) { 
                const nnh_for_outcome = 1 / Math.abs(arr);
                nntValueOutput.textContent = `Harmful (NNH=${nnh_for_outcome.toFixed(1)})`;
                nntVisEl.innerHTML = createNNIconVisualization(nnh_for_outcome, 'nnh');
            } else { 
                nntValueOutput.textContent = "N/A (No difference)";
                nntVisEl.innerHTML = "<p>No change in risk between groups.</p>";
            }
        }

        function updateNNH() {
            const cer_adv = parseFloat(nnhCerAdvSlider.value);
            const eer_adv = parseFloat(nnhEerAdvSlider.value);
            nnhCerAdvVal.textContent = `${cer_adv.toFixed(2)} (${(cer_adv*100).toFixed(0)}%)`;
            nnhEerAdvVal.textContent = `${eer_adv.toFixed(2)} (${(eer_adv*100).toFixed(0)}%)`;

            const ari = eer_adv - cer_adv;
            nnhAriOutput.textContent = ari.toFixed(3);

            if (ari > 0) { 
                const nnh = 1 / ari;
                nnhValueOutput.textContent = nnh.toFixed(1);
                nnhVisEl.innerHTML = createNNIconVisualization(nnh, 'nnh');
            } else if (ari < 0) { 
                const nnt_for_adverse = 1 / Math.abs(ari);
                nnhValueOutput.textContent = `Beneficial (NNT=${nnt_for_adverse.toFixed(1)} for this AE)`;
                 nnhVisEl.innerHTML = createNNIconVisualization(nnt_for_adverse, 'nnt');
            } else { 
                nnhValueOutput.textContent = "N/A (No difference)";
                nnhVisEl.innerHTML = "<p>No change in risk for this adverse event.</p>";
            }
        }

        [nntCerSlider, nntEerSlider].forEach(s => {
            s.removeEventListener('input', updateNNT); s.addEventListener('input', updateNNT);
        });
        [nnhCerAdvSlider, nnhEerAdvSlider].forEach(s => {
            s.removeEventListener('input', updateNNH); s.addEventListener('input', updateNNH);
        });
        updateNNT();
        updateNNH();
    }
    // --- END: NNT/NNH Demo ---
    
    // --- START: SMD Demo ---
    function setupSMDDemo(sectionElement) {
        sectionElement.innerHTML = `
            <h2>Standardized Mean Difference (SMD)</h2>
            <p>A family of effect sizes that quantify the difference between two group means in standardized units (usually standard deviations). Cohen's d and Hedges' g are common SMDs.
               Used extensively in meta-analysis to pool results from studies that might use different scales to measure the same outcome construct.
            </p>
            <div class="interactive-demo">
                <p>The interactive demo for SMD is conceptually identical to Cohen's d. The key is its application in meta-analysis when pooling studies that used different raw scales. Below, imagine two studies measuring 'Anxiety'.</p>
                
                <h4>Study A (e.g., Scale 0-20)</h4>
                <label for="smd-m1A">Mean Control (Study A): <span id="smd-m1A-val">10</span></label>
                <input type="range" id="smd-m1A" min="0" max="20" value="10" step="0.5">
                <label for="smd-m2A">Mean Treatment (Study A): <span id="smd-m2A-val">8</span></label>
                <input type="range" id="smd-m2A" min="0" max="20" value="8" step="0.5">
                <label for="smd-sdA">SD (pooled, Study A): <span id="smd-sdA-val">2.5</span></label>
                <input type="range" id="smd-sdA" min="0.5" max="5" value="2.5" step="0.1">
                <p>Calculated SMD for Study A: <strong id="smd-valueA">-</strong></p>
                <div class="chart-container" style="height:250px;"><canvas id="smdChartA"></canvas></div>
                
                <hr style="margin: 20px 0;">
                
                <h4>Study B (e.g., Scale 0-100)</h4>
                <label for="smd-m1B">Mean Control (Study B): <span id="smd-m1B-val">60</span></label>
                <input type="range" id="smd-m1B" min="0" max="100" value="60" step="1">
                <label for="smd-m2B">Mean Treatment (Study B): <span id="smd-m2B-val">52</span></label>
                <input type="range" id="smd-m2B" min="0" max="100" value="52" step="1">
                <label for="smd-sdB">SD (pooled, Study B): <span id="smd-sdB-val">10</span></label>
                <input type="range" id="smd-sdB" min="2" max="20" value="10" step="0.5">
                <p>Calculated SMD for Study B: <strong id="smd-valueB">-</strong></p>
                <div class="chart-container" style="height:250px;"><canvas id="smdChartB"></canvas></div>

                <p class="interpretation-note">Even if raw mean differences and SDs are vastly different, the SMDs can be similar if the effect magnitude (in SD units) is comparable. This allows for meta-analytic pooling. Interpretation of SMD values (0.2, 0.5, 0.8) is similar to Cohen's d.</p>
            </div>
            <div class="misconception-box">
                <strong>Misconception:</strong> "SMDs can magically make completely different outcomes comparable."
                <br><strong>Clarification:</strong> SMDs are for outcomes measuring the *same underlying construct* (e.g., depression, pain, student achievement) even if the specific instruments or scales differ. You can't use SMD to compare an effect on blood pressure with an effect on reading speed just because you standardized them. Conceptual similarity is key.
            </div>
            <div class="example-box">
                <strong>Real-World Application: Meta-analysis of Antidepressants</strong>
                <p>A meta-analysis wants to combine results from 10 studies on a new antidepressant. Study 1 used the Hamilton Depression Rating Scale (HAM-D, scores 0-52, M1=20, M2=15, SD=5). Study 2 used the Beck Depression Inventory (BDI, scores 0-63, M1=30, M2=22.5, SD=7.5).
                <br><strong>Solution:</strong> Raw mean differences (5 vs 7.5) can't be directly pooled.
                <br>Study 1 SMD = (20-15)/5 = +1.0 (assuming higher score is worse, treatment lowers score).
                <br>Study 2 SMD = (30-22.5)/7.5 = +1.0.
                <br>These SMDs (e.g., Hedges' g for precision) can now be averaged to get an overall estimate of the antidepressant's effectiveness, despite the different original scales. A misinterpretation would be to average the raw score changes, which would be meaningless.</p>
            </div>
        `;
        
        const m1A_s_smd = document.getElementById('smd-m1A');
        const m2A_s_smd = document.getElementById('smd-m2A');
        const sdA_s_smd = document.getElementById('smd-sdA');
        const m1A_v_smd = document.getElementById('smd-m1A-val');
        const m2A_v_smd = document.getElementById('smd-m2A-val');
        const sdA_v_smd = document.getElementById('smd-sdA-val');
        const smdValA_out = document.getElementById('smd-valueA');
        const ctxA_smd = document.getElementById('smdChartA').getContext('2d');
        let chartA_smd;

        const m1B_s_smd = document.getElementById('smd-m1B');
        const m2B_s_smd = document.getElementById('smd-m2B');
        const sdB_s_smd = document.getElementById('smd-sdB');
        const m1B_v_smd = document.getElementById('smd-m1B-val');
        const m2B_v_smd = document.getElementById('smd-m2B-val');
        const sdB_v_smd = document.getElementById('smd-sdB-val');
        const smdValB_out = document.getElementById('smd-valueB');
        const ctxB_smd = document.getElementById('smdChartB').getContext('2d');
        let chartB_smd;

        function updateSMDStudy(mean1, mean2, sd, mean1ValEl, mean2ValEl, sdValEl, smdOutEl, ctx, existingChart) {
            mean1ValEl.textContent = mean1.toFixed(1);
            mean2ValEl.textContent = mean2.toFixed(1);
            sdValEl.textContent = sd.toFixed(1);
            
            const smd = sd > 0 ? (mean1 - mean2) / sd : 0; 
            smdOutEl.textContent = smd.toFixed(2);

            const data1 = sd > 0 ? generateNormalDistributionData(mean1, sd, 100, Math.min(mean1, mean2) - 3.5 * sd, Math.max(mean1, mean2) + 3.5 * sd) : [];
            const data2 = sd > 0 ? generateNormalDistributionData(mean2, sd, 100, Math.min(mean1, mean2) - 3.5 * sd, Math.max(mean1, mean2) + 3.5 * sd) : [];

            if (existingChart) existingChart.destroy();
            const newChart = new Chart(ctx, {
                type: 'line',
                data: { datasets: [
                        { label: 'Control', data: data1, borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192,0.2)', fill: true, tension: 0.1, pointRadius: 0 },
                        { label: 'Treatment', data: data2, borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132,0.2)', fill: true, tension: 0.1, pointRadius: 0 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio:false, scales: { x: { type: 'linear', title:{display:true, text:"Score"} }, y: {title:{display:true, text:"Density"}, beginAtZero:true} }, plugins: {legend:{display:true}, title: { display: false }, tooltip:{enabled:false} } }
            });
            return newChart;
        }

        function updateAllSMD() {
            chartA_smd = updateSMDStudy(parseFloat(m1A_s_smd.value), parseFloat(m2A_s_smd.value), parseFloat(sdA_s_smd.value), m1A_v_smd, m2A_v_smd, sdA_v_smd, smdValA_out, ctxA_smd, chartA_smd);
            chartB_smd = updateSMDStudy(parseFloat(m1B_s_smd.value), parseFloat(m2B_s_smd.value), parseFloat(sdB_s_smd.value), m1B_v_smd, m2B_v_smd, sdB_v_smd, smdValB_out, ctxB_smd, chartB_smd);
            activeChart = [chartA_smd, chartB_smd];
        }

        [m1A_s_smd, m2A_s_smd, sdA_s_smd, m1B_s_smd, m2B_s_smd, sdB_s_smd].forEach(s => {
            s.removeEventListener('input', updateAllSMD); s.addEventListener('input', updateAllSMD);
        });
        updateAllSMD();
    }
    // --- END: SMD Demo ---

    // --- START: Cramér's V Demo ---
    function setupCramersVDemo(sectionElement) {
        sectionElement.innerHTML = `
            <h2>Cramér's V</h2>
            <p>Measures the strength of association between two categorical variables. Used with Chi-square test of independence.
               Values range from 0 (no association) to 1 (perfect association).
               Formula: V = sqrt(χ² / (N * (min(k, r) - 1))), where χ² is the chi-square statistic, N is total sample size, k is number of columns, r is number of rows.
            </p>
            <div class="interactive-demo">
                <h4>Simplified 2x2 Table for Demo: Variable A vs Variable B</h4>
                 <table class="contingency-table">
                    <thead><tr><th></th><th>Var B - Cat 1</th><th>Var B - Cat 2</th><th>Row Total</th></tr></thead>
                    <tbody>
                        <tr><th>Var A - Cat 1</th><td><input type="number" id="cv-a" value="40" min="0" class="table-input"></td><td><input type="number" id="cv-b" value="10" min="0" class="table-input"></td><td id="cv-r1tot">50</td></tr>
                        <tr><th>Var A - Cat 2</th><td><input type="number" id="cv-c" value="15" min="0" class="table-input"></td><td><input type="number" id="cv-d" value="35" min="0" class="table-input"></td><td id="cv-r2tot">50</td></tr>
                    </tbody>
                    <tfoot>
                        <tr><td>Col Total</td><td id="cv-c1tot">55</td><td id="cv-c2tot">45</td><td id="cv-N">100</td></tr>
                    </tfoot>
                </table>
                <p>Chi-square (χ²): <strong id="cv-chi2">-</strong> (df=<span id="cv-df">1</span>)</p>
                <p>Cramér's V: <strong id="cv-value">-</strong></p>
                <p class="interpretation-note">Benchmarks (for df_min=1, i.e., 2x2 table): V ≈ 0.1 (small), 0.3 (medium), 0.5 (large). For larger df_min (e.g., in a 3x4 table, df_min = min(3,4)-1 = 2), these benchmarks are lower. V is always non-negative.
                </p>
            </div>
            <div class="misconception-box">
                <strong>Misconception:</strong> "A significant Chi-square test means a strong association."
                <br><strong>Clarification:</strong> Like other significance tests, Chi-square is influenced by sample size. A large N can yield a significant Chi-square even for a very weak association (small Cramér's V). Cramér's V gives the strength, independent of N in its interpretation benchmarks (though N is in its formula).
            </div>
            <div class="example-box">
                <strong>Real-World Misinterpretation Example: Product Preference by Region</strong>
                <p>A company surveys 10,000 people and finds a statistically significant Chi-square (p < .001) for association between region (North, South, East, West - 4 levels) and product preference (Product A, B, C - 3 levels). They conclude there are strong regional preferences.
                <br><strong>Problem:</strong> The Cramér's V is only 0.08. For df_min = min(4,3)-1 = 2, a V of 0.08 is very small. While statistically significant due to the large sample, the actual differences in preference percentages between regions are tiny (e.g., Product A preferred by 30% in North, 32% in South, 31% in East, 29% in West). Marketing strategies based on "strong regional preferences" might be misguided and costly for such a small effect.</p>
            </div>
        `;
        const cvA_in = document.getElementById('cv-a');
        const cvB_in = document.getElementById('cv-b');
        const cvC_in = document.getElementById('cv-c');
        const cvD_in = document.getElementById('cv-d');
        const cvR1Tot = document.getElementById('cv-r1tot');
        const cvR2Tot = document.getElementById('cv-r2tot');
        const cvC1Tot = document.getElementById('cv-c1tot');
        const cvC2Tot = document.getElementById('cv-c2tot');
        const cvN_out = document.getElementById('cv-N');
        const cvChi2_out = document.getElementById('cv-chi2');
        const cvDf_out = document.getElementById('cv-df');
        const cvValue_out = document.getElementById('cv-value');

        function updateCramersV() {
            const a = parseInt(cvA_in.value) || 0;
            const b = parseInt(cvB_in.value) || 0;
            const c = parseInt(cvC_in.value) || 0;
            const d = parseInt(cvD_in.value) || 0;

            const N = a + b + c + d;
            const r1 = a + b; const r2 = c + d;
            const c1 = a + c; const c2 = b + d;

            cvR1Tot.textContent = r1; cvR2Tot.textContent = r2;
            cvC1Tot.textContent = c1; cvC2Tot.textContent = c2;
            cvN_out.textContent = N;

            let chi2_val = 0;
            let V_val_text = "N/A";

            if (N > 0 && r1 > 0 && r2 > 0 && c1 > 0 && c2 > 0) { 
                const exp_a = (r1 * c1) / N;
                const exp_b = (r1 * c2) / N;
                const exp_c = (r2 * c1) / N;
                const exp_d = (r2 * c2) / N;

                chi2_val += Math.pow(a - exp_a, 2) / exp_a;
                chi2_val += Math.pow(b - exp_b, 2) / exp_b;
                chi2_val += Math.pow(c - exp_c, 2) / exp_c;
                chi2_val += Math.pow(d - exp_d, 2) / exp_d;
            
                const num_rows = 2;
                const num_cols = 2;
                const df = (num_rows - 1) * (num_cols - 1);
                cvDf_out.textContent = df;
                const min_dim_minus_1 = Math.min(num_rows, num_cols) - 1;

                if (min_dim_minus_1 > 0) { 
                    const V = Math.sqrt(chi2_val / (N * min_dim_minus_1));
                    V_val_text = V.toFixed(3);
                }
            } else {
                cvDf_out.textContent = "1"; // Default for 2x2
            }
            cvChi2_out.textContent = chi2_val > 0 ? chi2_val.toFixed(3) : (N > 0 ? "0.000" : "N/A");
            cvValue_out.textContent = V_val_text;
        }
        [cvA_in, cvB_in, cvC_in, cvD_in].forEach(input => {
            input.removeEventListener('input', updateCramersV);
            input.addEventListener('input', updateCramersV);
        });
        updateCramersV();
    }
    // --- END: Cramér's V Demo ---

    // --- START: R-squared Demo ---
    function setupRSquaredDemo(sectionElement) {
        sectionElement.innerHTML = `
            <h2>R-squared (R²) or Coefficient of Determination</h2>
            <p>Indicates the proportion of the variance in the dependent variable that is predictable from the independent variable(s) in a regression model.
               Values range from 0 to 1 (or 0% to 100%).
               Formula (simple linear regression): R² = (Pearson's r)².
               More generally: R² = 1 - (SS<sub>residual</sub> / SS<sub>total</sub>) = SS<sub>regression</sub> / SS<sub>total</sub>.
            </p>
            <div class="interactive-demo">
                <label for="rs-correlation-strength">Select Correlation Strength (influences R²):</label>
                <select id="rs-correlation-strength">
                    <option value="0.0">None (r ≈ 0.0)</option>
                    <option value="0.3">Weak (r ≈ 0.3)</option>
                    <option value="0.5">Moderate (r ≈ 0.5)</option>
                    <option value="0.7" selected>Strong (r ≈ 0.7)</option>
                    <option value="0.9">Very Strong (r ≈ 0.9)</option>
                </select>
                <label for="rs-num-points">Number of Data Points: <span id="rs-num-points-val">50</span></label>
                <input type="range" id="rs-num-points" min="10" max="200" value="50" step="10">

                <p>Pearson's r: <strong id="rs-pearson-val">-</strong> | R-squared (R²): <strong id="rs-value">-</strong> (<span id="rs-percent-val">-</span>%)</p>
                <div class="chart-container" style="height:350px;"><canvas id="rSquaredChart"></canvas></div>
                <p class="interpretation-note">An R² of 0.25 means that 25% of the variance in the dependent variable can be explained by the linear relationship with the independent variable(s). The remaining 75% is unexplained (due to other factors or random error).</p>
            </div>
            <div class="misconception-box">
                <strong>Misconception:</strong> "A high R² means the model is a good fit and predictions will be accurate."
                <br><strong>Clarification:</strong> R² can be high even if the model is biased (e.g., fitting a line to a clear curve) or if the relationship is non-linear. Also, R² doesn't indicate causality. Adding more variables (even irrelevant ones) to a multiple regression model will almost always increase R² (use Adjusted R² to penalize for this). A high R² on training data doesn't guarantee good prediction on new data (overfitting).
            </div>
            <div class="example-box">
                <strong>Real-World Misinterpretation Example: Stock Market Prediction Model</strong>
                <p>An analyst creates a complex regression model with 20 variables to predict next month's stock market index. They achieve an R² of 0.70 on historical data. They claim their model explains 70% of market movements and is highly predictive.
                <br><strong>Problem:</strong> 1) Overfitting: With many variables, the model might be fitting noise in the historical data, not true underlying patterns. Adjusted R² would likely be lower and a better indicator. 2) R² on historical data (in-sample) doesn't guarantee future performance (out-of-sample). The stock market is notoriously hard to predict. An R² of 0.70 for *future* predictions would be astonishingly high and is likely an illusion from overfitting if not validated on unseen data. The model might perform poorly on new data.</p>
            </div>
        `;
        
        const strengthSelect_rs = document.getElementById('rs-correlation-strength');
        const numPointsSlider_rs = document.getElementById('rs-num-points');
        const numPointsVal_rs = document.getElementById('rs-num-points-val');
        const pearsonVal_rs_out = document.getElementById('rs-pearson-val');
        const rsValue_out = document.getElementById('rs-value');
        const rsPercentVal_out = document.getElementById('rs-percent-val');
        const ctx_rs = document.getElementById('rSquaredChart').getContext('2d');
        let currentChart_rs;

        function calculateRegressionLine(points) {
            const n = points.length;
            if (n < 2) return { slope: 0, intercept: 0, predictions: [] };

            let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
            points.forEach(p => {
                sumX += p.x;
                sumY += p.y;
                sumXY += p.x * p.y;
                sumX2 += p.x * p.x;
            });

            const slope_val = (n * sumX2 - sumX * sumX) !== 0 ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) : 0;
            const intercept_val = (sumY - slope_val * sumX) / n;
            
            if (points.length === 0) return { slope: 0, intercept: 0, predictions: [] };
            const xValues = points.map(p => p.x);
            const minX = Math.min(...xValues);
            const maxX = Math.max(...xValues);
             const linePoints = (isFinite(minX) && isFinite(maxX)) ? [
                {x: minX, y: slope_val * minX + intercept_val},
                {x: maxX, y: slope_val * maxX + intercept_val}
            ] : [];


            return { slope: slope_val, intercept: intercept_val, predictions: linePoints };
        }

        function updateRSquared() {
            const targetR = parseFloat(strengthSelect_rs.value);
            const n = parseInt(numPointsSlider_rs.value);
            numPointsVal_rs.textContent = n;

            const dataPoints = generateCorrelatedDataPR(n, targetR); 
            const actualR = calculatePearsonsR(dataPoints); 
            const rSquared = actualR * actualR;

            pearsonVal_rs_out.textContent = actualR.toFixed(2);
            rsValue_out.textContent = rSquared.toFixed(3);
            rsPercentVal_out.textContent = (rSquared * 100).toFixed(1);

            const { predictions } = calculateRegressionLine(dataPoints);
            
            if (currentChart_rs) currentChart_rs.destroy();
            currentChart_rs = new Chart(ctx_rs, {
                type: 'scatter',
                data: {
                    datasets: [
                        {
                            label: 'Data Points',
                            data: dataPoints,
                            backgroundColor: 'rgba(255, 99, 132, 0.6)',
                            pointRadius: 4
                        },
                        {
                            label: 'Regression Line',
                            data: predictions,
                            type: 'line', 
                            borderColor: 'rgba(54, 162, 235, 1)',
                            backgroundColor: 'rgba(54, 162, 235, 1)',
                            fill: false,
                            tension: 0, 
                            pointRadius: 0,
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: {
                        x: { type: 'linear', position: 'bottom', title: {display: true, text: "Independent Variable"} },
                        y: { title: {display: true, text: "Dependent Variable"} }
                    },
                    plugins: { title: { display: true, text: 'Scatter Plot with Regression Line' } }
                }
            });
            activeChart = currentChart_rs;
        }
        strengthSelect_rs.addEventListener('change', updateRSquared);
        numPointsSlider_rs.addEventListener('input', updateRSquared);
        updateRSquared();
    }
    // --- END: R-squared Demo ---

}); // End DOMContentLoaded