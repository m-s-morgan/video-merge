import * as ffmpeg from 'fluent-ffmpeg';
import { promises as fsPromises } from 'fs';
import { join } from 'path';

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const FOLDERS = {
    PREROLL: './preroll',
    INPUT: './input',
    OUTPUT: './output',
    TEMP: './temp'
};

ffmpeg.setFfmpegPath(ffmpegPath);

function isNull(obj: any) {
    return obj === null || typeof obj === 'undefined';
}

function isEmpty(obj: any) {
    return obj === '' || isNull(obj);
}

function isObject(obj: any) {
    return obj != null && typeof obj === 'object';
}

function isArray(obj: any) {
    return Object.prototype.toString.call(obj) === '[object Array]';
}

function onError(err: Error) {
    if (isObject(err)) {
        console.error(`ERROR: ${err.message}`, '\n');
    } else {
        console.error(err, '\n');
    }

    process.exitCode = 1;
}

function merge(preName: string, inputName: string) {
    return new Promise((resolve, reject) => {
        ffmpeg(join(FOLDERS.PREROLL, preName))
            .input(join(FOLDERS.INPUT, inputName))
            .on('error', reject)
            .on('end', () => {
                resolve(`${inputName} merged!`);
            })
            .mergeToFile(join(FOLDERS.OUTPUT, inputName), <any>FOLDERS.TEMP);
    });
}

async function mergeAll() {
    try {
        const prerollFiles = await fsPromises.readdir(FOLDERS.PREROLL);

        if (!isArray(prerollFiles) || prerollFiles.length === 0) {
            throw new Error('Please add a preroll video to the preroll folder');
        }

        let preroll: string;

        for (const p of prerollFiles) {
            const stat = await fsPromises.stat(p);

            if (!stat.isDirectory()) {
                preroll = p;
                break;
            }
        }

        if (isEmpty(preroll)) {
            throw new Error('Please add a preroll video to the preroll folder');
        }

        const inputFiles = await fsPromises.readdir(FOLDERS.INPUT);

        for (const i of inputFiles) {
            const stat = await fsPromises.stat(i);

            if (!stat.isDirectory()) {
                console.log(await merge(preroll, i));
            }
        }
    } catch (e) {
        onError(e);
    }
}

mergeAll();
