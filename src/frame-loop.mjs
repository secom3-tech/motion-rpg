/**
 * Enqueue the next animation frame before game updates or rendering.
 * A single rejected frame cannot permanently terminate the combat loop.
 */
export function runFrameSafely(scheduleNext, update, render, onError){
 scheduleNext();
 try{update();}catch(error){onError("update",error);return;}
 try{render();}catch(error){onError("render",error);}
}
