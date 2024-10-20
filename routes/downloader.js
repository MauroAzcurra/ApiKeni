const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const router = express.Router();

class Fuck extends Error {
    constructor(message) {
        super(message);
        this.name = "Fuck";
    }
}

class API {
    constructor(search, prefix) {
        this.api = {
            search: search,
            prefix: prefix
        };
    }

    headers(custom = {}) {
        return {
            'Content-Type': 'application/x-www-form-urlencoded',
            'authority': 'retatube.com',
            'accept': '*/*',
            'accept-language': 'id-MM,id;q=0.9',
            'hx-current-url': 'https://retatube.com/',
            'hx-request': 'true',
            'hx-target': 'aio-parse-result',
            'hx-trigger': 'search-btn',
            'origin': 'https://retatube.com',
            'referer': 'https://retatube.com/',
            'sec-ch-ua': '"Not-A.Brand";v="99", "Chromium";v="124"',
            'sec-ch-ua-mobile': '?1',
            'sec-ch-ua-platform': '"Android"',
            'user-agent': 'Postify/1.0.0',
            ...custom
        };
    }

    handleError(error, context) {
        const errors = error.response ? JSON.stringify(error.response.data || error.message) : error.message;
        console.error(`[${context}] Error:`, errors);
        throw new Fuck(errors);
    }

    getEndpoint(name) {
        return this.api[name];
    }
}

class RetaTube extends API {
    constructor() {
        super('https://retatube.com/api/v1/aio/search', 'https://retatube.com/api/v1/aio/index?s=retatube.com');
    }

    async getPrefix() {
        try {
            const response = await axios.get(this.getEndpoint('prefix'));
            return this.scrapePrefix(response.data);
        } catch (error) {
            this.handleError(error);
        }
    }

    scrapePrefix(htmlContent) {
        const $ = cheerio.load(htmlContent);
        const prefix = $('#aio-search-box input[name="prefix"]').val();
        return prefix;
    }

    async fetch(videoId) {
        try {
            const prefix = await this.getPrefix();
            const response = await axios.post(this.getEndpoint('search'), `prefix=${encodeURIComponent(prefix)}&vid=${encodeURIComponent(videoId)}`, { headers: this.headers() });
            return this.parseHtml(response.data);
        } catch (error) {
            this.handleError(error);
        }
    }

    parseHtml(htmlContent) {
        const $ = cheerio.load(htmlContent);
        const result = {
            title: '',
            downloadUrl: ''
        };

        $('.col').each((_, element) => {
            const title = $(element).find('#text-786685718 strong').first();
            result.title = title.text().replace('Title：', '').trim() || result.title;

            $(element).find('a.button.primary').each((_, linkElement) => {
                const linkUrl = $(linkElement).attr('href');
                if (linkUrl !== 'javascript:void(0);') {
                    result.downloadUrl = linkUrl; // Ambil URL pertama sebagai download link
                }
            });
        });

        return result;
    }

    async scrape(links) {
        try {
            return await this.fetch(links);
        } catch (error) {
            console.error(`${error.message}`);
            throw error;
        }
    }
}

// Endpoint untuk setiap platform
const downloader = new RetaTube();

router.get('/', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).json({
            status: 400,
            author: "KenisawaDev",
            message: "Parameter 'url' belum dimasukkan."
        });
    }

    try {
        const result = await downloader.scrape(url);
        if (!result.downloadUrl) {
            return res.status(404).json({
                status: 404,
                author: "KenisawaDev",
                message: "Tidak dapat menemukan URL unduhan untuk video ini."
            });
        }
        return res.status(200).json({
            status: 200,
            author: "KenisawaDev",
            title: result.title,
            downloadUrl: result.downloadUrl
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            author: "KenisawaDev",
            message: error.message
        });
    }
});

module.exports = router;
