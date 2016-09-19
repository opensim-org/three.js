Introduction & Big Picture:
===========================
Visualization in the OpenSim Application used to be done utilizing VTK (a third party tool for visualizing image data), we're planning to switch to another toolkit (three.js that utilizes WebGL browser technology which is part of the HTMLS standard). Alpha release will use a standalone Browser window but the plan is to embed this window into the OpenSim Application as a Java Window (using 3rd party tools that we tested). Since the embedded browser is based on Chromium we're most interested in testing on Google Chrome but it is good to know how other browsers perform in case we use the same technology to display models on our project pages.

What's Available:
=================
First Alpha release will visualize a fixed model and allow users to test navigation of the 3D view, selection, lights, cameras, helper objects, taking snapshots and creating movies with the goal of zoning in on what functionality meets the needs of our target users. Two possible use cases of the visualizer are: embedded mode where it's embedded inside the Java Application UI, and the second is browser model to show OpenSim models on webpages. Keep both of these options in mind.

What to test, feedback needed on:
=================================
- Variety of Browsers, with focus on Chrome
- Variety of Platforms (Windows, OSX, Linux)
- Navigating the view window (pan, zoom, focus, refit).
- Double click an object selects/focus
- What lights to include by default (included one directional light)?
- Would adding more cameras be useful? Switching between them?
- Orthographic Cameras?
- Multiple views, same scene?
- Translate, rotate, scale of Scene Geometry /Add-ons and lights etc.
- Take static snapshots
- Record Movies and play them back
- Control of display of items
- Clutter, or items that can/should be hidden/removed.
- Adding/removing/manipulating extra geometry, lights and Cameras
- Background images, floor patterns, and their control.
- Device specific gestures (pinch-zoom, touch-screen etc.)
- To record a Movie, select a Camera from scene tree.
- What clutter/options can be safely removed.

Some Tips:
==========
- Mouse left, mid, right to Rotate, Pan, Zoom. Wheel also zooms in/out
- Text boxes auto convert to spinners when dragging inside them.
- W,E,R are shortcuts to Translate, rotate, scale

Known Limitations:
===================
- Model used is fixed, and shows only Bones and Markers (No muscles, wrap or contact geometry)
- Only one model is shown (if/how to handle multiple models is open for discussion/proposals)
- Save/restore is not fully implemented because the mechanism may change when embedded, a list of what minimal set to persist would be useful, however.

How to give feedback:
=====================
Open issues on the repository https://github.com/opensim-org/three.js/issues on github, sure looking forward to your valuable feedback and participation.

What's Next:
============
Implement ideas and suggestions in Standalone visualizer, also wire visualizer to the rest of the GUI. 
