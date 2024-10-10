const os = require("os");
const fs = require("fs-extra");
const axios = require("axios");

const startTime = new Date();

module.exports = {
  config: {
    name: "uptime",
    aliases: ["up", "upt", "stats", "info"],
    author: "Priyanshi Kaur(modified)",
    countDown: 0,
    role: 0,
    category: "system",
    longDescription: {
      en: "Get adorable and comprehensive System Information with fun features!",
    },
    guide: {
      en: "Use .uptime [option]\nOptions: full, cute, mini, weather [city]",
    },
  },

  onStart: async function ({ api, event, args, threadsData, usersData }) {
    const getUptime = () => {
      const uptimeInSeconds = (new Date() - startTime) / 1000;
      const days = Math.floor(uptimeInSeconds / (3600 * 24));
      const hours = Math.floor((uptimeInSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
      const seconds = Math.floor(uptimeInSeconds % 60);
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    };

    const getSystemInfo = () => {
      const cpuUsage = (os.cpus().map(cpu => cpu.times.user).reduce((acc, curr) => acc + curr) / os.cpus().length).toFixed(1);
      const totalMemoryGB = (os.totalmem() / 1024 ** 3).toFixed(2);
      const freeMemoryGB = (os.freemem() / 1024 ** 3).toFixed(2);
      const usedMemoryGB = (totalMemoryGB - freeMemoryGB).toFixed(2);
      return { cpuUsage, totalMemoryGB, usedMemoryGB };
    };

    const getUsersThreadsInfo = async () => {
      const allUsers = await usersData.getAll();
      const allThreads = await threadsData.getAll();
      return { userCount: allUsers.length, threadCount: allThreads.length };
    };

    const sendCheckingMessage = async () => {
      const checkingMessage = await api.sendMessage({ body: "🐱 Meow~ Checking system info..." }, event.threadID);
      return checkingMessage.messageID;
    };

    const getPing = (startTime) => {
      return Date.now() - startTime;
    };

    const getWeather = async (city) => {
      const API_KEY = "YOUR_WEATHER_API_KEY"; // Replace with your actual API key
      try {
        const response = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
        const { main, weather } = response.data;
        return `🌈 Weather in ${city}:\n🌡️ Temp: ${main.temp}°C\n💧 Humidity: ${main.humidity}%\n☁️ Conditions: ${weather[0].description}`;
      } catch (error) {
        return "Sorry, I couldn't fetch the weather information. 😿";
      }
    };

    try {
      const startTime = Date.now();
      const checkingMessageID = await sendCheckingMessage();

      const { cpuUsage, totalMemoryGB, usedMemoryGB } = getSystemInfo();
      const { userCount, threadCount } = await getUsersThreadsInfo();
      const ping = getPing(startTime);
      const uptimeFormatted = getUptime();

      const currentDate = new Date();
      const date = currentDate.toLocaleDateString("en-US", { year: "numeric", month: "numeric", day: "numeric" });
      const time = currentDate.toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour12: true });

      const pingStatus = ping < 1000 ? "🌟 Purrfect System!" : "😿 Feeling a bit slow...";

      let systemInfo = "";

      if (!args[0] || args[0] === "full") {
        systemInfo = `
╭⋆⋅☆⋅⋆⋅☆⋆⋅☆⋅⋆⋅☆⋆⋅☆⋅⋆╮
     🌈✨ Bot Stats ✨🌈
╰⋆⋅☆⋅⋆⋅☆⋆⋅☆⋅⋆⋅☆⋆⋅☆⋅⋆╯

  ฅ^•ﻌ•^ฅ  Bot Info  ฅ^•ﻌ•^ฅ
🎀 Name: QueenBot
🎀 Lang: Nodejs ${process.version}
🎀 Prefix: .
🎀 Devs: Team Priyanshi

  🕰️  Runtime  🕰️
⏳ ${uptimeFormatted}

  💻  System Info  💻
🖥️ OS: ${os.type()} ${os.arch()}
🧠 CPU: ${os.cpus()[0].model}
💾 Storage: ${usedMemoryGB} GB / ${totalMemoryGB} GB
🔥 CPU Usage: ${cpuUsage}%
🎈 RAM Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB

  🌈  Fun Stats  🌈
📅 Date: ${date}
⏰ Time: ${time}
👥 Users: ${userCount}
💬 Threads: ${threadCount}
🏓 Ping: ${ping}ms
✨ Status: ${pingStatus}

  🐾 Commands 🐾
Try '.uptime cute' for a surprise!
Use '.uptime weather [city]' for weather info!

╭⋆⋅☆⋅⋆⋅☆⋆⋅☆⋅⋆⋅☆⋆⋅☆⋅⋆╮
     🌙 Thank you! 🌙
╰⋆⋅☆⋅⋆⋅☆⋆⋅☆⋅⋆⋅☆⋆⋅☆⋅⋆╯
`;
      } else if (args[0] === "cute") {
        const pets = ["🐱", "🐶", "🐰", "🐼", "🐨", "🦊", "🐯"];
        const randomPet = pets[Math.floor(Math.random() * pets.length)];
        systemInfo = `
${randomPet} Hewwo! I'm QueenBot!
I've been awake for ${uptimeFormatted}
There are ${userCount} hoomans and ${threadCount} chats
My brain is using ${cpuUsage}% of its power
Ping: ${ping}ms ${ping < 1000 ? "✨" : "💤"}

Paw-some day to you! ${randomPet}
`;
      } else if (args[0] === "mini") {
        systemInfo = `QueenBot 🤖 | Up: ${uptimeFormatted} | Users: ${userCount} | Threads: ${threadCount} | Ping: ${ping}ms`;
      } else if (args[0] === "weather" && args[1]) {
        const weatherInfo = await getWeather(args[1]);
        systemInfo = weatherInfo;
      } else {
        systemInfo = "Invalid option. Try 'full', 'cute', 'mini', or 'weather [city]'.";
      }

      // Edit the checking message with the uptime information
      api.editMessage(systemInfo, checkingMessageID);
    } catch (error) {
      console.error("Error retrieving system information:", error);
      api.sendMessage("Oopsie! 🙀 I couldn't fetch the info. Please try again later!", event.threadID, event.messageID);
    }
  },
};