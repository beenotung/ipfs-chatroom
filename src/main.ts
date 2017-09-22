/// <reference path="../node_modules/typestub-ipfs/index.d.ts" />

import * as IPFS from "ipfs";
import * as Y from 'yjs'
import * as yIPFS from 'y-ipfs-connector';
import * as yIndexedDB from 'y-indexeddb'
import * as yArray from 'y-array'
import * as yMemory from 'y-memory'
import * as yMap from 'y-map'
import * as yText from 'y-text'

yIPFS(Y);
yIndexedDB(Y);
yArray(Y);
yMemory(Y);
yMap(Y);
yText(Y);

const textarea = document.getElementById("textarea") as HTMLTextAreaElement;

function log(...args: any[]) {
    console.log(...args);
    textarea.value += "\n[log]" + args.join(",") + "\n";
}

function error(...args: any[]) {
    console.error(...args);
    textarea.value += "\n[error]" + args.join(",") + "\n";
}

window.onerror = err => error(JSON.stringify(err));

const searches = location.search.replace('?', '&')
    .split('&').slice(1)
    .map(x => x.split('='));

let room: string;
(() => {
    if (location.protocol !== "https:") {
        location.protocol = "https:";
    }
    let x = searches.filter(xs => xs[0] == 'room');
    if (x.length == 0) {
        log('assign to a random room');
        searches.push(['room', 'default']);
        location.search = '?' + searches.map(xs => xs[0] + '=' + xs[1]).join('&');
    } else {
        room = x[0][1];
    }
})();

function repo() {
    return "ipfs/ipfs-chatroom/" + room;
}

const ipfs = new IPFS({
    repo: repo()
    , EXPERIMENTAL: {
        pubsub: true
    }
});
log("waiting IPFS connection");
ipfs.once("ready", () => ipfs.id((err, info) => {
    if (err) {
        throw err;
    }
    log("IPFS node ready with address", info.id);
    Y({
        db: {name: "indexeddb"}
        , connector: {
            name: "ipfs"
            , room: repo()
            , ipfs: ipfs
        }
        , share: {
            textfield: "Text"
            , map: "Map"
            , array: "Array"
        }
    }).then((y) => {
        log("Yjs instance ready");
        window['y'] = y;
        textarea.value = "";
        y.share.textfield.bind(textarea)
    });
}));
