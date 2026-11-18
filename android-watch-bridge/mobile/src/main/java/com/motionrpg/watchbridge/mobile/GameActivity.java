package com.motionrpg.watchbridge.mobile;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.ViewGroup;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;

import com.google.android.gms.wearable.MessageClient;
import com.google.android.gms.wearable.Wearable;

import org.json.JSONObject;
import java.nio.charset.StandardCharsets;

/**
 * Fold6 companion: hosts the existing GitHub Pages 3D game in a WebView.
 * Watches communicate with this native app through the official Wear OS
 * Data Layer; no localhost server, 3rd-party relay, or JS bridge is exposed.
 */
public final class GameActivity extends Activity {
    private static final String GAME_URL =
        "https://secom3-tech.github.io/motion-rpg/indoor.html?v=0.50&mode=dumbbell&input=watch";
    private static final String PATH="/motion-rpg/curl";
    private static final String ACK_PATH="/motion-rpg/ack";
    private static final int CAMERA_REQUEST=381;
    private WebView game;
    private TextView status;
    private long latestSeq=-1;
    private PermissionRequest cameraPermission;
    private boolean pageLoaded=false;
    private final MessageClient.OnMessageReceivedListener watchListener=event->{
        if(!PATH.equals(event.getPath()))return;
        try{
            JSONObject payload=new JSONObject(new String(event.getData(),StandardCharsets.UTF_8));
            String kind=payload.optString("event","");
            int seq=payload.optInt("seq",-1);
            if(seq<0||seq<=latestSeq)return;
            latestSeq=seq;
            int count=payload.optInt("reps",0);
            boolean calibrated=payload.optBoolean("calibrated",false);
            String sourceNode=event.getSourceNodeId();
            runOnUiThread(()->{
                status.setText(!calibrated?"워치4 수신 · 아래/위 자세를 보정해":
                    ("rep".equals(kind)?"워치 컬 "+count+"회 감지 · 게임 판정 중":"워치4 연결 · 운동 준비"));
                if(!"rep".equals(kind)||!calibrated)return;
                if(!pageLoaded){ack(sourceNode,seq,false);return;}
                // JSONObject is serialized JSON, not concatenated untrusted JS.
                String script="!!(window.motionRpgWatchInput && window.motionRpgWatchInput("+payload+"))";
                game.evaluateJavascript(script,value->{
                    boolean accepted="true".equals(value);
                    status.setText(accepted?"워치4 · "+count+"회 · 공격 실행":
                        "워치4 · "+count+"회 · 공격 대기 / 전투 시작 확인");
                    ack(sourceNode,seq,accepted);
                });
            });
        }catch(Exception error){
            runOnUiThread(()->status.setText("워치 센서 메시지 해석 실패"));
        }
    };
    private void ack(String node,int seq,boolean accepted){
        try{
            JSONObject response=new JSONObject();
            response.put("seq",seq);response.put("accepted",accepted);
            Wearable.getMessageClient(this).sendMessage(node,ACK_PATH,
                response.toString().getBytes(StandardCharsets.UTF_8));
        } catch(Exception ignored){}
    }
    @Override public void onCreate(Bundle savedState){
        super.onCreate(savedState);
        FrameLayout root=new FrameLayout(this);
        game=new WebView(this);
        game.setBackgroundColor(Color.rgb(17,30,34));
        WebSettings settings=game.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(false);
        game.setWebViewClient(new WebViewClient(){
            @Override public void onPageFinished(WebView view,String url){
                pageLoaded=isTrusted(url);
                status.setText(pageLoaded?"폴드6 게임 열림 · 워치4 앱을 켜고 보정해":
                    "게임 주소 확인 필요");
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
                if(isTrusted(request.getUrl().toString()))return false;
                try{startActivity(new Intent(Intent.ACTION_VIEW,request.getUrl()));}
                catch(Exception ignored){}
                return true;
            }
        });
        game.setWebChromeClient(new WebChromeClient(){
            @Override public void onPermissionRequest(PermissionRequest request){
                Uri origin=request.getOrigin();
                if(!"https".equals(origin.getScheme())||
                    !"secom3-tech.github.io".equals(origin.getHost())){
                    request.deny();return;
                }
                boolean cameraAsked=false;
                for(String item:request.getResources())
                    if(PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(item))cameraAsked=true;
                if(!cameraAsked){request.deny();return;}
                if(checkSelfPermission(Manifest.permission.CAMERA)==PackageManager.PERMISSION_GRANTED){
                    request.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                }else{
                    cameraPermission=request;
                    requestPermissions(new String[]{Manifest.permission.CAMERA},CAMERA_REQUEST);
                }
            }
            @Override public void onPermissionRequestCanceled(PermissionRequest request){
                if(cameraPermission==request)cameraPermission=null;
            }
        });
        root.addView(game,new FrameLayout.LayoutParams(-1,-1));
        status=new TextView(this);
        status.setText("폴드6 연결 앱 · 워치4 대기");
        status.setTextSize(12);
        status.setTextColor(Color.WHITE);
        status.setBackgroundColor(0xd9214039);
        status.setPadding(14,8,14,8);
        FrameLayout.LayoutParams banner=new FrameLayout.LayoutParams(-1,-2,Gravity.TOP);
        root.addView(status,banner);
        setContentView(root);
        game.loadUrl(GAME_URL);
    }
    private boolean isTrusted(String raw){
        try{
            Uri u=Uri.parse(raw);
            return "https".equals(u.getScheme())&&"secom3-tech.github.io".equals(u.getHost())&&
                u.getPath()!=null&&u.getPath().startsWith("/motion-rpg/");
        }catch(Exception ignored){return false;}
    }
    @Override public void onRequestPermissionsResult(int req,String[] names,int[] grants){
        super.onRequestPermissionsResult(req,names,grants);
        if(req!=CAMERA_REQUEST||cameraPermission==null)return;
        if(grants.length>0&&grants[0]==PackageManager.PERMISSION_GRANTED)
            cameraPermission.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
        else cameraPermission.deny();
        cameraPermission=null;
    }
    @Override protected void onStart(){
        super.onStart();
        Wearable.getMessageClient(this).addListener(watchListener);
    }
    @Override protected void onStop(){
        Wearable.getMessageClient(this).removeListener(watchListener);
        super.onStop();
    }
    @Override protected void onPause(){game.onPause();super.onPause();}
    @Override protected void onResume(){super.onResume();if(game!=null)game.onResume();}
    @Override public void onBackPressed(){
        if(game.canGoBack())game.goBack();else super.onBackPressed();
    }
    @Override protected void onDestroy(){
        game.destroy();super.onDestroy();
    }
}
