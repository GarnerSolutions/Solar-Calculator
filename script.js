// 🌍 Switch between local and live backend by commenting/uncommenting the correct line:
// const apiUrl = "http://localhost:3000/api/process";  // 🔧 Use for LOCAL TESTING
const apiUrl = "https://solar-calculator-zb73.onrender.com/api/process";  // 🌍 Use for LIVE SERVER

// const backendUrl = "http://localhost:3000";
const backendUrl = "https://solar-calculator-zb73.onrender.com";

// ✅ Google Places Autocomplete for Address Input
function initializeAutocomplete() {
    const addressInput = document.getElementById("fullAddress");
    if (!addressInput) {
        console.error("Address input field not found!");
        return;
    }

    const autocomplete = new google.maps.places.Autocomplete(addressInput, {
        types: ["geocode"],
        componentRestrictions: { country: "us" }
    });

    autocomplete.addListener("place_changed", function () {
        const place = autocomplete.getPlace();
        if (!place.geometry) {
            console.error("No details available for input:", place);
            return;
        }
        console.log("📍 Selected Address:", place.formatted_address);
    });
}

// ✅ Toggle Dropdown Functionality
function setupDropdown() {
    const dropdownHeader = document.querySelector(".dropdown-header");
    const dropdownContent = document.querySelector(".dropdown-content");
    const dropdownToggle = document.querySelector(".dropdown-toggle");
    const resultsColumn = document.querySelector(".results-column");

    dropdownHeader.addEventListener("click", () => {
        const isExpanded = dropdownToggle.getAttribute("aria-expanded") === "true";
        dropdownToggle.setAttribute("aria-expanded", !isExpanded);
        dropdownContent.classList.toggle("hidden");

        if (isExpanded) {
            resultsColumn.style.margin = "0";
            resultsColumn.style.width = "100%";
        } else {
            resultsColumn.style.margin = "";
            resultsColumn.style.width = "";
        }
    });
}

// ✅ Display Energy Offset Chart
function displayEnergyOffsetChart(energyOffset, currentConsumption, estimatedProduction) {
    const resultsDiv = document.getElementById("results");
    const chartContainer = document.createElement("div");
    chartContainer.innerHTML = `<canvas id="energyOffsetChart" style="max-width: 500px; margin: 20px auto;"></canvas>`;
    resultsDiv.appendChild(chartContainer);

    const ctx = document.getElementById("energyOffsetChart").getContext("2d");
    new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Current Consumption", "Estimated Production"],
            datasets: [{
                label: "Energy (kWh)",
                data: [currentConsumption, estimatedProduction],
                backgroundColor: ["#1e3a8a", "#3b82f6"],
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: true, title: { display: true, text: "kWh" } }
            },
            plugins: {
                title: { display: true, text: `Energy Offset: ${energyOffset}` }
            }
        }
    });
}

// ✅ Handle Consumption Estimation Modal
function setupConsumptionHelp() {
    const helpText = document.getElementById("helpConsumptionText");
    const helpModal = document.getElementById("consumptionHelpModal");
    const estimateModal = document.getElementById("consumptionEstimateModal");
    const calculateConsumptionButton = document.getElementById("calculateConsumptionButton");
    const closeHelpModalButton = document.getElementById("closeHelpModalButton");
    const closeEstimateModalButton = document.getElementById("closeEstimateModalButton");

    helpText.addEventListener("click", () => {
        helpModal.style.display = "flex";
    });

    closeHelpModalButton.addEventListener("click", () => {
        helpModal.style.display = "none";
    });

    calculateConsumptionButton.addEventListener("click", () => {
        const utilityRate = Number(document.getElementById("averageUtilityRate").value);
        const monthlyBill = Number(document.getElementById("modalMonthlyBill").value);

        if (!utilityRate || utilityRate <= 0 || !monthlyBill || monthlyBill <= 0) {
            alert("Please enter valid values for Utility Rate and Monthly Bill.");
            return;
        }

        const estimatedConsumption = Math.round((monthlyBill / utilityRate) * 12); // Annual consumption
        document.getElementById("currentConsumption").value = estimatedConsumption;
        document.getElementById("currentMonthlyAverageBill").value = monthlyBill.toFixed(2);

        helpModal.style.display = "none";
        estimateModal.style.display = "flex";
    });

    closeEstimateModalButton.addEventListener("click", () => {
        estimateModal.style.display = "none";
    });
}

// ✅ Handle Utility Rate Estimation Modal
function setupUtilityRateHelp() {
    const helpUtilityRateText = document.getElementById("helpUtilityRateText");
    const utilityRateHelpModal = document.getElementById("utilityRateHelpModal");
    const utilityRateEstimateModal = document.getElementById("utilityRateEstimateModal");
    const estimateRateButton = document.getElementById("estimateRateButton");
    const closeUtilityRateModalButton = document.getElementById("closeUtilityRateModalButton");
    const closeRateEstimateModalButton = document.getElementById("closeRateEstimateModalButton");

    const rateTable = {
        "PG&E": { "No": 0.45, "Yes": 0.31 },
        "SDG&E": { "No": 0.385, "Yes": 0.2695 },
        "SCE": { "No": 0.42, "Yes": 0.294 }
    };

    helpUtilityRateText.addEventListener("click", () => {
        utilityRateHelpModal.style.display = "flex";
    });

    closeUtilityRateModalButton.addEventListener("click", () => {
        utilityRateHelpModal.style.display = "none";
    });

    estimateRateButton.addEventListener("click", () => {
        const utilityProvider = document.getElementById("utilityProvider").value;
        const careEnrollment = document.getElementById("careEnrollment").value;
        const estimatedUtilityRate = rateTable[utilityProvider][careEnrollment];

        document.getElementById("averageUtilityRate").value = estimatedUtilityRate.toFixed(4);

        utilityRateHelpModal.style.display = "none";
        utilityRateEstimateModal.style.display = "flex";
    });

    closeRateEstimateModalButton.addEventListener("click", () => {
        utilityRateEstimateModal.style.display = "none";
    });
}

// ✅ Handle Monthly Bill Estimation Modal
function setupMonthlyBillHelp() {
    const helpMonthlyBillText = document.getElementById("helpMonthlyBillText");
    const monthlyBillHelpModal = document.getElementById("monthlyBillHelpModal");
    const monthlyBillEstimateModal = document.getElementById("monthlyBillEstimateModal");
    const estimateBillButton = document.getElementById("estimateBillButton");
    const closeMonthlyBillModalButton = document.getElementById("closeMonthlyBillModalButton");
    const closeBillEstimateModalButton = document.getElementById("closeBillEstimateModalButton");

    helpMonthlyBillText.addEventListener("click", () => {
        monthlyBillHelpModal.style.display = "flex";
    });

    closeMonthlyBillModalButton.addEventListener("click", () => {
        monthlyBillHelpModal.style.display = "none";
    });

    estimateBillButton.addEventListener("click", () => {
        const summerBill = Number(document.getElementById("summerBill").value);
        const winterBill = Number(document.getElementById("winterBill").value);
        const fallSpringBill = Number(document.getElementById("fallSpringBill").value);

        if (!summerBill || summerBill < 0 || !winterBill || winterBill < 0 || !fallSpringBill || fallSpringBill < 0) {
            alert("Please enter valid values for all seasonal bills.");
            return;
        }

        const estimatedMonthlyBill = (summerBill * (3/12)) + (winterBill * (3/12)) + (fallSpringBill * (6/12));
        document.getElementById("modalMonthlyBill").value = estimatedMonthlyBill.toFixed(2);

        monthlyBillHelpModal.style.display = "none";
        monthlyBillEstimateModal.style.display = "flex";
    });

    closeBillEstimateModalButton.addEventListener("click", () => {
        monthlyBillEstimateModal.style.display = "none";
    });
}

// ✅ Handle Build System Button (Calculate Solar Size Only)
async function buildSystem() {
    const currentConsumption = Number(document.getElementById("currentConsumption")?.value);
    const desiredProduction = Number(document.getElementById("desiredProduction")?.value);
    const panelDirection = document.getElementById("panelDirection")?.value;
    const shadingElement = document.getElementById("shading");
    const shading = shadingElement ? shadingElement.value.toLowerCase() : "none";
    const fullAddress = document.getElementById("fullAddress")?.value.trim();
    const systemSizeDisplay = document.getElementById("systemSizeDisplay");

    // Clear previous display
    systemSizeDisplay.innerHTML = "";

    // Input Validation
    if (!currentConsumption || isNaN(currentConsumption) || currentConsumption <= 0) {
        systemSizeDisplay.innerHTML = `<p class="error">Please enter a valid current annual consumption.</p>`;
        return;
    }
    if (!desiredProduction || isNaN(desiredProduction) || desiredProduction <= 0) {
        systemSizeDisplay.innerHTML = `<p class="error">Please enter a valid desired annual production.</p>`;
        return;
    }
    if (!fullAddress) {
        systemSizeDisplay.innerHTML = `<p class="error">Please enter a valid address.</p>`;
        return;
    }
    if (!shading || !["none", "light", "medium", "heavy"].includes(shading.toLowerCase())) {
        systemSizeDisplay.innerHTML = `<p class="error">Please select a valid shading option.</p>`;
        return;
    }

    const requestBody = {
        currentConsumption,
        desiredProduction,
        panelDirection,
        shading,
        fullAddress,
        batteryCount: 0, // Default for initial calculation
        currentMonthlyAverageBill: 0, // Placeholder
        systemCost: 0, // Placeholder
        monthlyCost: 0 // Placeholder
    };

    try {
        systemSizeDisplay.innerHTML = "<p>Calculating...</p>";
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Server error");
        }

        const result = await response.json();
        const solarSize = result.params.solarSize;
        systemSizeDisplay.innerHTML = `System Size: ${solarSize} kW`;
    } catch (error) {
        systemSizeDisplay.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
}

// ✅ Fetch Data and Generate Presentation (Full Calculation with PDF)
async function generatePresentation() {
    const currentConsumption = Number(document.getElementById("currentConsumption")?.value);
    const desiredProduction = Number(document.getElementById("desiredProduction")?.value);
    const panelDirection = document.getElementById("panelDirection")?.value;
    const currentMonthlyAverageBill = Number(document.getElementById("currentMonthlyAverageBill")?.value);
    const batteryCount = Number(document.getElementById("batteryCount")?.value) || 0;
    const shadingElement = document.getElementById("shading");
    const shading = shadingElement ? shadingElement.value.toLowerCase() : "none";
    const fullAddress = document.getElementById("fullAddress")?.value.trim();
    const systemCost = Number(document.getElementById("systemCost")?.value) || 0;
    const monthlyCost = Number(document.getElementById("monthlyCost")?.value) || 0;
    const resultsDiv = document.getElementById("results");
    const downloadLinkDiv = document.getElementById("downloadLink");
    const dropdownContent = document.querySelector(".dropdown-content");
    const dropdownToggle = document.querySelector(".dropdown-toggle");
    const resultsColumn = document.querySelector(".results-column");

    // Collapse the dropdown and center the results
    dropdownToggle.setAttribute("aria-expanded", "false");
    dropdownContent.classList.add("hidden");
    resultsColumn.style.margin = "0";
    resultsColumn.style.width = "100%";

    // Show loading state
    resultsDiv.innerHTML = "<p>Loading...</p>";
    downloadLinkDiv.innerHTML = "";
    downloadLinkDiv.style.display = "none";

    // Input Validation
    if (!currentConsumption || isNaN(currentConsumption) || currentConsumption <= 0) {
        resultsDiv.innerHTML = `<p class="error">Please enter a valid current annual consumption.</p>`;
        return;
    }
    if (!desiredProduction || isNaN(desiredProduction) || desiredProduction <= 0) {
        resultsDiv.innerHTML = `<p class="error">Please enter a valid desired annual production.</p>`;
        return;
    }
    if (!fullAddress) {
        resultsDiv.innerHTML = `<p class="error">Please enter a valid address.</p>`;
        return;
    }
    if (!currentMonthlyAverageBill || isNaN(currentMonthlyAverageBill) || currentMonthlyAverageBill <= 0) {
        resultsDiv.innerHTML = `<p class="error">Please enter a valid Current Monthly Average Bill.</p>`;
        return;
    }
    if (isNaN(batteryCount) || batteryCount < 0) {
        resultsDiv.innerHTML = `<p class="error">Please enter a valid battery count (must be a non-negative number).</p>`;
        return;
    }
    if (isNaN(systemCost) || systemCost < 0) {
        resultsDiv.innerHTML = `<p class="error">Please enter a valid system cost (must be a non-negative number).</p>`;
        return;
    }
    if (isNaN(monthlyCost) || monthlyCost < 0) {
        resultsDiv.innerHTML = `<p class="error">Please enter a valid monthly cost with solar (must be a non-negative number).</p>`;
        return;
    }
    if (!shading || !["none", "light", "medium", "heavy"].includes(shading.toLowerCase())) {
        resultsDiv.innerHTML = `<p class="error">Please select a valid shading option.</p>`;
        return;
    }

    const requestBody = {
        currentConsumption,
        desiredProduction,
        panelDirection,
        batteryCount,
        currentMonthlyAverageBill,
        shading,
        fullAddress,
        systemCost,
        monthlyCost
    };

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Server error");
        }

        const result = await response.json();

        resultsDiv.innerHTML = `
            <h2 class="results-title">Your Solar Results</h2>
            <div class="result-section">
                <h3 class="section-title">System Overview</h3>
                <ul>
                    <li>Solar System Size: <strong>${result.params.solarSize} kW</strong></li>
                    <li>Battery Size: <strong>${result.params.batterySize}</strong></li>
                    <li>Number of Panels: <strong>${result.params.panelCount}</strong></li>
                </ul>
            </div>
            <div class="result-section">
                <h3 class="section-title">Production</h3>
                <ul>
                    <li>Estimated Annual Production: <strong>${Number(result.params.estimatedAnnualProduction).toLocaleString()} kWh</strong></li>
                </ul>
            </div>
            <div class="result-section">
                <h3 class="section-title">Energy Savings</h3>
                <ul>
                    <li>Energy Offset: <strong>${result.params.energyOffset}</strong></li>
                </ul>
            </div>
            <div class="result-section">
                <h3 class="section-title">Cost Summary</h3>
                <ul>
                    <li>Solar System Cost: <strong>$${Number(result.params.systemCost).toLocaleString()}</strong></li>
                    <li>Battery Cost: <strong>$${Number(result.params.batteryCost).toLocaleString()}</strong></li>
                    <li>Total Cost: <strong>$${Number(result.params.totalCost).toLocaleString()}</strong></li>
                    <li>Monthly Cost with Solar: <strong>$${Number(monthlyCost).toLocaleString()}</strong></li>
                </ul>
            </div>
        `;

        displayEnergyOffsetChart(result.params.energyOffset, currentConsumption, result.params.estimatedAnnualProduction);

        if (result.pdfViewUrl) {
            downloadLinkDiv.innerHTML = `
                <a href="${result.pdfViewUrl}" target="_blank" class="download-proposal">Download Proposal</a>
            `;
            downloadLinkDiv.style.display = "block";
        } else {
            downloadLinkDiv.innerHTML = `<p class="error">Error: PDF could not be opened.</p>`;
            downloadLinkDiv.style.display = "block";
        }
    } catch (error) {
        resultsDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
}

// ✅ Initialize Autocomplete and Add Event Listeners on Page Load
window.onload = function () {
    initializeAutocomplete();
    setupDropdown();
    setupConsumptionHelp();
    setupUtilityRateHelp();
    setupMonthlyBillHelp();

    const calculateButton = document.getElementById("calculateButton");
    if (calculateButton) {
        calculateButton.addEventListener("click", generatePresentation);
    } else {
        console.error("❌ Calculate button not found!");
    }

    const buildSystemButton = document.getElementById("buildSystemButton");
    if (buildSystemButton) {
        buildSystemButton.addEventListener("click", buildSystem);
    } else {
        console.error("❌ Build System button not found!");
    }
};