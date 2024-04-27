import { Viewer } from './Viewer.js'
import { load } from '@loaders.gl/core';
import { Tileset3D } from '@loaders.gl/tiles';
import { Tiles3DLoader } from '@loaders.gl/3d-tiles';
import { WebMercatorViewport } from '@deck.gl/core';



// The viewer (1) sets up a ThreeJS scene,
// (2) takes a set of glTF's and renders them normalized around (0,0,0) and oriented correctly
// (3) can export this combined glTF

const viewer = new Viewer()

async function buildTiles() {
    try {
        await fetch3DTiles();
        //viewer.generateCombineGltf();
    } catch (e) {
        console.error(e)
        console.log(`Failed to fetch 3D Tiles! Error: ${e}`)
    }
}

buildTiles();

// Here is where we actually get the 3D Tiles from the Google API
// We use loadersgl to traverse the tileset until we get to the 
// lat,lng,zoom we want, at the given screen space error
// we end up with a list of glTF url's. Viewer is what finally
// fetches them
async function fetch3DTiles() {

    let r_lat = window.localStorage.getItem('req_lat');
    let r_lng = window.localStorage.getItem('req_lng');
    let r_zoom = window.localStorage.getItem('req_zoom');
    let r_key = window.localStorage.getItem('req_key');
    let r_sse = window.localStorage.getItem('req_sse');
    let r_texSize = window.localStorage.getItem('req_texSize');

    console.log("session lat is : "+r_lat);
    console.log("session lng is : "+r_lng);
    console.log("session zoom is : "+r_zoom);
    console.log("session key is : "+r_key);
    console.log("session sse is : "+r_sse);
    console.log("session texSize is : "+r_texSize);
    
    const GOOGLE_API_KEY = r_key;
    const tilesetUrl = 'https://tile.googleapis.com/v1/3dtiles/root.json?key=' + GOOGLE_API_KEY;

    //const targetScreenSpaceError = 8;
    const targetScreenSpaceError = Number(r_sse);

    console.log(`Fetching tiles at (${r_lat} ${r_lng}, ${r_zoom}, sse: ${targetScreenSpaceError})`)
    const viewport = new WebMercatorViewport({
        width: 600,
        height: 600, // dimensions from the little map preview
        latitude: Number(r_lat),
        longitude: Number(r_lng),
        zoom: Number(r_zoom)
    });

    const tileset = await load3DTileset(tilesetUrl, viewport, targetScreenSpaceError)
    const sessionKey = getSessionKey(tileset)
    let tiles = tileset.tiles
    // sort tiles to have the most accurate tiles first
    tiles = tiles.sort((tileA, tileB) => {
        return tileA.header.geometricError - tileB.header.geometricError
    })

    const glbUrls = []
    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i]
        const errorDiff = Math.abs(targetScreenSpaceError - tile.header.geometricError)
        if (errorDiff <= targetScreenSpaceError) {
            console.log(tile.header.geometricError)
            const url = `${tile.contentUrl}?key=${GOOGLE_API_KEY}&session=${sessionKey}`
            glbUrls.push(url)
        }

        if (glbUrls.length > 100) {
            console.log("==== Exceeded maximum glTFs! Capping at 100 =====")
            break
        }
    }

    if (glbUrls.length == 0) {
        let firstSSEFound = null
        for (let i = 0; i < tiles.length; i++) {
            const tile = tiles[i]
            if (firstSSEFound == null) firstSSEFound = Math.round(tile.header.geometricError)
            const errorDiff = Math.abs(targetScreenSpaceError - tile.header.geometricError)
            if (errorDiff <= firstSSEFound * 2) {

                const url = `${tile.contentUrl}?key=${GOOGLE_API_KEY}&session=${sessionKey}`
                glbUrls.push(url)
            }

            if (glbUrls.length > 100) {
                console.log("==== Exceeded maximum glTFs! Capping at 100 =====")
                break
            }
        }
        console.log(`==== No tiles found for screen space error ${targetScreenSpaceError}. Getting tiles that are within 2x of ${firstSSEFound} ===`)
    }

    await viewer.loadGLTFTiles(glbUrls, console.log)
    viewer.generateCombineGltf(Number(r_texSize));
}

async function load3DTileset(tilesetUrl, viewport, screenSpaceError) {
    const tilesetJson = await load(tilesetUrl, Tiles3DLoader, { '3d-tiles': { loadGLTF: false } });
    const tileset3d = new Tileset3D(tilesetJson, {
        throttleRequests: false,
        maximumScreenSpaceError: screenSpaceError
    })

    while (!tileset3d.isLoaded()) {
        await tileset3d.selectTiles(viewport)
    }

    return tileset3d
}

function getSessionKey(tileset) {
    return new URL(`http://website.com?${tileset.queryParams}`).searchParams.get("session")
}