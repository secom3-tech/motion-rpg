/* GPS expedition signal feedback. A location fix is not the same as recorded movement. */
export const GPS_ACCURACY_LIMIT_METERS = 45;
const STATES = {
  idle: {label:"GPS 대기",detail:"GPS 달리기나 산책을 선택하면 위치 연결을 확인해.",voice:"",tone:"idle"},
  waiting: {label:"GPS 연결 확인 중",detail:"위치 권한과 위성 신호를 확인하고 있어. 연결 전에는 기록이 시작되지 않아.",voice:"GPS 신호를 확인하고 있어요. 연결되면 알려드릴게요.",tone:"waiting"},
  weak: {label:"GPS 신호 불안정",detail:"위치 정확도가 낮아 이동 기록을 잠시 보류하고 있어.",voice:"GPS 신호가 불안정해요. 정확한 위치를 기다리고 있어요.",tone:"warning"},
  connected: {label:"GPS 위치 확인 완료",detail:"정확한 위치를 수신했어. 움직임이 확인되면 거리와 시간이 기록돼.",voice:"GPS 연결이 확인됐어요. 이제 이동 기록을 시작할 수 있어요.",tone:"good"},
  recording: {label:"GPS 이동 기록 중",detail:"실제 위치 변화를 확인하며 시간과 이동 거리를 기록 중이야.",voice:"GPS 이동 기록이 시작됐어요. 안전하게 탐험하세요.",tone:"good"},
  exploring: {label:"GPS 산책 탐색 중",detail:"정상적인 GPS 위치 확인 중이야. 멈춰 있어도 탐색 시간은 기록되며 실제 이동거리만 별도로 계산해.",voice:"",tone:"good"},
  lost: {label:"GPS 신호 끊김",detail:"최근 위치 갱신이 없어 기록이 일시 중단됐어. 신호가 돌아오면 이어서 기록해.",voice:"GPS 신호가 끊겼어요. 기록을 잠시 멈추고 다시 연결을 기다릴게요.",tone:"warning"},
  denied: {label:"GPS 위치 권한 거부",detail:"브라우저의 위치 권한을 허용해야 GPS 원정을 진행할 수 있어.",voice:"GPS 위치 권한이 꺼져 있어요. 위치 권한을 확인해 주세요.",tone:"error"},
  unsupported: {label:"GPS 사용 불가",detail:"이 브라우저는 위치 기능을 지원하지 않아.",voice:"이 브라우저에서는 GPS 위치 기능을 사용할 수 없어요.",tone:"error"},
  error: {label:"GPS 연결 오류",detail:"위치를 받아오지 못했어. 인터넷과 위치 설정을 확인해.",voice:"GPS 위치를 가져올 수 없어요. 연결 상태를 확인해 주세요.",tone:"error"},
  ended: {label:"GPS 원정 종료",detail:"위치 기록을 종료했어.",voice:"",tone:"idle"}
};
export function gpsFeedback(state,accuracyMeters=null) {
  const item=STATES[state]||STATES.error;
  const accuracy=Number.isFinite(accuracyMeters)&&accuracyMeters>=0?" · 정확도 ±"+Math.round(accuracyMeters)+"m":"";
  return {...item,state, label:item.label+(["weak","connected","recording"].includes(state)?accuracy:"")};
}
