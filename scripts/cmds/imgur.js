const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const IMGUR_CLIENT_ID = "5ba5e80cd3433a7";

module.exports = {
  config: {
    name: "imgur",
    version: "1.1",
    author: "Priyanshi Kaur",
    countDown: 1,
    role: 0,
    longDescription: "Upload image to Imgur and get the link",
    category: "utility",
    guide: {
      en: "${pn} reply to an image"
    }
  },

  onStart: async function ({ message, api, event }) {
    // Get the image URL from the replied message
    const imageUrl = event.messageReply?.attachments[0]?.url;

    if (!imageUrl) {
      return message.reply('⚠️ Please reply to an image to upload it to Imgur.');
    }

    // React with a waiting emoji
    api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

    try {
      // Download the image to a temporary path
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const tempImagePath = path.join(__dirname, 'temp_image.jpg');
      fs.writeFileSync(tempImagePath, imageResponse.data);

      // Prepare the image file for upload to Imgur
      const formData = new FormData();
      formData.append('image', fs.createReadStream(tempImagePath));

      // Send the request to Imgur
      const imgurResponse = await axios.post('https://api.imgur.com/3/upload', formData, {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Client-ID ${IMGUR_CLIENT_ID}`
        }
      });

      // Get the Imgur URL from the response
      const imgurLink = imgurResponse.data.data.link;

      // Remove the temporary image file
      fs.unlinkSync(tempImagePath);

      // Edit the original waiting message with the Imgur link and react with a success emoji
      api.sendMessage('✅ Successfully Uploaded.:\n' + imgurLink, event.threadID, async () => {
        await api.setMessageReaction("✅", event.messageID, (err) => {}, true);
      });

    } catch (error) {
      console.error('Imgur upload failed:', error);
      await message.reply('❌ Oops! Something went wrong while uploading the image.');
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
    }
  }
};