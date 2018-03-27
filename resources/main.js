import Rx from 'rxjs'
import pluginCall from 'sketch-module-web-view/client'
import './style.css'
import 'bulma/css/bulma.css'

const INITIAL_COLOR = '#009fff'
const INITIAL_BRUSH = 10

const tools = document.querySelector('.tools')
const canvas = document.querySelector('#canvas')
const context = canvas.getContext('2d')
context.lineJoin = 'round'

const boundings = canvas.getBoundingClientRect()
const canvasOffsetX = boundings.left
const canvasOffsetY = boundings.top

// region color
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
const brushesStream = Rx.Observable.merge(
  Rx.Observable.fromEvent(brushes, 'click'),
  Rx.Observable.fromEvent(customBrush, 'change')
)

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
const onDrawModeStream = Rx.Observable.merge(colorsStream, brushesStream, clearStream).mapTo(true)
const offDrawModeStream = eraseStream.mapTo(false)
const toggleDrawModeStream = Rx.Observable.merge(onDrawModeStream, offDrawModeStream)
  .startWith(true)
  .distinctUntilChanged()

toggleDrawModeStream.subscribe(drawMode => {
  if (!drawMode) {
    eraser.classList.remove('is-outlined')
  } else {
    eraser.classList.add('is-outlined')
  }
})
// endregion drawMode

// region canvas

const mousedownStream = Rx.Observable.fromEvent(canvas, 'mousedown')
const mousemoveStream = Rx.Observable.fromEvent(document.documentElement, 'mousemove')
const mouseupStream = Rx.Observable.fromEvent(document.documentElement, 'mouseup')
const animateStream = Rx.Observable.interval(0, Rx.Scheduler.animationFrame)

const drawStream = mousedownStream
  .mergeMap(down => {
    context.beginPath()
    context.moveTo(down.clientX - canvasOffsetX, down.clientY - canvasOffsetY)
    return mousemoveStream.takeUntil(mouseupStream)
  })
  .withLatestFrom(animateStream, draw => draw)
  .map(draw => {
    let x = draw.clientX - canvasOffsetX
    let y = draw.clientY - canvasOffsetY

    if (x > canvas.width) x = canvas.width
    else if (x < 0) x = 0

    if (y > canvas.height) y = canvas.height
    else if (y < 0) y = 0

    return { x, y }
  })
  .withLatestFrom(
    chooseColorStream,
    chooseBrushStream,
    toggleDrawModeStream,
    (draw, color, brush, drawMode) => {
      context.globalCompositeOperation = 'source-over'
      context.strokeStyle = color
      context.lineWidth = brush
      return {
        draw,
        drawMode,
      }
    }
  )

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

const nameForm = tools.querySelector('#name')
const nameChangedSteam = Rx.Observable.fromEvent(nameForm, 'change')

const renderButton = tools.querySelector('.render')
const renderButtonStream = Rx.Observable.fromEvent(renderButton, 'click')

const renderStream = Rx.Observable.merge(nameChangedSteam, renderButtonStream).throttleTime(1000)

renderStream.subscribe(() => {
  const data = canvas.toDataURL()
  const name = nameForm.value || 'Bitmap'
  const base64 = data.replace('data:image/png;base64,', '')
  pluginCall('render', { base64, name })
})
