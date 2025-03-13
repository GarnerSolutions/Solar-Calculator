import express from "express";
import cors from "cors";
import { google } from "googleapis";
import fetch from "node-fetch"; // Ensure correct import

const app = express();
app.use(express.json());
app.use(cors());

const NREL_API_KEY = "7lN93S5iLnZyNHBsYFGEtvjz2efd2VcRRSj98ETU"; // Your API key

/** ✅ Corrected API Endpoint for Frontend Requests */
app.post("/api/process", async (req, res) => {
    const { kwhPerMonth, panelDirection, batteryModifier, city, state } = req.body;

    console.log("🔍 Received batteryModifier:", batteryModifier);

    try {
        if (!kwhPerMonth || isNaN(kwhPerMonth) || kwhPerMonth <= 0) {
            return res.status(400).json({ error: "Invalid kWh per month." });
        }
        if (!city || !state) {
            return res.status(400).json({ error: "City and state are required." });
        }

        const solarIrradiance = await getSolarIrradiance(city, state);
        if (!solarIrradiance) {
            return res.status(400).json({ error: "Could not retrieve solar data." });
        }

        const solarSize = calculateSolarSize(kwhPerMonth, solarIrradiance, panelDirection);
        const params = calculateSystemParams(solarSize, solarIrradiance, batteryModifier);

        console.log("✅ Final System Parameters:", params);

        const pptUrl = await generatePowerPoint(params);

        res.json({ pptUrl, params });
    } catch (error) {
        console.error("❌ Server Error:", error);
        res.status(500).json({ error: `Failed to process the request: ${error.message}` });
    }
});

/** ✅ Updated Solar Irradiance Fetching Function */
async function getSolarIrradiance(city, state) {
    try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&country=US&language=en&format=json`;
        console.log("Fetching coordinates from:", geoUrl);

        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            console.warn("❌ Location not found, using default coordinates.");
            return 5.5;
        }

        const { latitude, longitude } = geoData.results[0];
        console.log(`✅ Found coordinates: Lat ${latitude}, Lon ${longitude}`);

        const nrelUrl = `https://developer.nrel.gov/api/pvwatts/v6.json?api_key=${NREL_API_KEY}&lat=${latitude}&lon=${longitude}&system_capacity=1&module_type=1&losses=14&array_type=1&tilt=20&azimuth=180`;

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
        return 6.02;
    }
}

/** ✅ Fixed Efficiency Adjustments for Different Panel Directions */
function calculateSolarSize(kwhPerMonth, solarIrradiance, panelDirection) {
    let adjustmentFactor = {
        "S": 1.0, "SE": 0.90, "SW": 0.90,  
        "E": 0.80, "W": 0.80,
        "NE": 0.70, "NW": 0.70,
        "N": 0.60, "MIX": 0.85
    }[panelDirection] || 1.0;

    const kwhPerDay = (kwhPerMonth / 30) * 1.07;  // ✅ 7% extra generation target
    return kwhPerDay / (solarIrradiance * 0.85 * adjustmentFactor * 0.78);  
}

/** ✅ Fixed Floating Point Precision Issues */
function calculateSystemParams(solarSize, solarIrradiance, batteryModifier = 0) {
    batteryModifier = isNaN(parseInt(batteryModifier)) ? 0 : parseInt(batteryModifier);

    let batterySize = Math.ceil((solarSize * 1.70) / 16) * 16;
    batterySize += batteryModifier * 16;
    batterySize = Math.max(16, batterySize);

    const panelCount = Math.ceil(solarSize / 0.35);
    solarSize = parseFloat(solarSize.toFixed(1));

    const systemCost = Math.round(solarSize * 2000);
    const batteryCost = Math.round(batterySize * 1000);
    const totalCost = systemCost + batteryCost;

    const performanceRatio = 0.78;
    const estimatedAnnualProduction = Math.round(solarSize * solarIrradiance * 365 * performanceRatio);

    return {
        solarSize: solarSize.toFixed(1),
        batterySize: batterySize.toFixed(0),
        panelCount,
        systemCost: systemCost.toFixed(0),
        batteryCost: batteryCost.toFixed(0),
        totalCost: totalCost.toFixed(0),
        estimatedAnnualProduction: estimatedAnnualProduction.toFixed(0)
    };
}

/** ✅ Updated Google Slides Integration */
async function generatePowerPoint(params) {
    try {
        console.log("📊 Updating Google Slides with:", params);

        const auth = new google.auth.GoogleAuth({
            keyFile: "credentials.json",
            scopes: ["https://www.googleapis.com/auth/presentations"],
        });

        const slides = google.slides({ version: "v1", auth });
        const presentationId = "1tZF_Ax-e2BBeL3H7ZELy_rtzOUDwBjxFSoqQl13ygQc";

        console.log("🔄 Sending API request to update slides...");

        await slides.presentations.batchUpdate({
            presentationId: presentationId,
            requestBody: {
                requests: [
                    { deleteText: { objectId: "p4_i4", textRange: { type: "ALL" } } },
                    { insertText: { objectId: "p4_i4", text: `${params.solarSize} kW` } },
                    { deleteText: { objectId: "p4_i7", textRange: { type: "ALL" } } },
                    { insertText: { objectId: "p4_i7", text: `${params.batterySize} kW` } },
                    { deleteText: { objectId: "p5_i6", textRange: { type: "ALL" } } },
                    { insertText: { objectId: "p5_i6", text: `${params.solarSize} kW system size` } },
                    { deleteText: { objectId: "p5_i8", textRange: { type: "ALL" } } },
                    { insertText: { objectId: "p5_i8", text: `${params.panelCount} Jinko Solar panels` } },
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

/** ✅ Server is now running on Port 3000 */
app.listen(3000, () => console.log("🚀 Server running on port 3000"));
