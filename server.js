// 🌍 Load environment variables from .env FIRST
import "dotenv/config";

// ✅ Import dependencies
import express from "express";
import cors from "cors";
import { google } from "googleapis";
import fetch from "node-fetch"; // Ensure correct import

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://127.0.0.1:5500" })); // ✅ Allow Live Server frontend

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
const googlePlacesApiKey = process.env.GOOGLE_MAPS_API_KEY; // New Places API Key
const nrelApiKey = process.env.NREL_API_KEY;
const performanceRatio = 0.70; // Adjust to fine-tune production estimates

console.log("🔑 GOOGLE_MAPS_API_KEY:", googleMapsApiKey ? "Loaded ✅" : "❌ NOT FOUND");
console.log("🔑 GOOGLE_PLACES_API_KEY:", googlePlacesApiKey ? "Loaded ✅" : "❌ NOT FOUND");
console.log("🔑 NREL_API_KEY:", nrelApiKey ? "Loaded ✅" : "❌ NOT FOUND");

// ✅ Provide the Google Maps API Key Securely to the Frontend
app.get("/api/getGoogleMapsApiKey", (req, res) => {
    if (!googleMapsApiKey) {
        return res.status(500).json({ error: "Google Maps API Key not found" });
    }
    res.json({ apiKey: googleMapsApiKey });
});

// ✅ Corrected API Endpoint for Frontend Requests
app.post("/api/process", async (req, res) => {
    const { desiredProduction, panelDirection, batteryModifier, fullAddress } = req.body;

    console.log("🔍 Received Address:", fullAddress);

    try {
        if (!desiredProduction || isNaN(desiredProduction) || desiredProduction <= 0) {
            return res.status(400).json({ error: "Invalid desired annual kWh production." });
        }        
        if (!fullAddress) {
            return res.status(400).json({ error: "Full address is required." });
        }

        // ✅ Convert Address to Lat/Lon
        const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${googleMapsApiKey}`;
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();

        if (geoData.status !== "OK") {
            return res.status(400).json({ error: "Invalid address. Please enter a valid one." });
        }

        const { lat, lng } = geoData.results[0].geometry.location;
        console.log(`✅ Address Geocoded: ${lat}, ${lng}`);

        // ✅ Proceed with Solar Calculations
        const solarIrradiance = await getSolarIrradiance(lat, lng);
        if (!solarIrradiance) {
            return res.status(400).json({ error: "Could not retrieve solar data." });
        }

        const solarSize = calculateSolarSize(desiredProduction, solarIrradiance, panelDirection);
        const params = calculateSystemParams(solarSize, solarIrradiance, batteryModifier);

        console.log("✅ Final System Parameters:", params);

        const pptUrl = await generatePowerPoint(params);

        res.json({ pptUrl, params });
    } catch (error) {
        console.error("❌ Server Error:", error);
        res.status(500).json({ error: `Failed to process the request: ${error.message}` });
    }
});
// ✅ New Route to Handle Places API Autocomplete Requests
app.post("/api/getPlacesAutocomplete", async (req, res) => {
    const { input } = req.body;

    if (!input) {
        return res.status(400).json({ error: "Missing search input" });
    }

    try {
        const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${googlePlacesApiKey}`, // 🔑 Secure Token
            },
            body: JSON.stringify({
                input: input,
                locationBias: {
                    circle: {
                        center: { latitude: 36.82523, longitude: -119.70292 }, // Adjust for region biasing
                        radius: 50000,
                    },
                },
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || "Failed to fetch autocomplete suggestions");
        }

        res.json({ predictions: data.predictions || [] });
    } catch (error) {
        console.error("❌ Places API Error:", error);
        res.status(500).json({ error: error.message });
    }
});
async function getSolarIrradiance(lat, lng) {
    try {
        const nrelUrl = `https://developer.nrel.gov/api/pvwatts/v6.json?api_key=${nrelApiKey}&lat=${lat}&lon=${lng}&system_capacity=1&module_type=1&losses=14&array_type=1&tilt=20&azimuth=180`;
        
        console.log("Fetching solar data from:", nrelUrl);
        const solarResponse = await fetch(nrelUrl);
        const solarData = await solarResponse.json();

        console.log("🌞 NREL API Response:", JSON.stringify(solarData, null, 2));

        if (!solarData.outputs?.solrad_annual) {
            console.warn("⚠️ No annual solar data found, using default irradiance of 6.02");
            return 6.02;
        }

        return solarData.outputs.solrad_annual;
    } catch (error) {
        console.error("❌ Failed to fetch solar data:", error);
        return 6.02; // Default irradiance
    }
}

function calculateSystemParams(solarSize, solarIrradiance, batteryModifier = 0) {
    batteryModifier = isNaN(parseInt(batteryModifier)) ? 0 : parseInt(batteryModifier);

    let batterySize = Math.ceil((solarSize * 1.70) / 16) * 16;  
    batterySize += batteryModifier * 16;
    batterySize = Math.max(16, batterySize);

    const panelCount = Math.ceil(solarSize / 0.44);
    const systemCost = Math.round(solarSize * 2000);
    const batteryCost = Math.round(batterySize * 1000);
    const totalCost = systemCost + batteryCost;

    const batteryCount = batterySize / 16;
    const estimatedAnnualProduction = Math.round(solarSize * solarIrradiance * 365 * performanceRatio);

    return {
        solarSize: solarSize.toFixed(1),
        batterySize: `${batterySize} kWh (${batteryCount}x 16 kWh)`,
        panelCount,
        systemCost: systemCost.toFixed(0),
        batteryCost: batteryCost.toFixed(0),
        totalCost: totalCost.toFixed(0),
        estimatedAnnualProduction: estimatedAnnualProduction.toFixed(0)
    };
}

function calculateSolarSize(desiredProduction, solarIrradiance, panelDirection) {
    const adjustmentFactor = {
        "S": 1.0, "SE": 0.90, "SW": 0.90,
        "E": 0.80, "W": 0.80,
        "NE": 0.70, "NW": 0.70,
        "N": 0.60, "MIX": 0.85
    }[panelDirection] || 1.0;

    let solarSize = desiredProduction / (solarIrradiance * 365 * performanceRatio * adjustmentFactor);

    console.log(`⚡ Debug: Desired Production = ${desiredProduction}, Solar Irradiance = ${solarIrradiance}, Performance Ratio = ${performanceRatio}`);
    console.log(`⚡ Debug: Calculated Solar Size = ${solarSize.toFixed(2)} kW`);

    return solarSize;
}

async function generatePowerPoint(params) {
    try {
        console.log("📊 Updating Google Slides with:", params);

        const auth = new google.auth.GoogleAuth({
            keyFile: "credentials.json",
            scopes: ["https://www.googleapis.com/auth/presentations"],
        });

        const slides = google.slides({ version: "v1", auth });
        const presentationId = "1tZF_Ax-e2BBeL3H7ZELy_rtzOUDwBjxFSoqQl13ygQc";  // Change this to your actual Google Slides ID

        console.log("🔄 Sending API request to update slides...");

        await slides.presentations.batchUpdate({
            presentationId: presentationId,
            requestBody: {
                requests: [
                    { deleteText: { objectId: "p4_i4", textRange: { type: "ALL" } } },
                    { insertText: { objectId: "p4_i4", text: `${params.solarSize} kW` } },
                    { deleteText: { objectId: "p4_i7", textRange: { type: "ALL" } } },
                    { insertText: { objectId: "p4_i7", text: `${params.batterySize}` } },
                ],
            },
        });

        console.log("✅ Google Slides updated successfully!");
        return `https://docs.google.com/presentation/d/${presentationId}/edit?usp=sharing`;
    } catch (error) {
        console.error("❌ Google Slides Error:", error);
        throw new Error("Failed to generate PowerPoint");
    }
}

// ✅ Start the Server
app.listen(3000, () => console.log("🚀 Server running on port 3000"));
