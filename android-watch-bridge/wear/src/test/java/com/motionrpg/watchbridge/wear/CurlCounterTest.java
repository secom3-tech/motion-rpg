package com.motionrpg.watchbridge.wear;

import org.junit.Test;
import static org.junit.Assert.*;

public class CurlCounterTest {
    private float[] vector(float percent) {
        double angle=percent*Math.PI/2;
        return new float[]{0f,(float)Math.sin(angle),(float)-Math.cos(angle)};
    }
    private void sequence(CurlCounter detector,long offset,boolean full) {
        final int timeStep=40;
        int duration=full?2200:1200;
        for(int t=0;t<=duration;t+=timeStep){
            float a;
            if(full) {
                if(t<750)a=t/750f;
                else if(t<970)a=1;
                else a=Math.max(0,(2200-t)/1230f);
            }else{
                if(t<500)a=.55f*t/500;
                else a=.55f*Math.max(0,(1200-t)/700f);
            }
            detector.feed(vector(a),offset+t);
        }
    }
    @Test public void countsFullRepetitionsOnly() {
        CurlCounter detector=new CurlCounter();
        assertFalse(detector.setUp(vector(1)));
        assertTrue(detector.setDown(vector(0)));
        assertFalse(detector.setUp(vector(.05f)));
        assertTrue(detector.setUp(vector(1)));
        detector.feed(vector(0),0);
        sequence(detector,50,true);
        assertEquals(1,detector.getRepetitions());
        sequence(detector,2700,true);
        assertEquals(2,detector.getRepetitions());
        detector.reset();
        detector.feed(vector(0),0);
        sequence(detector,60,false);
        assertEquals(0,detector.getRepetitions());
    }
}
