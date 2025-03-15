// 🌍 Load environment variables from .env FIRST
import "dotenv/config";

// ✅ Import dependencies
import express from "express";
import cors from "cors";
import { google } from "googleapis";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const tempDir = path.join(__dirname, "temp");

// ✅ Ensure the temp directory exists before saving files
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log("📂 Created missing temp directory:", tempDir);
}

console.log(tempDir); // Use tempDir as needed
// ✅ Initialize Express App First
const app = express();
app.use(express.json());

// ✅ Define Allowed Origins
const allowedOrigins = [
    "https://cool-yeot-0785e3.netlify.app",  // ✅ Netlify Frontend
    "https://solar-calculator-zb73.onrender.com",  // ✅ Render Backend
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.error("❌ CORS Blocked Request from:", origin);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));

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

// Helper function to convert a stream to a buffer
async function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
        stream.on("error", reject);
    });
}

// ✅ Corrected API Endpoint for Frontend Requests
app.post("/api/process", async (req, res) => {
    try {
        console.log("🔍 Received Request Body:", req.body); // Debugging incoming request

        const { desiredProduction, currentConsumption, panelDirection, batteryModifier, fullAddress, currentMonthlyAverageBill } = req.body;

        // ✅ Basic Validations
        if (!desiredProduction || isNaN(desiredProduction) || desiredProduction <= 0) {
            return res.status(400).json({ error: "Invalid desired annual kWh production." });
        }
        if (!currentConsumption || isNaN(currentConsumption) || currentConsumption <= 0) {
            return res.status(400).json({ error: "Invalid current annual kWh consumption." });
        }
        if (!currentMonthlyAverageBill || isNaN(currentMonthlyAverageBill) || currentMonthlyAverageBill <= 0) {
            return res.status(400).json({ error: "Invalid current monthly average bill." });
        }
        if (!fullAddress) {
            return res.status(400).json({ error: "Full address is required." });
        }
        if (!googleMapsApiKey) {
            return res.status(500).json({ error: "Google Maps API Key is missing." });
        }

        // ✅ Convert Address to Lat/Lon
        const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${googleMapsApiKey}`;
        console.log("📡 Fetching Geocoding Data:", geoUrl);

        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0 || geoData.status !== "OK") {
            console.warn("⚠️ Invalid or Unrecognized Address.");
            return res.status(400).json({ error: "Invalid address. Please enter a valid one." });
        }

        const { lat, lng } = geoData.results[0].geometry.location;
        console.log(`✅ Address Geocoded: Lat ${lat}, Lon ${lng}`);

        // ✅ Get Solar Irradiance
        const solarIrradiance = await getSolarIrradiance(lat, lng);
        if (!solarIrradiance) {
            return res.status(400).json({ error: "Could not retrieve solar data." });
        }

        // ✅ Calculate Solar System Size
        const solarSize = calculateSolarSize(desiredProduction, solarIrradiance, panelDirection);
        console.log(`🔢 Calculated Solar System Size: ${solarSize.toFixed(2)} kW`);

        // ✅ Calculate System Parameters, including Energy Offset
        const params = calculateSystemParams(solarSize, solarIrradiance, batteryModifier, currentConsumption, desiredProduction, currentMonthlyAverageBill);
        console.log("✅ Final System Parameters:", params);

        // ✅ Generate PowerPoint
        const pptUrl = await generatePowerPoint(params);
        console.log("📄 PowerPoint URL:", pptUrl);

        // Initialize Google Drive API for PDF export
        const auth = new google.auth.GoogleAuth({
            keyFile: "credentials.json",
            scopes: ["https://www.googleapis.com/auth/drive.readonly"],
        });
        const drive = google.drive({ version: "v3", auth });
        const presentationId = "1tZF_Ax-e2BBeL3H7ZELy_rtzOUDwBjxFSoqQl13ygQc";

        const pdfResponse = await drive.files.export({
            fileId: presentationId,
            mimeType: "application/pdf",
        }, { responseType: "arraybuffer" }); // ✅ Ensures we get a buffer
        
        const pdfBuffer = Buffer.from(pdfResponse.data); // ✅ Convert the arraybuffer to a buffer
        
        // Save the PDF to a temporary file
        const fileId = uuidv4();
        const pdfPath = path.join(tempDir, `${fileId}.pdf`);
        await fs.promises.writeFile(pdfPath, pdfBuffer);
        fs.access(pdfPath, fs.constants.F_OK, (err) => {
            if (err) {
                console.error("❌ PDF file not found:", pdfPath);
            } else {
                console.log("✅ PDF successfully saved:", pdfPath);
            }
        });
        

        // Construct the full PDF download URL
        const pdfUrl = `${req.protocol}://${req.get("host")}/download/pdf?fileId=${fileId}`;

        // Send response with both URLs (optional pptUrl for flexibility)
        res.json({ pptUrl, pdfUrl, params });
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

// New endpoint to serve the PDF file
app.get("/download/pdf", (req, res) => {
    const fileId = req.query.fileId;
    if (!fileId) {
        return res.status(400).send("Missing fileId");
    }
    const pdfPath = path.join(tempDir, `${fileId}.pdf`);
    if (!fs.existsSync(pdfPath)) {
        return res.status(404).send("File not found");
    }

    // Send the file for download and clean up afterward
    res.download(pdfPath, "presentation.pdf", (err) => {
        if (err) {
            console.error("Error downloading file:", err);
        }
        fs.unlink(pdfPath, (err) => {
            if (err) console.error("Error deleting file:", err);
        });
    });
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

function calculateSystemParams(solarSize, solarIrradiance, batteryModifier, currentConsumption, desiredProduction, currentMonthlyAverageBill) {
    batteryModifier = isNaN(parseInt(batteryModifier)) ? 0 : parseInt(batteryModifier);

    let batterySize = Math.ceil((solarSize * 1.70) / 16) * 16;  
    batterySize += batteryModifier * 16;
    batterySize = Math.max(16, batterySize);

    const panelCount = Math.ceil(solarSize / 0.44);
    const systemCost = Math.round(solarSize * 2000);
    const batteryCost = Math.round(batterySize * 1000);
    const totalCost = systemCost + batteryCost;

    const estimatedAnnualProduction = Math.round(solarSize * solarIrradiance * 365 * 0.70);

    // ✅ Fix: Ensure `currentConsumption` is valid before division
    let energyOffset = "N/A";
    if (!isNaN(currentConsumption) && currentConsumption > 0) {
        energyOffset = ((desiredProduction / currentConsumption) * 100).toFixed(1) + "%";
    }

    return {
        solarSize: solarSize.toFixed(1),
        batterySize: `${batterySize} kWh (${batterySize / 16}x 16 kWh)`,
        panelCount,
        systemCost: systemCost.toFixed(0),
        batteryCost: batteryCost.toFixed(0),
        totalCost: totalCost.toFixed(0),
        currentMonthlyBill: currentMonthlyAverageBill,
        monthlyWithSolar: Math.round(totalCost / 300),
        estimatedAnnualProduction,
        energyOffset
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
        const presentationId = "1tZF_Ax-e2BBeL3H7ZELy_rtzOUDwBjxFSoqQl13ygQc";

        console.log("🔄 Sending API request to update slides...");

        await slides.presentations.batchUpdate({
            presentationId: presentationId,
            requestBody: {
                requests: [
                    // ✅ Update Slide 4
                    { deleteText: { objectId: "p4_i4", textRange: { type: "ALL" } } },
                    { insertText: { objectId: "p4_i4", text: `${params.solarSize} kW` } },
                    { updateTextStyle: {
                        objectId: "p4_i4",
                        textRange: { type: "ALL" },
                        style: {
                            bold: true,
                            fontFamily: "Comfortaa",
                            fontSize: { magnitude: 51, unit: "PT" },
                            foregroundColor: { opaqueColor: { rgbColor: { red: 0.843, green: 0.831, blue: 0.8 } } }
                        },
                        fields: "bold,fontFamily,fontSize,foregroundColor"
                    }},
                    
                    { deleteText: { objectId: "p4_i7", textRange: { type: "ALL" } } },
                    { insertText: { objectId: "p4_i7", text: `${params.batterySize}` } },
                    { updateTextStyle: {
                        objectId: "p4_i7",
                        textRange: { type: "ALL" },
                        style: {
                            bold: true,
                            fontFamily: "Comfortaa",
                            fontSize: { magnitude: 51, unit: "PT" },
                            foregroundColor: { opaqueColor: { rgbColor: { red: 0.843, green: 0.831, blue: 0.8 } } }
                        },
                        fields: "bold,fontFamily,fontSize,foregroundColor"
                    }},

                    { deleteText: { objectId: "p4_i10", textRange: { type: "ALL" } } },
                    { insertText: { objectId: "p4_i10", text: `$${Number(params.totalCost).toLocaleString()}` } },
                    { updateTextStyle: {
                        objectId: "p4_i10",
                        textRange: { type: "ALL" },
                        style: {
                            bold: true,
                            fontFamily: "Comfortaa",
                            fontSize: { magnitude: 51, unit: "PT" },
                            foregroundColor: { opaqueColor: { rgbColor: { red: 0.843, green: 0.831, blue: 0.8 } } }
                        },
                        fields: "bold,fontFamily,fontSize,foregroundColor"
                    }},
                    
                    // ✅ Update Slide 5
                    { deleteText: { objectId: "p5_i6", textRange: { type: "ALL" } } },
                    { insertText: { objectId: "p5_i6", text: `${params.solarSize} kW system size` } },
                    { updateTextStyle: {
                        objectId: "p5_i6",
                        textRange: { type: "ALL" },
                        style: {
                            bold: false,
                            fontFamily: "Raleway",
                            fontSize: { magnitude: 19, unit: "PT" },
                            foregroundColor: { opaqueColor: { rgbColor: { red: 0.843, green: 0.831, blue: 0.8 } } }
                        },
                        fields: "bold,fontFamily,fontSize,foregroundColor"
                    }},
        
                    { deleteText: { objectId: "p5_i7", textRange: { type: "ALL" } } },
                    { insertText: { objectId: "p5_i7", text: `${params.energyOffset} Energy Offset` } },
                    { updateTextStyle: {
                        objectId: "p5_i7",
                        textRange: { type: "ALL" },
                        style: {
                            bold: false,
                            fontFamily: "Raleway",
                            fontSize: { magnitude: 19, unit: "PT" },
                            foregroundColor: { opaqueColor: { rgbColor: { red: 0.843, green: 0.831, blue: 0.8 } } }
                        },
                        fields: "bold,fontFamily,fontSize,foregroundColor"
                    }},
        
                    { deleteText: { objectId: "p5_i8", textRange: { type: "ALL" } } },
                    { insertText: { objectId: "p5_i8", text: `${params.panelCount} Jinko Solar panels` } },
                    { updateTextStyle: {
                        objectId: "p5_i8",
                        textRange: { type: "ALL" },
                        style: {
                            bold: false,
                            fontFamily: "Raleway",
                            fontSize: { magnitude: 19, unit: "PT" },
                            foregroundColor: { opaqueColor: { rgbColor: { red: 0.843, green: 0.831, blue: 0.8 } } }
                        },
                        fields: "bold,fontFamily,fontSize,foregroundColor"
                    }},
        
                    // ✅ Update Slide 6 (p6_i5 - Monthly With Solar)
                    { deleteText: { objectId: "p6_i5", textRange: { type: "ALL" } } },
                    { insertText: { objectId: "p6_i5", text: `$${params.monthlyWithSolar}` } },
                    { updateTextStyle: {
                        objectId: "p6_i5",
                        textRange: { type: "ALL" },
                        style: {
                            bold: true,
                            fontFamily: "Comfortaa",
                            fontSize: { magnitude: 21.5, unit: "PT" },
                            foregroundColor: { opaqueColor: { rgbColor: { red: 0.843, green: 0.831, blue: 0.8 } } }
                        },
                        fields: "bold,fontFamily,fontSize,foregroundColor"
                    }},
        
                    // ✅ Update Slide 6 (p6_i10 - Current Monthly Bill)
                    { deleteText: { objectId: "p6_i10", textRange: { type: "ALL" } } },
                    { insertText: { objectId: "p6_i10", text: `$${params.currentMonthlyBill}` } },
                    { updateTextStyle: {
                        objectId: "p6_i10",
                        textRange: { type: "ALL" },
                        style: {
                            bold: true,
                            fontFamily: "Comfortaa",
                            fontSize: { magnitude: 21.5, unit: "PT" },
                            foregroundColor: { opaqueColor: { rgbColor: { red: 0.843, green: 0.831, blue: 0.8 } } }
                        },
                        fields: "bold,fontFamily,fontSize,foregroundColor"
                    }}
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