import sketch from 'sketch/dom'
import WebUI from 'sketch-module-web-view'

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
      nativeLog(s) {
        context.document.showMessage(s)

        webUI.eval(`setRandomNumber(${Math.random()})`)
      },
    },
  })
}
