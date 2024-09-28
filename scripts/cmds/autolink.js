const axios = require("axios");
const fs = require("fs");

module.exports = {
    config: {
        name: 'autolink',
        version: '1.3',
        author: 'Priyanshi Kaur',
        countDown: 5,
        role: 0,
        shortDescription: 'Auto video downloader for multiple platforms',
        longDescription: 'Automatically downloads videos from various platforms when links are shared in the group',
        category: 'media',
        guide: {
            en: '{p}autolink [on/off]'
        }
    },

    onStart: async function ({ api, event, args }) {
        const threadID = event.threadID;
        const command = args[0]?.toLowerCase();

        if (command === 'on' || command === 'off') {
            this.setAutoLinkState(threadID, command);
            api.sendMessage(`✅ AutoLink is now turned ${command} for this chat.`, threadID);
        } else {
            api.sendMessage("❓ Usage: {p}autolink [on/off]", threadID);
        }
    },

    onChat: async function ({ api, event }) {
        const threadID = event.threadID;
        if (!this.getAutoLinkState(threadID)) return;

        const url = this.checkLink(event.body)?.url;
        if (!url) return;
        
        const apikey = "YOUR_API_KEY";
        
        try {
            const response = await axios.get(`https://for-devs.onrender.com/api/snapsave?url=${url}&apikey=${apikey}`);
            const videoUrl = response.data.data.medias[0].url;
            if (!videoUrl) throw new Error("No video URL found");

            const stream = await global.utils.getStreamFromURL(videoUrl);
            await api.sendMessage(
                { body: "Here Is Your Requested 🎥", attachment: stream },
                event.threadID
            );
        } catch (err) {
            console.error("Error downloading video:", err);
            let errorMessage = `❌ Error when trying to download the video: ${err.message}`;
            if (err.response) {
                errorMessage += `\nStatus: ${err.response.status}\nData: ${JSON.stringify(err.response.data)}`;
            }
            api.sendMessage(errorMessage, event.threadID, event.messageID);
        }
    },

    checkLink: function (text) {
        const supportedDomains = [
            '9gag', 'akilitv', 'bandcamp', 'bilibili', 'bitchute', 'blogger', 'blutv',
            'buzzfeed', 'capcut', 'chingari', 'dailymotion', 'douyin', 'espn', 'facebook',
            'febspot', 'flickr', 'ifunny', 'imdb', 'imgur', 'instagram', 'izlesene', 'kwai',
            'lemon8', 'likee', 'linkedin', 'loom', 'mashable', 'mastodon', 'medal', 'mixcloud',
            'moj', 'mxtakatak', 'ok.ru', 'pinterest', 'puhutv', 'reddit', 'rumble', 'sharechat',
            'snapchat', 'soundcloud', 'streamable', 'substack', 'ted', 'telegram', 'threads',
            'tiktok', 'tumblr', 'twitch', 'vimeo', 'vk', 'youtube', 'x'
        ];

        const urlRegex = new RegExp(`https?:\/\/(?:www\.)?(?:${supportedDomains.join('|')})\\.[a-z]{2,6}(?:[/?#][^\\s]*)?`, 'i');
        const match = text.match(urlRegex);
        return match ? { url: match[0] } : false;
    },

    getAutoLinkState: function (threadID) {
        const states = this.loadAutoLinkStates();
        return states[threadID] === 'on';
    },

    setAutoLinkState: function (threadID, state) {
        const states = this.loadAutoLinkStates();
        states[threadID] = state;
        this.saveAutoLinkStates(states);
    },

    loadAutoLinkStates: function () {
        try {
            const data = fs.readFileSync("autolink_states.json", "utf8");
            return JSON.parse(data);
        } catch (err) {
            return {};
        }
    },

    saveAutoLinkStates: function (states) {
        fs.writeFileSync("autolink_states.json", JSON.stringify(states, null, 2));
    }
};