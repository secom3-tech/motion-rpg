package com.motionrpg.watchbridge.wear;

import android.app.Activity;
import android.Manifest;
import android.content.pm.PackageManager;
import android.content.SharedPreferences;
import android.os.BatteryManager;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Bundle;
import android.os.SystemClock;
import android.graphics.Color;
import android.view.Gravity;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import com.google.android.gms.wearable.MessageClient;
import com.google.android.gms.wearable.Wearable;
import com.google.android.gms.wearable.Node;

import org.json.JSONObject;
import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** Galaxy Watch4 foreground-only curl and optional live heart-rate sensor.
 * No fitness or heart-rate history is stored or uploaded. */

public final class WatchActivity extends Activity implements SensorEventListener {
    private static final String PATH="/motion-rpg/curl";
    private static final String ACK_PATH="/motion-rpg/ack";
    private static final String PREFS="motion-rpg-curl-calibration";
    private static final int HR_PERMISSION_REQUEST=172;
    private final String sessionId=UUID.randomUUID().toString();

    private SensorManager manager;
    private Sensor gravity;
    private Sensor heartSensor;
    private int heartBpm=0;
    private long lastHeartAt=0;
    private boolean heartRegistered=false;
    private TextView heartView;
    private boolean running=false;
    private boolean fallbackAccel=false;
    private final float[] filter={0,0,0};
    private boolean hasFilter=false;
    private final CurlCounter counter=new CurlCounter();
    private final ArrayDeque<Sample> recent=new ArrayDeque<>();
    private TextView countView,phaseView,statusView,linkView;
    private Button startButton,downButton,upButton;
    private long lastDisplay=0,lastSend=0,lastHeartbeat=0;
    private int seq=0;
    private final MessageClient.OnMessageReceivedListener acknowledgements=event->{
        if(!ACK_PATH.equals(event.getPath()))return;
        try {
            JSONObject data=new JSONObject(new String(event.getData(),StandardCharsets.UTF_8));
            final boolean accepted=data.optBoolean("accepted",false);
            runOnUiThread(()->linkView.setText(accepted?
                "폴드6 전투: 공격 인정됨":"폴드6: 전투 미시작·대기 또는 통신 확인 필요"));
        } catch(Exception ignored) { }
    };
    private static final class Sample {
        final long at;final float[] v;
        Sample(long at,float[] v){this.at=at;this.v=v.clone();}
    }
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        manager=(SensorManager)getSystemService(SENSOR_SERVICE);
        heartSensor=manager.getDefaultSensor(Sensor.TYPE_HEART_RATE);
        restoreCalibration();
        gravity=manager.getDefaultSensor(Sensor.TYPE_GRAVITY);
        if(gravity==null){
            gravity=manager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
            fallbackAccel=true;
        }
        ScrollView scroll=new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(Color.rgb(14,29,33));
        LinearLayout layout=new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(20,12,20,28);
        layout.setGravity(Gravity.CENTER_HORIZONTAL);
        scroll.addView(layout);
        TextView title=text("MOTION RPG",17,Color.rgb(163,220,187));
        layout.addView(title);
        countView=text("0",72,Color.rgb(187,254,195));layout.addView(countView);
        phaseView=text(counter.getPhaseText(),17,Color.WHITE);layout.addView(phaseView);
        heartView=text("♥ -- BPM",21,0xffffb1a6);layout.addView(heartView);
        startButton=button("센서 켜기");
        downButton=button("① 아래 자세 보정");
        upButton=button("② 위 자세 보정");
        downButton.setEnabled(false);upButton.setEnabled(false);
        layout.addView(startButton);layout.addView(downButton);layout.addView(upButton);
        Button reset=button("횟수 초기화");layout.addView(reset);
        Button ping=button("휴대폰 연결 확인");layout.addView(ping);
        statusView=text(counter.isCalibrated()?
            "이전 운동 보정 적용 · 착용 방향이 달라졌다면 아래/위 자세를 다시 보정해.":
            "워치를 착용한 상태에서 아래·위 자세를 각각 1초간 유지하고 눌러.",12,0xffc3d7d0);
        layout.addView(statusView);
        linkView=text("폴드6 연결 앱 실행 필요",12,0xffe7c891);layout.addView(linkView);
        setContentView(scroll);
        startButton.setOnClickListener(v->{
            if(running){stopSensor();return;}
            if(gravity==null){statusView.setText("중력·가속도 센서를 찾을 수 없어.");return;}
            hasFilter=false;recent.clear();
            running=manager.registerListener(this,gravity,SensorManager.SENSOR_DELAY_GAME);
            if(!running){statusView.setText("센서 등록 실패");return;}
            startButton.setText("센서 끄기");
            downButton.setEnabled(true);upButton.setEnabled(true);
            statusView.setText(counter.isCalibrated()?
                "센서 수신 중 · 팔을 아래로 내리고 천천히 운동해.":"센서 수신 중 · 아래/위 두 자세를 보정해.");
            startHeartRate();
            send("status");
        });
        downButton.setOnClickListener(v->{
            float[] avg=averageStable();
            if(avg==null){statusView.setText("아래 자세가 흔들리고 있어. 1초 유지 후 다시 눌러.");return;}
            counter.setDown(avg);countView.setText("0");
            SharedPreferences.Editor edit=getPreferences(MODE_PRIVATE).edit().clear();
            for(int i=0;i<3;i++)edit.putFloat("down"+i,avg[i]);
            edit.apply();
            phaseView.setText("아래 자세 기록됨");
            statusView.setText("이제 팔꿈치를 굽혀 위 자세를 1초 유지하고 기록해.");
            send("status");
        });
        upButton.setOnClickListener(v->{
            float[] avg=averageStable();
            if(avg==null){statusView.setText("위 자세 센서값 부족 · 잠시 고정해.");return;}
            if(!counter.setUp(avg)){statusView.setText("각도 차이가 부족해. 더 충분히 굽히거나 착용 방향을 확인해.");return;}
            saveCalibration(avg);
            countView.setText("0");
            phaseView.setText("팔을 아래로 내리고 시작");
            statusView.setText("보정 완료 · 천천히 1회 들고 끝까지 내려. 반동은 피해야 해.");
            send("status");
        });
        reset.setOnClickListener(v->{
            counter.reset();countView.setText("0");
            phaseView.setText(counter.getPhaseText());
            statusView.setText("횟수 초기화 · 보정은 유지");
            send("status");
        });
        ping.setOnClickListener(v->send("status"));
    }
    private TextView text(String value,int size,int color){
        TextView t=new TextView(this);t.setText(value);t.setTextColor(color);
        t.setTextSize(size);t.setGravity(Gravity.CENTER);
        t.setPadding(3,4,3,7);return t;
    }
    private Button button(String value){
        Button b=new Button(this);b.setText(value);b.setTextSize(13);
        b.setAllCaps(false);
        b.setMinHeight(45);
        b.setLayoutParams(new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,LinearLayout.LayoutParams.WRAP_CONTENT));
        return b;
    }
    private void stopSensor(){
        manager.unregisterListener(this);running=false;heartRegistered=false;
        heartBpm=0;lastHeartAt=0;heartView.setText("♥ -- BPM");
        recent.clear();startButton.setText("센서 켜기");
        downButton.setEnabled(false);upButton.setEnabled(false);
        statusView.setText("센서 중지 · 다시 켠 뒤 운동할 수 있어.");
        send("status");
    }
    private float[] averageStable(){
        long now=SystemClock.elapsedRealtime();
        List<float[]> samples=new ArrayList<>();
        for(Sample s:recent)if(now-s.at<=900)samples.add(s.v);
        if(samples.size()<9)return null;
        float[] avg={0,0,0};
        for(float[] v:samples)for(int i=0;i<3;i++)avg[i]+=v[i]/samples.size();
        double length=Math.sqrt(avg[0]*avg[0]+avg[1]*avg[1]+avg[2]*avg[2]);
        if(length<.75)return null;
        for(int i=0;i<3;i++)avg[i]/=(float)length;
        double variance=0;
        for(float[] v:samples)for(int i=0;i<3;i++)variance+=(v[i]-avg[i])*(v[i]-avg[i]);
        return variance/samples.size()<=.075?avg:null;
    }
    @Override public void onSensorChanged(SensorEvent e){
        if(!running)return;
        if(e.sensor.getType()==Sensor.TYPE_HEART_RATE){
            if(e.values.length>0&&e.values[0]>=35&&e.values[0]<=230){
                heartBpm=Math.round(e.values[0]);
                lastHeartAt=SystemClock.elapsedRealtime();
                heartView.setText("♥ "+heartBpm+" BPM");
                if(lastHeartAt-lastSend>2000)send("status");
            }
            return;
        }
        float[] v=new float[3];
        float norm=0;
        for(int i=0;i<3;i++){
            float raw=e.values[i];
            if(fallbackAccel){
                filter[i]=hasFilter ? .82f*filter[i]+.18f*raw : raw;
                raw=filter[i];
            }
            v[i]=raw;norm+=raw*raw;
        }
        hasFilter=true;
        norm=(float)Math.sqrt(norm);
        if(norm<5||norm>16)return;
        for(int i=0;i<3;i++)v[i]/=norm;
        long now=SystemClock.elapsedRealtime();
        recent.addLast(new Sample(now,v));
        while(!recent.isEmpty()&&now-recent.peekFirst().at>1200)recent.removeFirst();
        boolean rep=counter.feed(v,now);
        if(rep){
            countView.setText(String.valueOf(counter.getRepetitions()));
            send("rep");
        }
        if(now-lastHeartbeat>3000){lastHeartbeat=now;send("status");}
        if(now-lastDisplay>120){
            phaseView.setText(counter.getPhaseText());
            lastDisplay=now;
        }
    }
    @Override public void onAccuracyChanged(Sensor s,int accuracy) {}
    /** Keep the once-set posture calibration across subsequent launches. */
    private void saveCalibration(float[] up){
        SharedPreferences prefs=getPreferences(MODE_PRIVATE);
        SharedPreferences.Editor edit=prefs.edit();
        edit.putBoolean("ready",true);
        for(int i=0;i<3;i++)edit.putFloat("up"+i,up[i]);
        // The down posture is saved when the user records it, before the upper posture.
        edit.apply();
    }
    private void restoreCalibration(){
        SharedPreferences prefs=getPreferences(MODE_PRIVATE);
        if(!prefs.getBoolean("ready",false))return;
        float[] down=new float[3],up=new float[3];
        for(int i=0;i<3;i++){down[i]=prefs.getFloat("down"+i,0);up[i]=prefs.getFloat("up"+i,0);}
        if(!counter.setDown(down)||!counter.setUp(up))prefs.edit().clear().apply();
    }
    private void startHeartRate(){
        if(heartSensor==null){heartView.setText("♥ 센서 지원 안 함");return;}
        if(checkSelfPermission(Manifest.permission.BODY_SENSORS)!=PackageManager.PERMISSION_GRANTED){
            heartView.setText("♥ 심박 권한 요청");
            requestPermissions(new String[]{Manifest.permission.BODY_SENSORS},HR_PERMISSION_REQUEST);
            return;
        }
        if(!running)return;
        try{
            heartRegistered=manager.registerListener(this,heartSensor,SensorManager.SENSOR_DELAY_NORMAL);
            if(!heartRegistered)heartView.setText("♥ 센서 연결 실패");
            else heartView.setText("♥ 측정 중...");
        }catch(SecurityException ex){heartView.setText("♥ 권한 확인 필요");}
    }
    @Override public void onRequestPermissionsResult(int request,String[] permissions,int[] results){
        super.onRequestPermissionsResult(request,permissions,results);
        if(request!=HR_PERMISSION_REQUEST)return;
        if(results.length>0&&results[0]==PackageManager.PERMISSION_GRANTED)startHeartRate();
        else heartView.setText("♥ 권한 없음 · 운동 인식은 가능");
    }

    /** The phone app and watch app share the same application ID and signing key. */
    private void send(String event){
        if(!"rep".equals(event)&&SystemClock.elapsedRealtime()-lastSend<200)return;
        lastSend=SystemClock.elapsedRealtime();
        try {
            JSONObject data=new JSONObject();
            data.put("event",event);
            data.put("seq",++seq);
            data.put("session",sessionId);
            data.put("mode","curl");
            data.put("reps",counter.getRepetitions());
            data.put("sensorActive",running);
            boolean hrFresh=heartBpm>=35&&SystemClock.elapsedRealtime()-lastHeartAt<=12000;
            data.put("bpm",hrFresh?heartBpm:JSONObject.NULL);
            BatteryManager battery=(BatteryManager)getSystemService(BATTERY_SERVICE);
            if(battery!=null){
                int level=battery.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY);
                if(level>=0&&level<=100)data.put("battery",level);
            }
            data.put("calibrated",counter.isCalibrated());
            data.put("time",System.currentTimeMillis());
            byte[] payload=data.toString().getBytes(StandardCharsets.UTF_8);
            Wearable.getNodeClient(this).getConnectedNodes()
                .addOnSuccessListener(nodes->{
                    if(nodes.isEmpty()){
                        linkView.setText("폴드6 연결 앱을 켜고 워치 연결을 확인해.");
                        return;
                    }
                    for(Node n:nodes)Wearable.getMessageClient(this).sendMessage(
                        n.getId(),PATH,payload)
                        .addOnSuccessListener(id->{
                            if(!"rep".equals(event))linkView.setText("폴드6 메시지 전송됨");
                        })
                        .addOnFailureListener(err->linkView.setText("전송 실패: "+err.getMessage()));
                })
                .addOnFailureListener(err->linkView.setText("연결 확인 실패: "+err.getMessage()));
        } catch(Exception ex) {
            linkView.setText("센서 전송 오류");
        }
    }
    @Override protected void onStart(){
        super.onStart();
        Wearable.getMessageClient(this).addListener(acknowledgements);
    }
    @Override protected void onStop(){
        Wearable.getMessageClient(this).removeListener(acknowledgements);
        super.onStop();
    }
    @Override protected void onPause(){
        if(running){manager.unregisterListener(this);running=false;heartRegistered=false;}
        super.onPause();
    }
    @Override protected void onResume(){
        super.onResume();
        if(startButton!=null&&!running){
            startButton.setText("센서 켜기");
            downButton.setEnabled(false);upButton.setEnabled(false);
        }
    }
}
