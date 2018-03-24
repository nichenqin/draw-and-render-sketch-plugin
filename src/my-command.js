const sketch = require('sketch')
const UI = require('sketch/ui')
import WebUI from 'sketch-module-web-view'

const document = sketch.getSelectedDocument()
const page = document.selectedPage

export default function(context) {
  const webUI = new WebUI(context, require('../resources/index.html'), {
    identifier: 'draw.and.render', // to reuse the UI
    x: 0,
    y: 0,
    width: 1000,
    height: 750,
    blurredBackground: true,
    onlyShowCloseButton: true,
    hideTitleBar: false,
    shouldKeepAround: true,
    resizable: false,
    handlers: {
      render(base64) {
        const image = new sketch.Image({
          image: {
            base64,
          },
          parent: page,
        })
      },
    },
  })
}
