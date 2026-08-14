import { useRef } from "react";
import { Label } from "./Label";
import {
  boxStyle,
  canvasStyle,
  LABEL_ELEMENTS,
  MIN_ELEMENT_H,
  MIN_ELEMENT_W,
  clamp,
  roundGeometry,
} from "../../lib/labelTemplate";
import { useMeasure } from "../../lib/useMeasure";
import { useTranslation } from "../../i18n/context";

const PX_PER_MM = 96 / 25.4;

/** Room left around the label inside the stage, in pixels, so the handles on
 * an edge have somewhere to sit. */
const STAGE_PADDING = 28;

/** A label is a small object and the screen is not: blowing it up is the point
 * of the preview. The ceiling keeps a 20 mm label from filling a monitor. */
const MAX_ZOOM = 7;
const MIN_ZOOM = 0.15;

/**
 * The eight resize handles as direction vectors: -1 pulls the near edge, +1
 * pushes the far one, 0 leaves that axis alone. One vector drives the handle's
 * position, its cursor and the arithmetic that resizes the box.
 */
const HANDLES = [
  { id: "nw", x: -1, y: -1 },
  { id: "n", x: 0, y: -1 },
  { id: "ne", x: 1, y: -1 },
  { id: "e", x: 1, y: 0 },
  { id: "se", x: 1, y: 1 },
  { id: "s", x: 0, y: 1 },
  { id: "sw", x: -1, y: 1 },
  { id: "w", x: -1, y: 0 },
];

const CURSORS = {
  "-1,-1": "nwse-resize",
  "0,-1": "ns-resize",
  "1,-1": "nesw-resize",
  "1,0": "ew-resize",
  "1,1": "nwse-resize",
  "0,1": "ns-resize",
  "-1,1": "nesw-resize",
  "-1,0": "ew-resize",
};

/**
 * On a rotated design the element's own axes no longer line up with the
 * screen's, so the pointer has to be read in the element's frame: the design
 * is turned a quarter turn clockwise, which puts its x axis down the screen
 * and its y axis to the left.
 */
function toLocal(dx, dy, rotated) {
  return rotated ? { x: dy, y: -dx } : { x: dx, y: dy };
}

function moveBox(box, dx, dy) {
  return {
    ...box,
    x: roundGeometry(clamp(box.x + dx, 0, 100 - box.w)),
    y: roundGeometry(clamp(box.y + dy, 0, 100 - box.h)),
  };
}

/**
 * Resizing from an edge or a corner. Pulling a near edge moves the origin and
 * grows the box by the same amount, which is what makes the opposite edge stay
 * where it is; both are held inside the canvas and above the minimum size.
 */
function resizeBox(box, handle, dx, dy) {
  const next = { ...box };

  if (handle.x === -1) {
    const x = clamp(next.x + dx, 0, next.x + next.w - MIN_ELEMENT_W);
    next.w += next.x - x;
    next.x = x;
  } else if (handle.x === 1) {
    next.w = clamp(next.w + dx, MIN_ELEMENT_W, 100 - next.x);
  }

  if (handle.y === -1) {
    const y = clamp(next.y + dy, 0, next.y + next.h - MIN_ELEMENT_H);
    next.h += next.y - y;
    next.y = y;
  } else if (handle.y === 1) {
    next.h = clamp(next.h + dy, MIN_ELEMENT_H, 100 - next.y);
  }

  return {
    ...next,
    x: roundGeometry(next.x),
    y: roundGeometry(next.y),
    w: roundGeometry(next.w),
    h: roundGeometry(next.h),
  };
}

/**
 * The label at a workable size, with every element on it draggable.
 *
 * The design is drawn once, by the same `Label` the printer gets; the boxes
 * that can be grabbed are a second, empty copy of the label laid over it. A
 * drag is measured in screen pixels, divided by the zoom and by the canvas's
 * own size, and comes out as the percentages the template is written in — so
 * the element lands where it was dropped at any zoom, on any stock.
 */
export function LabelCanvas({
  template,
  product,
  selectedId,
  onSelect,
  onChange,
}) {
  const { t } = useTranslation();
  const [stageRef, stageWidth, stageHeight] = useMeasure();
  const drag = useRef(null);

  const pixelWidth = template.width * PX_PER_MM;
  const pixelHeight = template.height * PX_PER_MM;

  const room = (available, needed) =>
    available > 0 ? Math.max(available - STAGE_PADDING * 2, 1) / needed : MAX_ZOOM;
  const zoom = clamp(
    Math.min(room(stageWidth, pixelWidth), room(stageHeight, pixelHeight)),
    MIN_ZOOM,
    MAX_ZOOM,
  );

  // The canvas is what the margin leaves of the face, and on a rotated design
  // the face is the stock on its side. Percentages are shares of this box.
  const faceWidth = template.rotate ? template.height : template.width;
  const faceHeight = template.rotate ? template.width : template.height;
  const canvasWidth = Math.max(faceWidth - template.margin * 2, 1) * PX_PER_MM;
  const canvasHeight = Math.max(faceHeight - template.margin * 2, 1) * PX_PER_MM;

  const asPercent = (dx, dy) => {
    const local = toLocal(dx, dy, template.rotate);
    return {
      dx: (local.x / zoom / canvasWidth) * 100,
      dy: (local.y / zoom / canvasHeight) * 100,
    };
  };

  function beginDrag(event, id, mode) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      id,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      box: template.elements[id],
    };
    onSelect(id);
  }

  function continueDrag(event) {
    const state = drag.current;
    if (!state) return;
    const { dx, dy } = asPercent(
      event.clientX - state.startX,
      event.clientY - state.startY,
    );
    onChange(
      state.id,
      state.mode === "move"
        ? moveBox(state.box, dx, dy)
        : resizeBox(state.box, state.mode, dx, dy),
    );
  }

  function endDrag(event) {
    if (!drag.current) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  // Arrows nudge in the same direction the element appears to move on screen,
  // which on a rotated design is not the direction its own x and y run.
  function onKeyDown(event, id) {
    const step = event.shiftKey ? 5 : 1;
    const screen = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }[event.key];
    if (!screen) return;

    event.preventDefault();
    const local = toLocal(screen[0], screen[1], template.rotate);
    onChange(id, moveBox(template.elements[id], local.x, local.y));
  }

  const dragHandlers = {
    onPointerMove: continueDrag,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };

  return (
    <div
      ref={stageRef}
      className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4"
    >
      <div
        className="relative shrink-0"
        style={{ width: pixelWidth * zoom, height: pixelHeight * zoom }}
      >
        <div
          className="label-preview rounded-sm border border-line"
          style={{ width: pixelWidth * zoom, height: pixelHeight * zoom }}
        >
          <div
            style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
          >
            <Label product={product} template={template} />
          </div>
        </div>

        <div
          className={`label designer-overlay${
            template.rotate ? " label--rotated" : ""
          }`}
          style={{
            "--label-w": `${template.width}mm`,
            "--label-h": `${template.height}mm`,
            transform: `scale(${zoom})`,
          }}
        >
          <div className="label-face">
            <div className="label-canvas" style={canvasStyle(template)}>
              {LABEL_ELEMENTS.map(({ id, labelKey }) => {
                const element = template.elements[id];
                if (!element.visible) return null;
                const selected = id === selectedId;

                return (
                  <div
                    key={id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selected}
                    aria-label={t("lbl.move", { name: t(labelKey) })}
                    className={`designer-box${
                      selected ? " designer-box--selected" : ""
                    }`}
                    style={boxStyle(element)}
                    onPointerDown={(event) => beginDrag(event, id, "move")}
                    onKeyDown={(event) => onKeyDown(event, id)}
                    onFocus={() => onSelect(id)}
                    {...dragHandlers}
                  >
                    {selected
                      ? HANDLES.map((handle) => (
                          <div
                            key={handle.id}
                            className="designer-handle"
                            style={{
                              left: `${50 + handle.x * 50}%`,
                              top: `${50 + handle.y * 50}%`,
                              cursor: rotatedCursor(handle, template.rotate),
                            }}
                            onPointerDown={(event) =>
                              beginDrag(event, id, handle)
                            }
                            {...dragHandlers}
                          />
                        ))
                      : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The cursor for a handle, turned with the design so it still points along
 * the edge it drags. */
function rotatedCursor(handle, rotated) {
  const vector = rotated ? { x: -handle.y, y: handle.x } : handle;
  return CURSORS[`${vector.x},${vector.y}`];
}
