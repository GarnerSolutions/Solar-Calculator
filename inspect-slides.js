import fs from "fs";
import { google } from "googleapis";

async function inspectSlides() {
    try {
        process.emitWarning = (warning, type, code) => {
            if (code === "DEP0040") return;
            console.warn(warning);
        };

        const auth = new google.auth.GoogleAuth({
            keyFile: "credentials.json",
            scopes: ["https://www.googleapis.com/auth/presentations"],
        });

        const slides = google.slides({ version: "v1", auth });

        const presentationId = "1tZF_Ax-e2BBeL3H7ZELy_rtzOUDwBjxFSoqQl13ygQc";
        const presentation = await slides.presentations.get({
            presentationId: presentationId,
        });

        const slidesData = presentation.data.slides;
        console.log(`📊 Total slides in presentation: ${slidesData.length}`);

        const inspectionResults = [];
        const textContents = [];

        for (let slideIndex = 0; slideIndex < slidesData.length; slideIndex++) {
            const slide = slidesData[slideIndex];
            const slideInfo = {
                slideNumber: slideIndex + 1,
                slideId: slide.objectId,
                elements: [],
            };
            console.log(`🖼 Slide ${slideIndex + 1} ID: ${slide.objectId}`);

            if (!slide.pageElements) {
                console.log("⚠️ No page elements found.");
                continue;
            }

            for (const element of slide.pageElements) {
                const elementId = element.objectId;
                let textContent = "";

                if (element.shape && element.shape.text) {
                    textContent = element.shape.text.textElements
                        .map(te => te.textRun?.content)
                        .filter(content => content)
                        .join("");
                }

                const elementInfo = {
                    elementId: elementId,
                    textContent: textContent,
                    styles: element.shape?.text?.textElements?.map(te => te.textRun?.style) || [],
                };

                slideInfo.elements.push(elementInfo);

                // Store text content separately for the second file
                if (textContent.trim()) {
                    textContents.push(`Slide ${slideIndex + 1}, Element ID: ${elementId}\n${textContent}\n`);
                }

                console.log(`🔹 Element ID: ${elementId}`);
                if (textContent.trim()) {
                    console.log(`📄 Text Content: ${textContent}`);
                }
            }

            inspectionResults.push(slideInfo);
        }

        // Ensure "inspect" folder exists
        if (!fs.existsSync("./inspect")) {
            fs.mkdirSync("./inspect", { recursive: true });
        }

        // Save full inspection data as JSON
        fs.writeFileSync("./inspect/slide_inspection.json", JSON.stringify(inspectionResults, null, 2), "utf8");
        console.log("✅ Full slide inspection data saved to: inspect/slide_inspection.json");

        // Save extracted text content as a simple text file
        fs.writeFileSync("./inspect/slide_text_content.txt", textContents.join("\n"), "utf8");
        console.log("✅ Slide text content saved to: inspect/slide_text_content.txt");

    } catch (error) {
        console.error("❌ Error inspecting slides:", error);
    }
}

inspectSlides();
