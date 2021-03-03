import * as ffmpeg from 'fluent-ffmpeg';
import { promises as fsPromises } from 'fs';
import { basename, join } from 'path';

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

function isArray(obj: any) {
    return Object.prototype.toString.call(obj) === '[object Array]';
}

function onError(err: Error) {
    console.error(err);
    process.exitCode = 1;
}

function merge(pre: string, input: string) {
    return new Promise((resolve, reject) => {
        const filename = basename(input);
        const output = join(FOLDERS.OUTPUT, filename);

        ffmpeg(pre)
            .input(input)
            .on('error', reject)
            .on('end', () => {
                resolve(`${filename} merged!`);
            })
            .mergeToFile(output, <any>FOLDERS.TEMP);
    });
}

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
