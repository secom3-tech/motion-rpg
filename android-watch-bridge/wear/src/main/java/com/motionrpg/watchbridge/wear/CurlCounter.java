package com.motionrpg.watchbridge.wear;

/** No Android dependencies: testable controlled-curl detector. */
public final class CurlCounter {
    private float[] down, up, smooth;
    private int phase = -1, repetitions = 0;
    private long startedAt, topAt, lastRepAt = Long.MIN_VALUE / 2;
    private float progress;

    public boolean isCalibrated() { return down != null && up != null; }
    public int getRepetitions() { return repetitions; }
    public float getProgress() { return progress; }
    public String getPhaseText() {
        if (!isCalibrated()) return "아래/위 자세 보정 필요";
        switch (phase) {
            case -1: return "팔을 아래로 내리고 시작";
            case 0: return "팔 아래 · 천천히 들기";
            case 1: return "들고 있는 중";
            default: return "천천히 내리는 중";
        }
    }
    public boolean setDown(float[] direction) {
        if (!valid(direction)) return false;
        down = direction.clone();
        up = null;
        reset();
        return true;
    }
    public boolean setUp(float[] direction) {
        if (down == null || !valid(direction)) return false;
        float separation = 0;
        for (int i=0;i<3;i++) separation += (direction[i]-down[i])*(direction[i]-down[i]);
        if (separation < .20f*.20f) return false;
        up = direction.clone();
        reset();
        return true;
    }
    public void reset() {
        smooth = null;
        phase = -1; repetitions = 0; startedAt = 0; topAt = 0;
        lastRepAt = Long.MIN_VALUE / 2; progress = 0;
    }
    private static boolean valid(float[] v) {
        if (v == null || v.length != 3) return false;
        double length = 0;
        for (float n : v) {
            if (Float.isNaN(n) || Float.isInfinite(n)) return false;
            length += n*n;
        }
        return length >= .5 && length <= 1.5;
    }
    /** A completed lift-and-return is one action; does not reward speed. */
    public boolean feed(float[] vector, long now) {
        if (!isCalibrated() || !valid(vector)) return false;
        if (smooth == null) smooth = vector.clone();
        else for(int i=0;i<3;i++) smooth[i] = smooth[i]*.65f + vector[i]*.35f;
        float d2=0, dot=0;
        for(int i=0;i<3;i++) {
            float delta = up[i]-down[i];
            dot += (smooth[i]-down[i])*delta;
            d2 += delta*delta;
        }
        progress = Math.max(0,Math.min(1,dot/Math.max(.001f,d2)));
        if(phase == -1) {
            if(progress <= .17f) phase = 0;
        } else if(phase == 0) {
            if(progress >= .30f){phase=1;startedAt=now;}
        } else if(phase == 1) {
            if(progress >= .76f && now-startedAt >= 270){phase=2;topAt=now;}
            else if(progress < .16f || now-startedAt>12000){phase=0;startedAt=0;}
        } else if(phase == 2) {
            if(progress <= .23f) {
                boolean completed=now-topAt>=320&&now-startedAt>=900
                    &&now-startedAt<=12000&&now-lastRepAt>=900;
                phase=0;startedAt=0;topAt=0;
                if(completed){repetitions++;lastRepAt=now;return true;}
            } else if(now-startedAt>12000) {phase=0;startedAt=0;}
        }
        return false;
    }
}
