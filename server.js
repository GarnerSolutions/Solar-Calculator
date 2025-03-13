import express from "express";
import cors from "cors";
import { google } from "googleapis";
import fetch from "node-fetch"; // Change this!

const app = express();
app.use(express.json());
app.use(cors());

const NREL_API_KEY = "7lN93S5iLnZyNHBsYFGEtvjz2efd2VcRRSj98ETU"; // Get this from https://developer.nrel.gov/

app.post("/api/process", async (req, res) => {
    const { kwhPerMonth, panelDirection, batteryModifier, city, state } = req.body;

    console.log("🔍 Received batteryModifier:", batteryModifier);  // Debugging log

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

async function getSolarIrradiance(city, state) {
    try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&country=US&language=en&format=json`;
        console.log("Fetching coordinates from:", geoUrl);

        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            console.warn("❌ Location not found, using default coordinates.");
            return 5.5; // Default average solar irradiance
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

        return solarData.outputs.solrad_annual; // **Use the correct annual solar irradiance**
    } catch (error) {
        console.error("❌ Failed to fetch solar data:", error);
        return 6.02; // Default fallback
    }
}

function calculateSolarSize(kwhPerMonth, solarIrradiance, panelDirection) {
    // Efficiency adjustments (NORTH requires a LARGER system)
    let adjustmentFactor = {
        "S": 1.0,   // Best efficiency
        "SE": 0.95, "SW": 0.95,  
        "E": 0.85, "W": 0.85,    
        "NE": 0.75, "NW": 0.75,  
        "N": 0.65,   // Worst efficiency (needs largest system size)
        "MIX": 0.85  
    }[panelDirection] || 1.0; 

    const kwhPerDay = kwhPerMonth / 30;  
    return kwhPerDay / (solarIrradiance * 0.85 * adjustmentFactor); 
}

function calculateSystemParams(solarSize, solarIrradiance, batteryModifier = 0) {
    // Ensure batteryModifier is a valid number
    batteryModifier = isNaN(parseInt(batteryModifier)) ? 0 : parseInt(batteryModifier);

    // **Maintain a 1:1.70 ratio (Solar:Battery)**
    let batterySize = Math.ceil((solarSize * 1.70) / 16) * 16;  

    // **Apply battery modifier (each step is ±16 kW)**
    batterySize += batteryModifier * 16;

    // Ensure battery size does not drop below 16 kW
    batterySize = Math.max(16, batterySize);

    const panelCount = Math.ceil(solarSize / 0.35);

    // **Fix Floating Point Issues by Rounding Before Multiplication**
    solarSize = parseFloat(solarSize.toFixed(1)); // Round to 1 decimal place

    // **Correct Pricing Calculation**
    const systemCost = Math.round(solarSize * 2000);  // **Ensures a clean, even number**
    const batteryCost = Math.round(batterySize * 1000);  
    const totalCost = systemCost + batteryCost; 

    // **Performance Ratio (~78%) for real-world conditions**
    const performanceRatio = 0.78;  

    // **Corrected Estimated Annual Production**
    const estimatedAnnualProduction = Math.round(solarSize * solarIrradiance * 365 * performanceRatio);

    return {
        solarSize: solarSize.toFixed(1),
        batterySize: batterySize.toFixed(0),
        panelCount,
        systemCost: systemCost.toFixed(0),  // **Ensures even number**
        batteryCost: batteryCost.toFixed(0),
        totalCost: totalCost.toFixed(0),
        estimatedAnnualProduction: estimatedAnnualProduction.toFixed(0)
    };
}

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


app.listen(3000, () => console.log("Server running on port 3000"));
