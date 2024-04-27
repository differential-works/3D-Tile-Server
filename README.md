# 3D-Tile-Server
A node server using three.js and puppeteer to dynamically load GLTF files into applications with GLTF support such as Rhino 8 using Grasshopper, Blender or Unity.
**Please note versions of Rhino 7 and below are not compatible with this server.**

![Preview animation of a photorealistic tile being loaded into Rhino3D, spinning.](/assets/tileStreamer_preview.gif)

### Disclaimer & Credits
- The contents of this repository were developed out of curiosity and intended for **research and educational purposes only**. This was a fun internal challenge for the Differential team and there is much scope for further refinement and efficiency on both the server (node) and client (grasshopper c#) side. We look forward to seeing where the gurus in the community take it 🙏.
- Please familiarise yourself with the policies specified by Google [here](https://developers.google.com/maps/documentation/tile/policies) prior to use.
- This repository builds on the work of Omar Shehata - You can find the repository [here](https://github.com/OmarShehata/google-earth-as-gltf). Thank you Omar :⚡

### Intended use
There are much simpler ways to get 3D tile geometry into Rhino such as [BLOSM](https://github.com/vvoovv/blosm). This might be a better workflow for you if you are looking for a one-off or just intermittent use.
The benefit of this tile server is that you can traverse across multiple addresses or GPS coordinates on demand or procedurally. This might be useful when undertaking broader scale urban analysis or studying a large number of sites simultanteously. The use of Puppeteer and three.js also opens up the potential for offline rendering / visualisation.

## Step 1 : Running the servers locally
1.  Pre requisites
    - Python (3.12.3)
    - Visual Studio (2022) - Also install desktop development with C++ workload.

2.  Clone the repository and open the folder in your choice of IDE (Visual Studio Code for example)
    - run ```npm install``` to install dependancies.
    - run ```npm build``` to compile main.js using webpack

3.  Run the servers
    - We need to run **two** local servers. One server for node to listen for the requests and process them. Another server for puppeteer to launch a html page with a three.js viewer and load the 3D tiles. There is perhaps a smarter way to handle this!
    - run ```node index.js``` This will launch the node server on port 8080
    - run ```npx serve``` This will serve the html page on port 3000

## Step 2 : Rhino + Grasshopper
1.    Required libraries (all of them should be available via the package manager)
      - Heron
      - Swiftlet
      - jSwan
  
![Preview of the grasshopper definition and mark-up of the points listed below](/assets/GH_Preview.png)

2.    The grasshopper definition & how it works
      - Enter your address in the panel {1} and Heron will fetch GPS coordinates for the address.
      - Enter you Google 3D Tiles API key {2}
      - You can see how the POST request is formatted using the key value pairs. You can make the same POST request from other applications as long as its formatted similarly and you should recieve a combined GLTF file.
      - Define a temporary working directory to temporarily save and load the GLTF tiles {3}
      - By default, each call deletes the previous tile that was loaded in the Rhino viewport. However, the c# script component has a try & catch block which can be commented out if you want to keep the previous tile and load a new one rather than replacing it.
  
## Step 3 (optional) : Preview the loading process
By default puppeteer has headless mode set to true (Index.js, line 66), by setting this to false, when the server recieves the request, you can see the chrome instance that is launched. By looking at the console in the developer tools, you can see progress of the tiles being loaded. This might be useful for debugging purposes. 

## Summary
For the moment we are not actively developing this particular workflow due to its complexity. Next time, we hope to resolve this entirely in the Rhino and Grasshopper context making it much more accessible and user friendly.
