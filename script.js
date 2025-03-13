async function generatePresentation() {
    const kwhInput = document.getElementById("energyUsage").value;
    const kwhType = document.querySelector('input[name="kWhType"]:checked').value;
    const panelDirection = document.getElementById("panelDirection").value;
    const city = document.getElementById("city").value.trim();
    const state = document.getElementById("state").value.trim();
    const resultsDiv = document.getElementById("results");
    const downloadLinkDiv = document.getElementById("downloadLink");

    resultsDiv.innerHTML = "<p>Loading...</p>";
    downloadLinkDiv.innerHTML = "";

    if (!kwhInput || isNaN(kwhInput) || kwhInput <= 0) {
        resultsDiv.innerHTML = `<p style="color: red;">Please enter a valid number for kWh.</p>`;
        return;
    }
    if (!city || !state) {
        resultsDiv.innerHTML = `<p style="color: red;">Please enter a valid city and state.</p>`;
        return;
    }

    // Convert Annual kWh to Monthly if needed
    let kwhPerMonth = parseFloat(kwhInput);
    if (kwhType === "annual") {
        kwhPerMonth = kwhPerMonth / 12;
    }

    try {
        const response = await fetch("https://solar-calculator-zb73.onrender.com/api/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kwhPerMonth, panelDirection, city, state })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Server error");
        }

        const result = await response.json();
        resultsDiv.innerHTML = `
            <h3>Your Solar System Details:</h3>
            <p>Solar System Size: ${result.params.solarSize} kW</p>
            <p>Battery Size: ${result.params.batterySize} kW</p>
            <p>Number of Panels: ${result.params.panelCount}</p>
        `;

        downloadLinkDiv.innerHTML = `<a href="${result.pptUrl}" download>Download Your Presentation</a>`;
    } catch (error) {
        resultsDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        downloadLinkDiv.innerHTML = "";
    }
}

async function generatePresentation() {
    const kwhInput = document.getElementById("energyUsage").value;
    const kwhType = document.querySelector('input[name="kWhType"]:checked').value;
    const panelDirection = document.getElementById("panelDirection").value;
    const batteryModifier = parseInt(document.getElementById("batteryModifier").value) || 0;
    const city = document.getElementById("city").value.trim();
    const state = document.getElementById("state").value.trim();
    const resultsDiv = document.getElementById("results");
    const downloadLinkDiv = document.getElementById("downloadLink");

    resultsDiv.innerHTML = "<p>Loading...</p>";
    downloadLinkDiv.innerHTML = "";

    if (!kwhInput || isNaN(kwhInput) || kwhInput <= 0) {
        resultsDiv.innerHTML = `<p style="color: red;">Please enter a valid number for kWh.</p>`;
        return;
    }
    if (!city || !state) {
        resultsDiv.innerHTML = `<p style="color: red;">Please enter a valid city and state.</p>`;
        return;
    }

    let kwhPerMonth = parseFloat(kwhInput);
    if (kwhType === "annual") {
        kwhPerMonth = kwhPerMonth / 12;
    }

    try {
        const response = await fetch("https://solar-calculator-zb73.onrender.com/api/process", { // ✅ Correct API path
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kwhPerMonth, panelDirection, batteryModifier, city, state })
        });
    
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Server error");
        }
    
        const result = await response.json();
        resultsDiv.innerHTML = `
            <h3>Your Solar System Details:</h3>
            <p>Solar System Size: ${result.params.solarSize} kW</p>
            <p>Battery Size: ${result.params.batterySize} kW</p>
            <p>Number of Panels: ${result.params.panelCount}</p>
            <hr>
            <h3>Estimated Annual Production:</h3>
            <p><strong>${Number(result.params.estimatedAnnualProduction).toLocaleString()} kWh</strong></p>
            <hr>
            <h3>Pricing Breakdown:</h3>
            <p>Solar System Cost: <strong>$${Number(result.params.systemCost).toLocaleString()}</strong></p>
            <p>Battery Cost: <strong>$${Number(result.params.batteryCost).toLocaleString()}</strong></p>
            <p><strong>Total Cost: $${Number(result.params.totalCost).toLocaleString()}</strong></p>
        `;
    
        downloadLinkDiv.innerHTML = `<a href="${result.pptUrl}" download>Download Your Presentation</a>`;
    
    } catch (error) {
        resultsDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        downloadLinkDiv.innerHTML = "";
    }    
}
