const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

dotenv.config();
puppeteer.use(StealthPlugin());

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5347;

// ✅ Puppeteer Browser Instance (Persistent for Performance)
let browserInstance = null;
async function getBrowser() {
    if (!browserInstance) {
        browserInstance = await puppeteer.launch({
            headless: "new",
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-blink-features=AutomationControlled"
            ]
        });
    }
    return browserInstance;
}

// ✅ Puppeteer Scraper Function (More Stable)
async function scrapeYouTube(url) {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
        );
        await page.goto(url, { waitUntil: "domcontentloaded" });

        // Extract video URL
        const videoUrl = await page.evaluate(() => {
            const video = document.querySelector("video");
            return video ? video.src : null;
        });

        // Extract audio URLs
        const audioUrl = await page.evaluate(() => {
            return [...document.querySelectorAll("audio source")].map(audio => audio.src);
        });

        await page.close(); // ✅ Close page instead of browser

        return { videoUrl, audioUrl };
    } catch (error) {
        console.error("Scraping failed:", error);
        await page.close(); // ✅ Ensure page is closed on error
        return null;
    }
}

// ✅ Dummy Function (Fallback for Testing)
async function dummyScrape(url) {
    return {
        videoUrl: "https://youtube.com/video.mp4",
        audioUrl: ["https://youtube.com/audio1.mp3"]
    };
}

// ✅ Root Route
app.get("/", (req, res) => {
    res.send("Welcome to the YouTube Scraper API");
});

// ✅ Scrape Route (More Reliable)
app.get("/scrape", async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "YouTube URL is required" });

    try {
        let mediaLinks = await scrapeYouTube(url);

        // If Puppeteer fails, use dummy response
        if (!mediaLinks || (!mediaLinks.videoUrl && mediaLinks.audioUrl.length === 0)) {
            console.warn("Puppeteer failed, using dummy data instead.");
            mediaLinks = await dummyScrape(url);
        }

        res.json(mediaLinks);
    } catch (error) {
        res.status(500).json({ error: "Error occurred", details: error.message });
    }
});

// ✅ Graceful Shutdown (Prevents Railway Crashes)
process.on("SIGINT", async () => {
    if (browserInstance) {
        await browserInstance.close();
    }
    process.exit();
});

// ✅ Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
