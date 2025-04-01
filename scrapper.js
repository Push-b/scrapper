const puppeteer = require("puppeteer");

async function scrapeYouTube(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: "networkidle2" });

        // Extract video URLs
        const videoUrl = await page.evaluate(() => {
            const video = document.querySelector("video");
            return video ? video.src : null;
        });

        // Extract audio URLs
        const audioUrl = await page.evaluate(() => {
            const audioTracks = document.querySelectorAll("audio source");
            return Array.from(audioTracks).map(audio => audio.src);
        });

        await browser.close();
        return { videoUrl, audioUrl };
    } catch (error) {
        await browser.close();
        console.error("Scraping failed:", error);
        return null;
    }
}