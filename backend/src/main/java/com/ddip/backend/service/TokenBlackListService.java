package com.ddip.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class TokenBlackListService {

    private final RedisTemplate<String, String> redisTemplate;

//    public void addToBlackList(String token, long expirationTime) {
//        redisTemplate.opsForValue().set("BLACKLIST_PREFIX" + token, true, expirationTime, TimeUnit.MILLISECONDS);
//    }

//    public boolean isBlackList(String token) {
//        return redisClient.isBlackListed(BLACKLIST_PREFIX + token);
//    }
}
