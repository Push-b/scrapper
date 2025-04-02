const express = require("express");
const ytdl = require("@distube/ytdl-core");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/download", async (req, res) => {
    const videoURL = req.query.url;
    const format = req.query.format || "mp3"; // mp3 or mp4

    if (!videoURL) return res.status(400).send("Please provide a YouTube URL!");

    try {
        const info = await ytdl.getInfo(videoURL);
        const formatOption = format === "mp3" ? "audioonly" : "videoandaudio";
        const stream = ytdl(videoURL, { quality: formatOption });

        res.header("Content-Disposition", `attachment; filename="${info.videoDetails.title}.${format}"`);
        stream.pipe(res);
    } catch (error) {
        res.status(500).send("Error fetching video: " + error.message);
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
