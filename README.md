OpenSim Viewer based on three.js
================================

#### JavaScript 3D library ####
The library three.js a lightweight 3D library with a very low level of complexity. This fork utilizes three.js as the technology behind the OpenSim visualizer.

Please refer to [Examples](http://threejs.org/examples/) — [Documentation](http://threejs.org/docs/) — [Migrating](https://github.com/mrdoob/three.js/wiki/Migration) — [Help](http://stackoverflow.com/questions/tagged/three.js) for three.js related usage.


### Usage ###

Download the master branch of this repo or a distribution. This includes a fixed OpenSim model visuals exported into supported .json format, the model is embedded in a scene. 

## Prerequisites ###
Three.js is a WebGL based technology as such there has to be a server running in the background that "serves" javascript pages that are displayed in a web browser. When integrated into the OpenSim application, the application will launch the server internally and the communication is transparent to users. For testing the visualizer standalone (in a browser) you'll need:

1. Installation of Python (tested with 2.7 but should work with any later version).
2. Some installation of Google Chrome (tested wiith 52.0.2743.116 on Windows)
3. Clone or checkout master branch of this repo or a distribution when available.

## Steps to Launch ##

1. Open a shell/command prompt and navigate to the top level folder of the repository
2. type ```python -m SimpleHTTPServer 8000``` (In python 3 the command is ```python -m http.server 8000```)
3. Open Google Chrome to the URL localhost:8000/editor/
4. Enjoy!
 




