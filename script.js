const backendUrl = "https://solar-calculator-zb73.onrender.com"; // ✅ Use Render backend

async function generatePresentation() {
    const currentConsumption = document.getElementById("currentConsumption").value;
    const desiredProduction = document.getElementById("desiredProduction").value;
    const monthlyBill = document.getElementById("monthlyBill").value;
    const panelDirection = document.getElementById("panelDirection").value;
    const batteryModifier = parseInt(document.getElementById("batteryModifier")?.value) || 0;
    const fullAddress = document.getElementById("fullAddress").value.trim();
    const resultsDiv = document.getElementById("results");
    const downloadLinkDiv = document.getElementById("downloadLink");

    resultsDiv.innerHTML = "<p>Loading...</p>";
    downloadLinkDiv.innerHTML = "";

    if (!currentConsumption || isNaN(currentConsumption) || currentConsumption <= 0) {
        resultsDiv.innerHTML = `<p style="color: red;">Please enter a valid current annual consumption.</p>`;
        return;
    }
    if (!desiredProduction || isNaN(desiredProduction) || desiredProduction <= 0) {
        resultsDiv.innerHTML = `<p style="color: red;">Please enter a valid desired production.</p>`;
        return;
    }
    if (!monthlyBill || isNaN(monthlyBill) || monthlyBill <= 0) {
        resultsDiv.innerHTML = `<p style="color: red;">Please enter a valid current monthly bill.</p>`;
        return;
    }
    if (!fullAddress) {
        resultsDiv.innerHTML = `<p style="color: red;">Please enter a valid address.</p>`;
        return;
    }

    try {
        const response = await fetch(`${backendUrl}/api/process`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentConsumption, desiredProduction, panelDirection, batteryModifier, fullAddress, monthlyBill })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Server error");
        }

        const result = await response.json();
        console.log("✅ Server Response:", result);

        resultsDiv.innerHTML = `
            <h3>Your Solar System Details:</h3>
            <p>Solar System Size: ${result.params.solarSize} kW</p>
            <p>Battery Size: ${result.params.batterySize}</p>
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
        console.error("❌ Error:", error);
        resultsDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        downloadLinkDiv.innerHTML = "";
    }
}
