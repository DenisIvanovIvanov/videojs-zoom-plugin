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

