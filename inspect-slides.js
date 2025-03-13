const { google } = require("googleapis");

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
        console.log(`Total slides in presentation: ${slidesData.length}`);

        const targetSlides = [3, 4]; // Slide 4 and Slide 5 (0-indexed)
        const targetElementIds = ["p4_i4", "p4_i7", "p5_i6", "p5_i8"]; // Elements to inspect

        for (const slideIndex of targetSlides) {
            if (slideIndex >= slidesData.length) {
                console.log(`Slide ${slideIndex + 1} does not exist in the presentation.`);
                continue;
            }
            const slide = slidesData[slideIndex];
            console.log(`Slide ${slideIndex + 1} ID: ${slide.objectId}`);
            console.log(`Slide ${slideIndex + 1} Page Elements (Targeted):`);

            if (!slide.pageElements) {
                console.log("No page elements found on this slide.");
                continue;
            }

            slide.pageElements.forEach((element) => {
                if (targetElementIds.includes(element.objectId)) {
                    console.log(`Element ID: ${element.objectId}`);
                    if (element.shape && element.shape.text) {
                        const textContent = element.shape.text.textElements
                            .map(te => te.textRun?.content)
                            .filter(content => content)
                            .join("");
                        console.log("Text Content:", textContent);

                        element.shape.text.textElements.forEach((textElement, teIndex) => {
                            if (textElement.textRun && textElement.textRun.style) {
                                console.log(`Text Element ${teIndex} Style:`, JSON.stringify(textElement.textRun.style, null, 2));
                            }
                        });
                    }
                }
            });
        }
    } catch (error) {
        console.error("Error inspecting slides:", error);
    }
}

inspectSlides();