// 🌍 Switch between local and live backend by commenting/uncommenting the correct line:
// const apiUrl = "http://localhost:3000/api/process";  // 🔧 Use for LOCAL TESTING
const apiUrl = "https://solar-calculator-zb73.onrender.com/api/process";  // 🌍 Use for LIVE SERVER

// const backendUrl = "http://localhost:3000";
const backendUrl = "https://solar-calculator-zb73.onrender.com";

// ✅ Google Places Autocomplete for Address Input
function initializeAutocomplete() {
    const addressInput = document.getElementById("fullAddress");
    if (!addressInput) {
        console.error("❌ Address input field not found!");
        return;
    }

    const autocomplete = new google.maps.places.Autocomplete(addressInput, {
        types: ["geocode"],
        componentRestrictions: { country: "us" }
    });

    autocomplete.addListener("place_changed", function () {
        const place = autocomplete.getPlace();
        if (!place.geometry) {
            console.error("❌ No details available for input:", place);
            return;
        }
        console.log("📍 Selected Address:", place.formatted_address);
        // Manually dispatch a change event to ensure button state updates
        const changeEvent = new Event("change");
        addressInput.dispatchEvent(changeEvent);
        updateBuildSystemButtonState(); // Update button state when address changes
    });
}

// ✅ Callback function for Google Maps API
window.initMap = function() {
    initializeAutocomplete();
};

// ✅ Toggle Dropdown Functionality
function setupDropdown() {
    const dropdownHeader = document.querySelector(".dropdown-header");
    const dropdownContent = document.querySelector(".dropdown-content");
    const dropdownToggle = document.querySelector(".dropdown-toggle");
    const resultsColumn = document.querySelector(".results-column");

    if (!dropdownHeader || !dropdownContent || !dropdownToggle || !resultsColumn) {
        console.error("❌ One or more dropdown elements not found!");
        return;
    }

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

// ✅ Handle Consumption Estimation Modal
function setupConsumptionHelp() {
    const helpText = document.getElementById("helpConsumptionText");
    const helpModal = document.getElementById("consumptionHelpModal");
    const estimateModal = document.getElementById("consumptionEstimateModal");
    const calculateConsumptionButton = document.getElementById("calculateConsumptionButton");
    const closeHelpModalButton = document.getElementById("closeHelpModalButton");
    const closeEstimateModalButton = document.getElementById("closeEstimateModalButton");

    if (!helpText || !helpModal || !estimateModal || !calculateConsumptionButton || !closeHelpModalButton || !closeEstimateModalButton) {
        console.warn("⚠️ One or more consumption help elements not found! Help feature may be unavailable.");
        return;
    }

    helpText.addEventListener("click", () => {
        helpModal.style.display = "flex";
    });

    closeHelpModalButton.addEventListener("click", () => {
        helpModal.style.display = "none";
    });

    calculateConsumptionButton.addEventListener("click", () => {
        const utilityRate = Number(document.getElementById("averageUtilityRate")?.value);
        const monthlyBill = Number(document.getElementById("modalMonthlyBill")?.value);

        if (!utilityRate || utilityRate <= 0 || !monthlyBill || monthlyBill <= 0) {
            alert("Please enter valid values for Utility Rate and Monthly Bill.");
            return;
        }

        const estimatedConsumption = Math.round((monthlyBill / utilityRate) * 12);

        const currentConsumptionInput = document.getElementById("currentConsumption");
        const currentMonthlyAverageBillInput = document.getElementById("currentMonthlyAverageBill");

        if (currentConsumptionInput) {
            currentConsumptionInput.value = estimatedConsumption;
        } else {
            console.error("❌ Current Consumption input not found!");
        }

        if (currentMonthlyAverageBillInput) {
            currentMonthlyAverageBillInput.value = monthlyBill.toFixed(2);
        } else {
            console.error("❌ Current Monthly Average Bill input not found!");
        }

        helpModal.style.display = "none";
        estimateModal.style.display = "flex";
        updateBuildSystemButtonState();
        updateCalculateButtonState();
    });

    closeEstimateModalButton.addEventListener("click", () => {
        estimateModal.style.display = "none";
        updateBuildSystemButtonState();
        updateCalculateButtonState();
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

    if (!helpUtilityRateText || !utilityRateHelpModal || !utilityRateEstimateModal || !estimateRateButton || !closeUtilityRateModalButton || !closeRateEstimateModalButton) {
        console.warn("⚠️ One or more utility rate help elements not found! Help feature may be unavailable.");
        return;
    }

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
        const utilityProvider = document.getElementById("utilityProvider")?.value;
        const careEnrollment = document.getElementById("careEnrollment")?.value;
        const estimatedUtilityRate = rateTable[utilityProvider][careEnrollment];

        const averageUtilityRateInput = document.getElementById("averageUtilityRate");
        if (averageUtilityRateInput) {
            averageUtilityRateInput.value = estimatedUtilityRate.toFixed(4);
        } else {
            console.error("❌ Average Utility Rate input not found!");
        }

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

    if (!helpMonthlyBillText || !monthlyBillHelpModal || !monthlyBillEstimateModal || !estimateBillButton || !closeMonthlyBillModalButton || !closeBillEstimateModalButton) {
        console.warn("⚠️ One or more monthly bill help elements not found! Help feature may be unavailable.");
        return;
    }

    helpMonthlyBillText.addEventListener("click", () => {
        monthlyBillHelpModal.style.display = "flex";
    });

    closeMonthlyBillModalButton.addEventListener("click", () => {
        monthlyBillHelpModal.style.display = "none";
    });

    estimateBillButton.addEventListener("click", () => {
        const summerBill = Number(document.getElementById("summerBill")?.value);
        const winterBill = Number(document.getElementById("winterBill")?.value);
        const fallSpringBill = Number(document.getElementById("fallSpringBill")?.value);

        if (!summerBill || summerBill < 0 || !winterBill || winterBill < 0 || !fallSpringBill || fallSpringBill < 0) {
            alert("Please enter valid values for all seasonal bills.");
            return;
        }

        const estimatedMonthlyBill = (summerBill * (3/12)) + (winterBill * (3/12)) + (fallSpringBill * (6/12));

        const modalMonthlyBillInput = document.getElementById("modalMonthlyBill");
        if (modalMonthlyBillInput) {
            modalMonthlyBillInput.value = estimatedMonthlyBill.toFixed(2);
        } else {
            console.error("❌ Modal Monthly Bill input not found!");
        }

        monthlyBillHelpModal.style.display = "none";
        monthlyBillEstimateModal.style.display = "flex";
    });

    closeBillEstimateModalButton.addEventListener("click", () => {
        monthlyBillEstimateModal.style.display = "none";
    });
}

// ✅ Handle Build System Button (Calculate Solar Size)
async function buildSystem() {
    const currentConsumption = Number(document.getElementById("currentConsumption")?.value);
    const desiredProduction = Number(document.getElementById("desiredProduction")?.value);
    const panelDirection = document.getElementById("panelDirection")?.value;
    const shadingElement = document.getElementById("shading");
    const shading = shadingElement ? shadingElement.value.toLowerCase() : "none";
    const fullAddress = document.getElementById("fullAddress")?.value.trim();
    const systemSizeDisplay = document.getElementById("systemSizeDisplay");
    const addBatteriesButton = document.getElementById("addBatteriesButton");
    const salesCommission = Number(document.getElementById("salesCommission")?.value) || 0;

    if (!systemSizeDisplay || !addBatteriesButton) {
        console.error("❌ System Size Display or Add Batteries Button not found!");
        return;
    }

    // Clear previous display
    systemSizeDisplay.innerHTML = "";
    document.getElementById("totalBatterySizeDisplay").innerHTML = "";

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
        batteryCount: 0,
        currentMonthlyAverageBill: 0,
        systemCost: 0,
        monthlyCost: 0,
        salesCommission
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
            systemSizeDisplay.innerHTML = `<p class="error">Error: ${errorData.error || "Server error"}</p>`;
            return;
        }

        const result = await response.json();
        const solarSize = result.params.solarSize;
        systemSizeDisplay.innerHTML = `System Size: ${solarSize} kW`;
        const systemSizeInput = document.getElementById("systemSizeInput");
        if (systemSizeInput) {
            systemSizeInput.value = solarSize;
        }
        // Ensure Add Batteries button is enabled after successful build
        addBatteriesButton.disabled = false;
        console.log("Add Batteries Button State: Enabled after build");
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
    const salesCommission = Number(document.getElementById("salesCommission")?.value) || 0;
    const resultsDiv = document.getElementById("results");
    const downloadLinkDiv = document.getElementById("downloadLink");
    const dropdownContent = document.querySelector(".dropdown-content");
    const dropdownToggle = document.querySelector(".dropdown-toggle");
    const resultsColumn = document.querySelector(".results-column");

    if (!resultsDiv || !downloadLinkDiv || !dropdownContent || !dropdownToggle || !resultsColumn) {
        console.error("❌ One or more result elements not found!");
        return;
    }

    // Collapse the dropdown and center the results
    dropdownToggle.setAttribute("aria-expanded", "false");
    dropdownContent.classList.add("hidden");
    resultsColumn.style.margin = "0";
    resultsColumn.style.width = "100%";

    // Clear existing content and show loading state
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
    if (isNaN(salesCommission) || salesCommission < 0) {
        resultsDiv.innerHTML = `<p class="error">Please enter a valid commission (must be a non-negative number).</p>`;
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
        monthlyCost,
        salesCommission
    };

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json();
            resultsDiv.innerHTML = `<p class="error">Error: ${errorData.error || "Server error"}</p>`;
            return;
        }

        const result = await response.json();
        const solarSize = result.params.solarSize;
        const totalBatterySize = batteryCount * 16; // Assuming 16 kWh per battery
        const salesRedline = Number(document.getElementById("salesRedline")?.value) || 0;
        const adderCosts = Number(document.getElementById("adderCosts")?.value) || 0;

        const solarCost = solarSize * salesRedline;
        const batteryCost = totalBatterySize * 1000;
        const totalCost = solarCost + batteryCost + adderCosts + salesCommission;

        resultsDiv.innerHTML = `
            <div class="results-card">
                <h2 class="results-title">Your Solar Results</h2>
                <div class="result-section">
                    <h3 class="section-title">System Overview</h3>
                    <ul>
                        <li>Solar System Size: <strong>${solarSize} kW</strong></li>
                        <li>Battery Size: <strong>${totalBatterySize} kWh (${batteryCount} x 16 kWh)</strong></li>
                        <li>Number of Panels: <strong>${result.params.panelCount}</strong></li>
                    </ul>
                </div>
                <div class="result-section">
                    <h3 class="section-title">Energy Overview</h3>
                    <ul>
                        <li>Estimated Annual Production: <strong>${Number(result.params.estimatedAnnualProduction).toLocaleString()} kWh</strong></li>
                        <li>Annual Consumption Before Solar: <strong>${Number(currentConsumption).toLocaleString()} kWh</strong></li>
                        <li>Energy Offset: <strong>${result.params.energyOffset}</strong></li>
                    </ul>
                </div>
                <div class="result-section">
                    <h3 class="section-title">Cost Summary</h3>
                    <ul>
                        <li>Solar Cost: <strong>$${Number(solarCost).toLocaleString()}</strong></li>
                        <li>Battery Cost: <strong>$${Number(batteryCost).toLocaleString()}</strong></li>
                        <li>Adders Cost: <strong>$${Number(adderCosts).toLocaleString()}</strong></li>
                        <li>Commission: <strong>$${Number(salesCommission).toLocaleString()}</strong></li>
                        <li>Total Cost: <strong>$${Number(totalCost).toLocaleString()}</strong></li>
                        <li>Monthly Cost with Solar: <strong>$${Number(monthlyCost).toLocaleString()}</strong></li>
                    </ul>
                </div>
            </div>
        `;

        if (result.pdfViewUrl) {
            downloadLinkDiv.innerHTML = `<button id="downloadProposal" class="calculate-button">Download Proposal</button>`;
            downloadLinkDiv.style.display = "block";
            document.getElementById("downloadProposal").addEventListener("click", () => window.open(result.pdfViewUrl, "_blank"));
        } else {
            downloadLinkDiv.innerHTML = `<p class="error">Error: PDF could not be opened.</p>`;
            downloadLinkDiv.style.display = "block";
        }
    } catch (error) {
        resultsDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
}

// ✅ Handle Battery Sizing Help Modal
function setupBatteryHelp() {
    const helpBatteryText = document.getElementById("helpBatteryText");
    const batteryHelpModal = document.getElementById("batteryHelpModal");
    const applyRecommendationButton = document.getElementById("applyRecommendationButton");
    const overwriteRecommendationButton = document.getElementById("overwriteRecommendationButton");
    const recommendedBatteryCount = document.getElementById("recommendedBatteryCount");
    const recommendedBatteryStorage = document.getElementById("recommendedBatteryStorage");
    const systemSizeDisplay = document.getElementById("systemSizeDisplay");
    const batteryCountModal = document.getElementById("batteryCountModal");
    const batteryQuantity = document.getElementById("batteryQuantity");
    const totalStorage = document.getElementById("totalStorage");
    const applyBatteriesButton = document.getElementById("applyBatteriesButton");
    const batteryCountInput = document.getElementById("batteryCount");
    const totalBatterySizeDisplay = document.getElementById("totalBatterySizeDisplay");

    if (!helpBatteryText || !batteryHelpModal || !applyRecommendationButton || !overwriteRecommendationButton || !recommendedBatteryCount || !recommendedBatteryStorage || !systemSizeDisplay || !batteryCountModal || !batteryQuantity || !totalStorage || !applyBatteriesButton || !batteryCountInput || !totalBatterySizeDisplay) {
        console.warn("⚠️ One or more battery help elements not found! Add Batteries feature may be unavailable.");
        return;
    }

    // Function to open the battery help modal
    const openBatteryHelpModal = () => {
        // Check if system size is calculated
        const systemSizeText = systemSizeDisplay.textContent;
        const solarSizeMatch = systemSizeText.match(/System Size: (\d+\.\d+) kW/);
        if (!solarSizeMatch) {
            alert("Please calculate the system size first by clicking 'Build System'.");
            return;
        }

        const solarSize = parseFloat(solarSizeMatch[1]);
        if (isNaN(solarSize) || solarSize <= 0) {
            alert("Invalid system size. Please ensure the system size is calculated correctly.");
            return;
        }

        // Calculate recommended battery size
        const targetBatteryStorage = solarSize * 2; // 2:1 ratio
        const X = Math.ceil(targetBatteryStorage / 16); // Number of batteries (16 kWh each)
        const Y = X * 16; // Total kWh

        // Update modal with recommendations
        recommendedBatteryCount.textContent = X;
        recommendedBatteryStorage.textContent = Y;

        batteryHelpModal.style.display = "flex";
    };

    // Attach event listener to "Add Batteries" button
    const addBatteriesButton = document.getElementById("addBatteriesButton");
    if (addBatteriesButton) {
        addBatteriesButton.addEventListener("click", openBatteryHelpModal);
    } else {
        console.error("❌ Add Batteries button not found!");
    }

    // Attach event listener to "Need help sizing?" link
    helpBatteryText.addEventListener("click", openBatteryHelpModal);

    applyRecommendationButton.addEventListener("click", () => {
        const X = parseInt(recommendedBatteryCount.textContent);
        if (batteryCountInput) {
            batteryCountInput.value = X;
            if (totalBatterySizeDisplay) {
                totalBatterySizeDisplay.innerHTML = `Total Battery Size: ${X * 16} kWh`;
            }
            const batterySizeInput = document.getElementById("batterySizeInput");
            if (batterySizeInput) {
                batterySizeInput.value = X * 16;
            }
            window.cachedBatteryCount = X;
        }
        batteryHelpModal.style.display = "none";
        updateBuildSystemButtonState();
        updateCalculateButtonState();
    });

    overwriteRecommendationButton.addEventListener("click", () => {
        batteryHelpModal.style.display = "none";
        batteryCountModal.style.display = "flex";
        updateTotalStorage();
    });

    batteryQuantity.addEventListener("change", updateTotalStorage);

    function updateTotalStorage() {
        const quantity = parseInt(batteryQuantity.value) || 0;
        totalStorage.textContent = quantity * 16;
    }

    applyBatteriesButton.addEventListener("click", () => {
        const quantity = parseInt(batteryQuantity.value) || 0;
        if (batteryCountInput) {
            batteryCountInput.value = quantity;
            if (totalBatterySizeDisplay) {
                totalBatterySizeDisplay.innerHTML = `Total Battery Size: ${quantity * 16} kWh`;
            }
            const batterySizeInput = document.getElementById("batterySizeInput");
            if (batterySizeInput) {
                batterySizeInput.value = quantity * 16;
            }
            window.cachedBatteryCount = quantity;
        }
        batteryCountModal.style.display = "none";
        updateBuildSystemButtonState();
        updateCalculateButtonState();
    });
}

// ✅ Handle Current Monthly Utility Bill Estimation Modal
function setupCurrentMonthlyBillHelp() {
    const helpCurrentMonthlyBillText = document.getElementById("helpCurrentMonthlyBillText");
    const currentMonthlyBillHelpModal = document.getElementById("currentMonthlyBillHelpModal");
    const estimateCurrentBillButton = document.getElementById("estimateCurrentBillButton");
    const closeCurrentMonthlyBillModalButton = document.getElementById("closeCurrentMonthlyBillModalButton");
    const currentMonthlyAverageBillInput = document.getElementById("currentMonthlyAverageBill");

    if (!helpCurrentMonthlyBillText || !currentMonthlyBillHelpModal || !estimateCurrentBillButton || !closeCurrentMonthlyBillModalButton || !currentMonthlyAverageBillInput) {
        console.warn("⚠️ One or more current monthly bill help elements not found! Help feature may be unavailable.");
        return;
    }

    helpCurrentMonthlyBillText.addEventListener("click", () => {
        currentMonthlyBillHelpModal.style.display = "flex";
    });

    closeCurrentMonthlyBillModalButton.addEventListener("click", () => {
        currentMonthlyBillHelpModal.style.display = "none";
    });

    estimateCurrentBillButton.addEventListener("click", () => {
        const summerBill = Number(document.getElementById("currentSummerBill")?.value);
        const winterBill = Number(document.getElementById("currentWinterBill")?.value);
        const fallSpringBill = Number(document.getElementById("currentFallSpringBill")?.value);

        if (!summerBill || summerBill < 0 || !winterBill || winterBill < 0 || !fallSpringBill || fallSpringBill < 0) {
            alert("Please enter valid values for all seasonal bills.");
            return;
        }

        const estimatedMonthlyBill = (summerBill * (3/12)) + (winterBill * (3/12)) + (fallSpringBill * (6/12));
        currentMonthlyAverageBillInput.value = estimatedMonthlyBill.toFixed(2);
        currentMonthlyBillHelpModal.style.display = "none";
        updateBuildSystemButtonState();
        updateCalculateButtonState();
    });
}

// ✅ Handle System Cost Calculator Modal
function setupSystemCostHelp() {
    const helpSystemCostText = document.getElementById("helpSystemCostText");
    const systemCostHelpModal = document.getElementById("systemCostHelpModal");
    const calculateSystemCostButton = document.getElementById("calculateSystemCostButton");
    const closeSystemCostModalButton = document.getElementById("closeSystemCostModalButton");
    const salesRedlineInput = document.getElementById("salesRedline");
    const systemSizeInput = document.getElementById("systemSizeInput");
    const batterySizeInput = document.getElementById("batterySizeInput");
    const adderCostsInput = document.getElementById("adderCosts");
    const salesCommissionInput = document.getElementById("salesCommissionModal");
    const additionalNotesInput = document.getElementById("additionalNotes");
    const systemCostInput = document.getElementById("systemCost");

    if (!helpSystemCostText || !systemCostHelpModal || !calculateSystemCostButton || !closeSystemCostModalButton || !salesRedlineInput || !systemSizeInput || !batterySizeInput || !adderCostsInput || !salesCommissionInput || !additionalNotesInput || !systemCostInput) {
        console.warn("⚠️ One or more system cost help elements not found! Help feature may be unavailable.");
        return;
    }

    helpSystemCostText.addEventListener("click", () => {
        systemCostHelpModal.style.display = "flex";
    });

    closeSystemCostModalButton.addEventListener("click", () => {
        systemCostHelpModal.style.display = "none";
    });

    calculateSystemCostButton.addEventListener("click", () => {
        const salesRedline = Number(salesRedlineInput.value) || 0;
        const systemSize = Number(systemSizeInput.value) || 0;
        const batterySize = Number(batterySizeInput.value) || 0;
        const adderCosts = Number(adderCostsInput.value) || 0;
        const salesCommission = Number(salesCommissionInput.value) || 0;
        const additionalNotes = additionalNotesInput.value || "";

        // Calculate battery cost: total battery size in kWh * 1000
        const batteryCost = batterySize * 1000;
        // Calculate system cost: (solarSize * salesRedline) + batteryCost + adderCosts + salesCommission
        const baseCost = (systemSize * salesRedline) + batteryCost + adderCosts + salesCommission;
        systemCostInput.value = baseCost.toFixed(2);

        systemCostHelpModal.style.display = "none";
        updateBuildSystemButtonState();
        updateCalculateButtonState();
    });
}

// ✅ Function to check if all required fields have values and enable/disable Calculate System button
function updateCalculateButtonState() {
    const calculateButton = document.getElementById("calculateButton");
    const currentConsumption = document.getElementById("currentConsumption")?.value.trim();
    const desiredProduction = document.getElementById("desiredProduction")?.value.trim();
    const fullAddress = document.getElementById("fullAddress")?.value.trim();
    const currentMonthlyAverageBill = document.getElementById("currentMonthlyAverageBill")?.value.trim();
    const systemCost = document.getElementById("systemCost")?.value.trim();
    const monthlyCost = document.getElementById("monthlyCost")?.value.trim();
    const salesCommission = document.getElementById("salesCommission")?.value.trim();

    const allFieldsFilled = 
        currentConsumption && 
        desiredProduction && 
        fullAddress && 
        currentMonthlyAverageBill && 
        systemCost && 
        monthlyCost && 
        salesCommission;

    if (calculateButton) {
        calculateButton.disabled = !allFieldsFilled;
        console.log("Calculate Button State:", !allFieldsFilled ? "Disabled" : "Enabled", {
            currentConsumption,
            desiredProduction,
            fullAddress,
            currentMonthlyAverageBill,
            systemCost,
            monthlyCost,
            salesCommission
        });
    } else {
        console.error("❌ Calculate button not found!");
    }
}

// ✅ Function to check if all required fields have values and enable/disable Build System button
function updateBuildSystemButtonState() {
    const buildSystemButton = document.getElementById("buildSystemButton");
    const currentConsumption = document.getElementById("currentConsumption")?.value.trim();
    const desiredProduction = document.getElementById("desiredProduction")?.value.trim();
    const fullAddress = document.getElementById("fullAddress")?.value.trim();
    const salesCommission = document.getElementById("salesCommission")?.value.trim();

    const allFieldsFilled = 
        currentConsumption && 
        desiredProduction && 
        fullAddress && 
        salesCommission;

    if (buildSystemButton) {
        buildSystemButton.disabled = !allFieldsFilled;
        // Only log if the state changes to reduce console noise
        if (buildSystemButton.disabled !== window.lastBuildSystemButtonState) {
            console.log("Build System Button State:", !allFieldsFilled ? "Disabled" : "Enabled", {
                currentConsumption,
                desiredProduction,
                fullAddress,
                salesCommission
            });
            window.lastBuildSystemButtonState = buildSystemButton.disabled;
        }
    } else {
        console.error("❌ Build System button not found!");
    }
}

// ✅ Initialize Autocomplete and Add Event Listeners on Page Load
document.addEventListener("DOMContentLoaded", function () {
    setupDropdown();
    setupConsumptionHelp();
    setupUtilityRateHelp();
    setupMonthlyBillHelp();
    setupBatteryHelp();
    setupCurrentMonthlyBillHelp();
    setupSystemCostHelp();

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

    const requiredFields = [
        "currentConsumption",
        "desiredProduction",
        "fullAddress",
        "currentMonthlyAverageBill",
        "systemCost",
        "monthlyCost",
        "salesCommission"
    ];

    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener("input", () => {
                updateBuildSystemButtonState();
                updateCalculateButtonState();
            });
            field.addEventListener("change", () => {
                updateBuildSystemButtonState();
                updateCalculateButtonState();
            });
        } else {
            console.error(`❌ Required field ${fieldId} not found!`);
        }
    });

    updateBuildSystemButtonState();
    updateCalculateButtonState();
});