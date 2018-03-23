import Rx from 'rxjs'
import pluginCall from 'sketch-module-web-view/client'
import './style.css'
import 'bulma/css/bulma.css'

const KEY_CODE = {
  SHIFT: 16,
}
const INITIAL_COLOR = '#009fff'
const INITIAL_BRUSH = 10

function isKeyShiftDown(keyCode) {
  return keyCode === KEY_CODE.SHIFT
}

// region color
const tools = document.querySelector('.tools')
const colors = tools.querySelectorAll('.colors button')
const customColor = tools.querySelector('.custom-color')
const currentColor = tools.querySelector('.current-color .color')
colors.forEach(color => {
  color.style.backgroundColor = color.value
})

const colorStream = Rx.Observable.fromEvent(colors, 'click')
const customColorStream = Rx.Observable.fromEvent(customColor, 'change')
const currentColorStream = Rx.Observable.fromEvent(currentColor, 'click')
const colorsStream = Rx.Observable.merge(colorStream, customColorStream, currentColorStream)

const chooseColorStream = colorsStream
  .pluck('target', 'value')
  .startWith(INITIAL_COLOR)
  .debounceTime(100)

chooseColorStream.subscribe(color => {
  currentColor.value = color
  currentColor.style.backgroundColor = color
})
// endregion color

// region brush
const brushes = tools.querySelectorAll('.brushes button')
const customBrush = tools.querySelector('.custom-brush [type=range]')
const currentBrush = tools.querySelector('.current-brush p')
const brushStream = Rx.Observable.fromEvent(brushes, 'click')
const customBrushStream = Rx.Observable.fromEvent(customBrush, 'change')
const brushesStream = Rx.Observable.merge(brushStream, customBrushStream)

const chooseBrushStream = brushesStream.pluck('target', 'value').startWith(INITIAL_BRUSH)
chooseBrushStream.subscribe(brush => {
  customBrush.value = brush
  currentBrush.textContent = brush
})

// endregion brush

// region eraser
const eraser = tools.querySelector('.eraser')
const eraseStream = Rx.Observable.fromEvent(eraser, 'click')
// endregion eraser

// region clear
const clearButton = document.querySelector('.clear')
const clearStream = Rx.Observable.fromEvent(clearButton, 'click')
clearStream.subscribe(() => {
  context.clearRect(0, 0, canvas.width, canvas.height)
})
// endregion clear

// region drawMode
const onDrawModeStream = Rx.Observable.merge(colorsStream, brushesStream).mapTo(true)
const offDrawModeStream = eraseStream.mapTo(false)
const toggleDrawModeStream = Rx.Observable.merge(onDrawModeStream, offDrawModeStream).startWith(
  true,
)
toggleDrawModeStream.subscribe(drawMode => {
  if (!drawMode) {
    eraser.classList.remove('is-outlined')
  } else {
    eraser.classList.add('is-outlined')
  }
})
// endregion drawMode

// region canvas
const canvas = document.querySelector('#canvas')
const boundings = canvas.getBoundingClientRect()
const canvasOffsetX = boundings.left
const canvasOffsetY = boundings.top
const context = canvas.getContext('2d')
context.lineJoin = 'round'

const mousedownStream = Rx.Observable.fromEvent(canvas, 'mousedown')
const mousemoveStream = Rx.Observable.fromEvent(document.documentElement, 'mousemove')
const mouseupStream = Rx.Observable.fromEvent(document.documentElement, 'mouseup')
const animateStream = Rx.Observable.interval(0, Rx.Scheduler.animationFrame)

const drawStream = mousedownStream
  .withLatestFrom(chooseColorStream, (down, color) => {
    context.globalCompositeOperation = 'source-over'
    context.strokeStyle = color
    context.beginPath()
    context.moveTo(down.clientX - canvasOffsetX, down.clientY - canvasOffsetY)
    return down
  })
  .withLatestFrom(chooseBrushStream, (down, brush) => {
    context.lineWidth = brush
    return down
  })
  .mergeMap(() => mousemoveStream.takeUntil(mouseupStream))
  .withLatestFrom(animateStream, draw => draw)
  .withLatestFrom(toggleDrawModeStream, (draw, drawMode) => ({
    draw,
    drawMode,
  }))
  .map(({ draw, drawMode }) => {
    let x = draw.clientX - canvasOffsetX
    let y = draw.clientY - canvasOffsetY
    if (x > canvas.width) {
      x = canvas.width
    } else if (x < 0) {
      x = 0
    }
    if (y > canvas.height) {
      y = canvas.height
    } else if (y < 0) {
      y = 0
    }
    return {
      draw: { x, y },
      drawMode,
    }
  })

drawStream.subscribe(({ draw, drawMode }) => {
  if (drawMode) {
    context.lineTo(draw.x, draw.y)
    context.stroke()
  } else {
    context.shadowBlur = 10
    context.globalCompositeOperation = 'destination-out'
    context.arc(draw.x, draw.y, 20, 0, Math.PI * 2, false)
    context.closePath()
    context.fill()
  }
})
// endregion canvas
