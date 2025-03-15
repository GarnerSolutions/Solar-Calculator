// 🌍 Switch between local and live backend by commenting/uncommenting the correct line:
const apiUrl = "http://localhost:3000/api/process";  // 🔧 Use for LOCAL TESTING
// const apiUrl = "https://solar-calculator-zb73.onrender.com/api/process";  // 🌍 Use for LIVE SERVER

const backendUrl = "http://localhost:3000";

let googleMapsApiKey = "";

// ✅ Fetch Google Maps API Key from Backend
async function loadGoogleMapsApiKey() {
    try {
        const response = await fetch(`${backendUrl}/api/getGoogleMapsApiKey`);
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json();
        if (!data.apiKey) throw new Error("Google Maps API Key not found.");

        googleMapsApiKey = data.apiKey;
        console.log("✅ Google Maps API Key Loaded:", googleMapsApiKey);
    } catch (error) {
        console.error("❌ Failed to load API Key:", error);
    }
}

// ✅ Call this function when the page loads
loadGoogleMapsApiKey();

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

// ✅ Initialize Autocomplete on Page Load
window.onload = function () {
    loadGoogleMapsApiKey().then(() => {
        initializeAutocomplete();
    });
};

// ✅ Fetch Data and Generate Presentation
async function generatePresentation() {
    const desiredProduction = document.getElementById("desiredProduction")?.value;
    const panelDirection = document.getElementById("panelDirection")?.value;
    const batteryModifier = parseInt(document.getElementById("batteryModifier")?.value) || 0;
    const fullAddress = document.getElementById("fullAddress")?.value.trim();
    const resultsDiv = document.getElementById("results");
    const downloadLinkDiv = document.getElementById("downloadLink");

    resultsDiv.innerHTML = "<p>Loading...</p>";
    downloadLinkDiv.innerHTML = "";

    if (!desiredProduction || isNaN(desiredProduction) || desiredProduction <= 0) {
        resultsDiv.innerHTML = `<p style="color: red;">Please enter a valid desired annual kWh production.</p>`;
        return;
    }
    if (!fullAddress) {
        resultsDiv.innerHTML = `<p style="color: red;">Please enter a valid address.</p>`;
        return;
    }

    try {
        console.log(`🚀 Sending request to: ${apiUrl}`);
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ desiredProduction, panelDirection, batteryModifier, fullAddress })
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
