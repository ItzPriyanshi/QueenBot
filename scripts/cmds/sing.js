const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const https = require('https');
const { createReadStream } = require("fs");

const API_KEY = "YOUR_KEY";

async function OutputUrl(url) {
  try {
    const payload = {
      filenamePattern: "pretty",
      isAudioOnly: true,
      url: url,
    };

    const response = await axios.post("https://cnvmp3.com/fetch.php", payload);
    const jsonData = response.data;
    const downloadUrl = jsonData.url;

    return downloadUrl;
  } catch (error) {
    console.error("Error in OutputUrl:", error);
    throw error;
  }
}

async function searchYouTubeVideo(query) {
  try {
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q: query,
          key: API_KEY,
          type: "video",
          maxResults: 1,
        },
      }
    );

    if (response.data.items && response.data.items.length > 0) {
      const video = response.data.items[0];
      const videoTitle = video.snippet.title;
      const videoId = video.id.videoId;
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

      return { title: videoTitle, url: videoUrl };
    } else {
      console.log("No videos found for your query.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching data from YouTube API:", error);
    return null;
  }
}


module.exports = {
  config: {
    name: "sing",
    aliases: ["music", "song"],
    version: "1.0.3",
    role: 0,
    author: "Shikaki | Base code: AceGun",
    cooldowns: 5,
    description: "Download music from Youtube",
    guide: { en: "{pn}music name" },
    category: "media",
  },

  onStart: async ({ event, message }) => {
    const input = event.body;
    const data = input.split(" ");

    if (data.length < 2) {
      return message.reply("Please specify a music name!");
    }

    data.shift();
    const musicName = data.join(" ");

    try {
      message.reply(`Searching music "${musicName}", please wait...`);

      const searchResult = await searchYouTubeVideo(musicName);

      if (!searchResult) {
        return message.reply("No music found.");
      }

      const musicUrl = searchResult.url;
      const musicTitle = searchResult.title;

      let downloadUrl;
      try {
        downloadUrl = await OutputUrl(musicUrl);
      } catch (error) {
        console.error(`Error processing ${musicUrl}:`, error);
        return message.reply("Sorry, an error occurred while processing the command.");
      }

      if (!downloadUrl) {
        return message.reply("No working music links found.");
      }

      const ytaudioDir = path.join(__dirname, '..', '..', 'ytaudio');
      fs.ensureDirSync(ytaudioDir);
      const fileName = `${Date.now()}.mp3`;
      const filePath = path.join(ytaudioDir, fileName);

      const file = fs.createWriteStream(filePath);
      https.get(downloadUrl, function(response) {
        response.pipe(file);
        file.on('finish', function() {
          file.close(() => {
            console.info("[DOWNLOADER] Downloaded");

            fs.stat(filePath, (err, stats) => {
              if (err) {
                console.error("[ERROR] File stat error:", err);
                message.reply("Sorry, an error occurred while processing the command.");
                fs.unlink(filePath, () => {});
                return;
              }

              if (stats.size > 26214400) {
                fs.unlink(filePath, () => {});
                message.reply("❌ | The file could not be sent because it is larger than 25MB.");
                return;
              }

              message.reply({
                body: `💁🏻‍♂ • Here's your music!\n\n♥ • Title: ${musicTitle}`,
                attachment: createReadStream(filePath),
              }, () => {
                fs.unlink(filePath, () => {});
              });
            });
          });
        });
      }).on('error', function(err) { 
        console.error("[ERROR]", err);
        message.reply("Sorry, an error occurred while processing the command.");
      });
    } catch (error) {
      console.error("[ERROR]", error);
      message.reply("Sorry, an error occurred while processing the command.");
    }
  },
};