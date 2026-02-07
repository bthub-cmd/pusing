const axios = require("axios");
const cheerio = require("cheerio");

// Waifu.im API
async function getWaifuIM(category = "waifu", isNsfw = true) {
    try {
        const response = await axios.get("https://api.waifu.im/search", {
            params: {
                included_tags: category,
                is_nsfw: isNsfw
            }
        });

        if (response.data && response.data.images && response.data.images.length > 0) {
            return {
                success: true,
                url: response.data.images[0].url,
                source: response.data.images[0].source || "Unknown"
            };
        }

        return { success: false, message: "No images found" };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// Nekos.life API
async function getNekosLife(category = "neko") {
    try {
        const endpoints = {
            neko: "https://nekos.life/api/v2/img/nsfw_neko_gif",
            waifu: "https://nekos.life/api/v2/img/waifu",
            trap: "https://nekos.life/api/v2/img/trap",
            blowjob: "https://nekos.life/api/v2/img/blowjob"
        };

        const endpoint = endpoints[category] || endpoints.neko;
        const response = await axios.get(endpoint);

        if (response.data && response.data.url) {
            return {
                success: true,
                url: response.data.url
            };
        }

        return { success: false, message: "No images found" };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// Generic hentai API
async function getHentai() {
    try {
        const response = await axios.get("https://api.waifu.im/search", {
            params: {
                included_tags: "hentai",
                is_nsfw: true
            }
        });

        if (response.data && response.data.images && response.data.images.length > 0) {
            return {
                success: true,
                url: response.data.images[0].url
            };
        }

        return { success: false, message: "No images found" };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// Xvideos search scraper
async function searchXvideos(query) {
    try {
        const response = await axios.get(`https://www.xvideos.com/?k=${encodeURIComponent(query)}`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });

        const $ = cheerio.load(response.data);
        const results = [];

        $("div.thumb-block").slice(0, 10).each((i, elem) => {
            const title = $(elem).find("p.title a").attr("title");
            const url = "https://www.xvideos.com" + $(elem).find("p.title a").attr("href");
            const thumb = $(elem).find("img").attr("data-src");
            const duration = $(elem).find("span.duration").text();

            if (title && url) {
                results.push({
                    title: title,
                    url: url,
                    thumbnail: thumb,
                    duration: duration
                });
            }
        });

        return {
            success: true,
            results: results
        };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// XNXX search scraper
async function searchXNXX(query) {
    try {
        const response = await axios.get(`https://www.xnxx.com/search/${encodeURIComponent(query)}`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });

        const $ = cheerio.load(response.data);
        const results = [];

        $("div.thumb-block").slice(0, 10).each((i, elem) => {
            const title = $(elem).find("p.title a").attr("title");
            const url = "https://www.xnxx.com" + $(elem).find("p.title a").attr("href");
            const thumb = $(elem).find("img").attr("data-src");
            const duration = $(elem).find("p.metadata span.duration").text();

            if (title && url) {
                results.push({
                    title: title,
                    url: url,
                    thumbnail: thumb,
                    duration: duration
                });
            }
        });

        return {
            success: true,
            results: results
        };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

module.exports = {
    getWaifuIM,
    getNekosLife,
    getHentai,
    searchXvideos,
    searchXNXX
};
