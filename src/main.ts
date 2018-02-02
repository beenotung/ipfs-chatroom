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
    let roomElm = document.getElementById("room") as HTMLInputElement;
    let goElm = document.getElementById("go") as HTMLButtonElement;
    let toRoom = name => {
        let xs = searches
            .filter(x => x[0] != 'room');
        xs.push(["room", name]);
        location.search = '?' + xs.map(xs => xs[0] + '=' + xs[1]).join('&');
    };
    let x = searches.filter(xs => xs[0] == 'room');
    if (x.length == 0) {
        log('assign to a random room');
        toRoom("public");
    } else {
        room = x[0][1];
        roomElm.value = room;
    }
    goElm.onclick = e => {
        toRoom(roomElm.value);
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
    , config: {
        Addresses: {
            Swarm: [
                "/dns4/star-signal.cloud.ipfs.team/wss/p2p-webrtc-star"
            ]
        }
    }
});
log("waiting IPFS connection");
ipfs.once("ready", () => ipfs.id((err, info) => {
    if (err) {
        throw err;
    }
    log("IPFS node ready with address", info.id);
    log("waiting Yjs instance");
    Y({
        db: {
            name: "memory"
        }
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
        textarea.value = localStorage[room];
        y.share.textfield.bind(textarea);
        y.share.textfield.observe(e => {
            localStorage[room] = textarea.value;
        })
    });
}));
