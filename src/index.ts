import { chromium, } from 'playwright';
import { JSDOM } from 'jsdom';
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'node:path';

const browser = await chromium.launch();
const context = await browser.newContext();

const urls = await geturls(process.argv[2]!);
for (const url of urls) {
    console.log("downloading:", url.toString())
    const songinfo = await getsonginfo(url);
    await writesonginfo(songinfo);
}


await browser.close();




//型
type SongInfo = {
    title: string;
    author: string;
    chords: string[];
}

//関数
async function geturls(q: string) {

    const url = new URL(q, "https://songle.jp/artists/");
    // console.log(url);
    const page = await context.newPage();
    await page.goto(url.toString());
    const html = new JSDOM(await page.content());
    // console.log(html.window.document.body.outerHTML);
    const anchorelements = html.window.document.querySelectorAll("a.song");
    return [...anchorelements].map(e => (e as HTMLAnchorElement).href).map(e => new URL(e, "https://songle.jp"));
}



async function getsonginfo(url: URL) {
    const page = await context.newPage();
    await page.goto(url.toString());
    await page.waitForTimeout(200);
    const html = new JSDOM(await page.content());
    const { document } = html.window;
    const title = document.getElementsByClassName("song-name")[0].textContent!;
    const author = document.getElementsByClassName("song-artist")[0].textContent!;
    const chordselem = document.getElementsByClassName("chord-text");
    const chords = [...chordselem].map(e => e.textContent!);
    return { title, author, chords }
}

async function writesonginfo(songinfo: SongInfo) {
    const authordir = join("out/", songinfo.author)
    await mkdir(authordir, { recursive: true });
    await writeFile(join(authordir, songinfo.title.replaceAll("/", "_")) + ".json", JSON.stringify(songinfo.chords))
}