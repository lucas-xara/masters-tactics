import axios from 'axios';
import unidecode from 'unidecode';

export async function obtaintrueurl(filenames) {
    // Parameters to send the API when requesting the image info
    let params = {
        action: 'query',
        format: 'json',
        prop: 'imageinfo',
        titles: '',
        iiprop: 'url'
    };

    // Create the list of titles to ask the API about
    filenames.forEach(filename => {
        params.titles += "File:" + unidecode(filename).replace(/ /g, "_").replace(/:/g, "").replace(/\//g, "_").replace(/'/g, "").replace(/"/g, '').replace(/\?/g, "") + "|";
    });
    params.titles = params.titles.slice(0, -1); // Remove the trailing pipe

    // Identify in which position of the list we want to return every url by splitting the original titles in the query
    let requestedtitles = params.titles.split("|");
    // By default our list of returned URLs is everything to False and then modify based on response
    let urls = Array(requestedtitles.length).fill(false);

    // Obtain URL info
    try {
        const response = await axios.get("https://feheroes.fandom.com/api.php", { params });
        const info = response.data.query;

        // Create a dict which tells the corresponding requested name for each real name
        let truenames = {};
        if (info.normalized) {
            info.normalized.forEach(page => {
                truenames[page.to] = page.from;
            });
        }

        // The response json isn't very convenient for single image queries so we must enter a loop and return with the first value
        for (let image in info.pages) {
            // This is the index the caller script expects the requested true URL to be at
            let index = requestedtitles.indexOf(truenames[info.pages[image].title]);
            try {
                urls[index] = info.pages[image].imageinfo[0].url + "&format=original";
            } catch (e) {
                // The referenced data art is probably incorrect and we couldn't get a full url
                urls[index] = false;
            }
        }
    } catch (e) {
        return urls; // If the request failed for whatever reason return the expected list with as many Falses as images were requested
    }
    return urls;
}

export async function retrieveapidata(params) {
    const url = "https://feheroes.fandom.com/api.php";
    let stop = false;
    let info = [];
    while (!stop) {
        params.offset += 500;
        try {
            const response = await axios.get(url, { params });
            const data = response.data;

            // If we got less than 500 entries that means this is the last iteration
            if (data.cargoquery.length < 500) {
                stop = true;
            }

            // Just in case we reach the end on a perfect multiple of 500
            if (data.cargoquery.length === 0) {
                break;
            }
            info = info.concat(data.cargoquery);
        } catch (e) {
            stop = true; // Stop if there's any error during the request
        }
    }
    return info;
}