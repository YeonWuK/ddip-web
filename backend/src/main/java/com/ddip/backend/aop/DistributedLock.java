package com.ddip.backend.aop;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.util.concurrent.TimeUnit;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface DistributedLock {

    /**
     * 락의 이름
     */
    String key();

    TimeUnit timeUnit() default TimeUnit.SECONDS;

    /**
     * 락 획득 대기시간
     */
    long waitTime() default 5L;

    /**
     * 락 임대 소실 시간
     */
    long leaseTime() default 3L;
}
