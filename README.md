# VideoJS Zoom plugin with preview

Really basic plugin without much of an options to zoom in a video with preview of the visible area


![Demo](/zoom-preview.png)

## Getting started
Just include **videojs-zoom.css** and **videojs-zoom-plugin.js** inside index page as usual,
then include the plugin inside your player. If framerate is not specified then 30 is default.
```
videojs(videoId, {
        plugins: {
            zoom: {
                framerate: 30
            }
        }
    })
```

and thats pretty much it.

Much more can be done, but it is out of my scope for now, e.g.
1. Option to specify where to place canvas
2. Refactor creation of the buttons
3. **There is no null check if framerate is null**
4. Canvas size
5. Canvas border color, preview rectangle color etc.
6. Refactor the plugin as class extending videojs **Plugin** so **dispose()** doesn't have to be called manually
7. ??

