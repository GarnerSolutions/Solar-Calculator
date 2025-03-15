import "dotenv/config";
import express from "express";
import cors from "cors";
import { google } from "googleapis";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const allowedOrigins = [
    "https://cool-yeot-0785e3.netlify.app", // Netlify Frontend
    "https://solar-calculator-zb73.onrender.com" // Render Backend
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
const nrelApiKey = process.env.NREL_API_KEY;

app.post("/api/process", async (req, res) => {
    try {
        const { currentConsumption, desiredProduction, panelDirection, batteryModifier, fullAddress, monthlyBill } = req.body;

        if (!currentConsumption || !desiredProduction || !fullAddress || !monthlyBill) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        const totalCost = calculateTotalCost(desiredProduction);
        const monthlyWithSolar = Math.round(totalCost / 225);

        const pptUrl = await generatePowerPoint({
            solarSize: desiredProduction,
            totalCost,
            monthlyWithSolar,
            monthlyBill
        });

        res.json({ pptUrl, params: { totalCost, monthlyWithSolar } });

    } catch (error) {
        console.error("❌ Server Error:", error);
        res.status(500).json({ error: error.message });
    }
});

function calculateTotalCost(desiredProduction) {
    return desiredProduction * 2000;
}

async function generatePowerPoint(params) {
    console.log("📊 Updating Google Slides:", params);
    return `https://docs.google.com/presentation/d/your-presentation-id/edit?usp=sharing`;
}

app.listen(3000, () => console.log("🚀 Server running on port 3000"));
