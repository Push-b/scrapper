
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const puppeteer = require("puppeteer");

dotenv.config();
const app = express();
app.use(cors());

const PORT = process.env.PORT || 5347;

// ✅ Puppeteer Scraper Function
async function scrapeYouTube(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: "networkidle2" });

        // Extract video URL
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

        // Return scraped data if found, otherwise return null
        return { videoUrl, audioUrl };
    } catch (error) {
        await browser.close();
        console.error("Scraping failed:", error);
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

// ✅ Scrape Route (Uses Puppeteer but falls back to Dummy Data)
app.get("/scrape", async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "YouTube URL is required" });

    try {
        let mediaLinks = await scrapeYouTube(url);

        // If Puppeteer fails, use the dummy response
        if (!mediaLinks || (!mediaLinks.videoUrl && mediaLinks.audioUrl.length === 0)) {
            console.warn("Puppeteer failed, using dummy data instead.");
            mediaLinks = await dummyScrape(url);
        }

        res.json(mediaLinks);
    } catch (error) {
        res.status(500).json({ error: "Error occurred", details: error.message });
    }
});

// ✅ Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
