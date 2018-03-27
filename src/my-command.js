/* eslint-disable no-new */
import sketch from 'sketch/dom'
import WebUI from 'sketch-module-web-view'

const document = sketch.getSelectedDocument()
const page = document.selectedPage

export default function (context) {
  new WebUI(context, require('../resources/index.html'), {
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
      render ({ base64, name }) {
        new sketch.Image({
          image: {
            base64,
          },
          name,
          parent: page,
        })
      },
    },
  })
}
