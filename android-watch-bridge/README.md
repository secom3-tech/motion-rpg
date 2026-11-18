# Motion RPG 워치4 컬 센서 + 폴드6 게임 연결

갤럭시 워치4(Wear OS)에서 컬 한 번을 인식해 폴드6에서 실행 중인 Motion RPG 3D 전투로 보냅니다. v0.51부터는 실시간 심박수, 운동 근육 표시, 보정 상태 기억을 지원합니다.

## 구성

- `wear`: 워치4에 설치하는 네이티브 Java 앱. 중력 센서(없으면 가속도 센서)로 아래/위 두 자세를 보정하고, 충분히 올라갔다 제자리로 돌아오는 반복을 1회로 계산합니다. 이벤트만 전송하며 실시간 원시 센서 기록/건강 기록은 저장하거나 업로드하지 않습니다.
- **심박수**: Galaxy Watch4의 `TYPE_HEART_RATE` 센서를 사용해 앱이 켜져 있는 동안 읽습니다. 첫 실행에 `BODY_SENSORS` 허용을 요청합니다. 값이 없거나 오래되면 BPM은 `--`로 표시됩니다. 혈액량·건강 데이터는 기록하거나 저장하지 않습니다. 실시간 값만 현재 페어링된 폴드6로 전달됩니다.
- **운동 시각화**: 폴드6 작은 전신 실루엣에서 워치 컬이면 팔, 폴드6 카메라의 숙이기 회피이면 하체를 강조합니다. 이는 운동 분류에 따른 안내이며 실제 근육 활성 측정이 아닙니다.
- **보정 재사용**: 첫 운동의 아래/위 중력 벡터를 워치 앱 안에 저장합니다. 착용 위치/시계 방향이 바뀌면 재보정하세요. 
- `mobile`: 폴드6에 설치하는 네이티브 Java 앱. Wear OS Data Layer의 `MessageClient`로 수신해 기존 GitHub Pages `indoor.html?mode=dumbbell&input=watch`를 여는 Android WebView에 넘깁니다.
- 앱 ID `com.motionrpg.watchbridge`와 서명이 양 기기에서 동일해야 합니다. 서로 다른 GitHub Actions 실행에서 받은 디버그 APK는 서명이 달라질 수 있으므로 반드시 같은 실행의 두 APK를 사용하세요.
- 기존 S21 컨트롤러와 S21 암밴드 웹앱, 일반 Motion RPG는 건드리지 않습니다.
- 폴드6 WebView와 기존 Chrome 웹브라우저는 별도 localStorage를 가집니다. 테스트용 캐릭터 데이터는 따로 시작될 수 있습니다.

## APK 다운로드

[GitHub Actions — Build Galaxy Watch4 and Fold6 debug APKs](https://github.com/secom3-tech/motion-rpg/actions/workflows/watch-apk.yml)에서 **성공한 최신 실행**을 누르고 `watch4-fold6-debug-apks` 아티팩트를 다운로드합니다. 로그인해야 아티팩트가 보일 수 있습니다. ZIP의 `mobile-debug.apk`는 폴드6에, `wear-debug.apk`는 워치4에 설치하세요.

### 워치 설치 (PC에서 ADB 이용)

워치4에서 설정 → 워치 정보 → 소프트웨어 정보 → 소프트웨어 버전을 여러 차례 눌러 개발자 옵션을 활성화한 뒤 무선 디버깅을 켭니다. 이후 워치와 PC가 같은 Wi-Fi에 있는지 확인합니다. 실제 메뉴 이름은 Wear OS 버전에 따라 다를 수 있습니다.

```sh
adb pair WATCH_IP:PAIR_PORT
adb connect WATCH_IP:DEBUG_PORT
adb -s WATCH_IP:DEBUG_PORT install -r wear-debug.apk
```

무선 디버깅에는 **페어링 포트와 연결 포트가 서로 다를 수 있습니다**. 이미 다른 서명의 같은 패키지가 설치돼 있다면 양쪽 앱을 삭제하고 새 APK를 설치해야 합니다. 폴드6 설치는 내려받은 `mobile-debug.apk`를 눌러 설치하거나 PC에서 `adb install mobile-debug.apk`를 사용할 수 있습니다.

## 테스트

1. Galaxy Wearable로 워치4를 폴드6에 연결하고, 두 기기에 동일 CI 실행의 앱 설치.
2. 폴드6에서 `Motion RPG 워치 연결` 실행 → 3D 사냥 화면 확인. 처음엔 카메라 권한 선택.
3. 워치의 `Motion RPG 컬` 실행 → `센서 켜기` → 심박 권한 허용(선택).
4. 처음 1회는 팔 아래에 1초 고정 → 아래 자세 보정 → 팔 위에 1초 고정 → 위 자세 보정. 이후 같은 착용 방향이라면 보정값 자동 재사용.
5. 폴드6에서 아령 사냥 시작하기(카메라 회피 권한은 선택). 다시 아래 자세로 돌아간 뒤 컬 5회. 워치 횟수가 5인지, 폴드6 상단에 메시지가 들어오는지, 전투가 시작됐을 때 공격이 5회 정도 발생하는지 확인.
6. 인식 실패 시 다른 손목, 착용 방향, 보정 자세를 바꿔 비교. 센서가 곧 정확한 운동 자세 판정을 의미하지는 않습니다.

**운영 주의:** 모션 센서는 워치 앱이 화면에 열린 동안 작동합니다. 화면이 자동으로 꺼지거나 다른 앱으로 전환하면 센서 측정이 중단될 수 있습니다. 워치4 배터리 소모를 확인하세요. 현재 디버그 서명은 GitHub 실행마다 달라질 수 있어, 다른 빌드 APK로 갱신하려면 이전 앱 삭제가 필요할 수 있습니다. 실제 실기기 통신·운동 판정은 아직 검증되지 않았습니다.

**안전:** 한쪽 손목만 읽는 실험이고, 아령 중량·자세 적합성·다른 팔은 인식하지 않습니다. 워치를 꼭 맞게 착용하고, 저중량부터 느리게 실험하세요. 앱이 화면에서 사라지면 센서 수집을 멈춥니다.

## 개발

Android Studio에서 `android-watch-bridge/` 폴더 열기. JDK17, Android SDK35, Gradle8.11.1, Android Gradle Plugin8.9.2, Wearable Google Play services20.0.1.

```sh
gradle -p android-watch-bridge :wear:testDebugUnitTest :wear:assembleDebug :mobile:assembleDebug
```

Google 공식 API: `SensorManager` / Wear OS `Wearable.getMessageClient()`, `Wearable.getNodeClient()`. 네트워크는 웹게임에만 필요합니다.
