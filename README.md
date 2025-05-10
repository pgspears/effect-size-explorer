# effect-size-explorer
Interactive application to explore and learn about effect sizes.

## Overview

The **Effect Size Explorer** is an interactive web application designed to help users explore, understand, and learn about various statistical effect size measures. It provides clear explanations, dynamic visualizations, and highlights common misconceptions and real-world misinterpretations associated with each metric. The application also touches upon the crucial distinction between statistical significance (p-values) and practical significance (effect size).

This tool is aimed at students, researchers, data analysts, and anyone interested in gaining a more intuitive and practical understanding of how to quantify the magnitude of findings in data.

## Features

*   **Interactive Demos:** Manipulate parameters for different effect size calculations and see immediate visual feedback on dynamic charts and graphs.
*   **Comprehensive Explanations:** Detailed descriptions of each effect size measure, including:
    *   What it is and its typical applications.
    *   Interpretation guidelines (including common benchmarks and their caveats).
    *   Mathematical formulas (where appropriate).
*   **Misconceptions Debunked:** Addresses common errors in interpreting effect sizes, helping users avoid these pitfalls.
*   **Real-World Examples:** Illustrates how misinterpreting effect sizes can lead to flawed conclusions in various fields like medicine, education, and social sciences.
*   **Statistical Significance vs. Effect Size:** Dedicated section explaining why a small p-value doesn't always mean a large or important effect.
*   **Modern & Accessible UI:** Designed for ease of use with a clean layout and keyboard navigation support.

## Effect Sizes Covered

The application currently explores the following effect size measures:

1.  **Cohen's d:** Difference between two means.
2.  **Hedges' g:** Adjusted Cohen's d for small sample sizes.
3.  **Pearson's r (Correlation Coefficient):** Strength and direction of a linear relationship.
4.  **Eta-squared (η²) & Partial Eta-squared (ηₚ²):** Variance explained in ANOVA.
5.  **Odds Ratio (OR):** Comparing odds of an event between groups.
6.  **Relative Risk (RR):** Comparing probability of an event between groups.
7.  **Number Needed to Treat (NNT) / Number Needed to Harm (NNH):** Clinical effectiveness and harm.
8.  **Standardized Mean Difference (SMD):** General term for standardized mean differences, useful in meta-analysis.
9.  **Cramér's V:** Association strength between two categorical variables.
10. **R-squared (R² - Coefficient of Determination):** Proportion of variance predictable in regression.

## Technologies Used

*   **HTML5:** Structure and content.
*   **CSS3:** Styling and layout (including Flexbox/Grid).
*   **JavaScript (ES6+):** Interactivity, calculations, and dynamic content manipulation.
*   **Chart.js:** For dynamic charting and graphing.
*   **Font Awesome:** For icons.

## How to Use

1.  **Online:** Access the live application deployed on GitHub Pages: [https://pgspears.github.io/effect-size-explorer)/]
2.  **Locally:**
    *   Clone or download this repository.
    *   Open the `index.html` file in your web browser.

Navigate using the sidebar to select different effect size measures or topics. Interact with the sliders and input fields within each section to see how the calculations and visualizations change.

## Future Enhancements (Potential Ideas)

*   Calculation of confidence intervals for effect sizes.
*   More advanced visualizations for specific measures.
*   Ability for users to input their own summary data for calculations.
*   Integration of a p-value calculator for the "Significance vs. Effect Size" demo using a library like jStat.
*   Mobile responsiveness improvements.

## Contribution

Suggestions, bug reports, and contributions are welcome! Please feel free to open an issue or submit a pull request.

## License

This project is open source and available under the [MIT License](LICENSE.md). (You'll need to create a LICENSE.md file if you want to specify one - MIT is a common permissive one).

## Acknowledgements

*   Inspired by the need for clear, interactive tools in statistical education.
*   Thanks to the creators of Chart.js and Font Awesome.

---

© 2025 Accelerate Solutions, LLC. All Rights Reserved.
