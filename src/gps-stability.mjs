/** GPS status for walks with frequent long dog-sniff stops. Pure timing rules. */
export const GPS_SILENCE_WARNING_MS = 120000;
export const GPS_WEAK_DISPLAY_MS = 12000;
/** A quiet or stationary walker is not proof the GPS connection has failed. */
export function gpsSilenceIsProlonged(lastGoodAt,now=Date.now()){
 return Number.isFinite(lastGoodAt)&&lastGoodAt>0&&Number.isFinite(now)&&now-lastGoodAt>=GPS_SILENCE_WARNING_MS;
}
/** Short accuracy dips should not spam the walk display. */
export function gpsAccuracyWarningDue(weakSince,now=Date.now()){
 return Number.isFinite(weakSince)&&weakSince>0&&Number.isFinite(now)&&now-weakSince>=GPS_WEAK_DISPLAY_MS;
}
/**
 * Speak startup, a first accurate fix, genuine prolonged loss, and fatal errors.
 * Recoveries and stationary/moving state changes remain silent.
 */
export function gpsStatusShouldSpeak(previous,next,{firstFix=false}={}){
 if(previous===next)return false;
 if(next==="connected")return firstFix;
 return ["waiting","lost","denied","unsupported","error"].includes(next);
}
