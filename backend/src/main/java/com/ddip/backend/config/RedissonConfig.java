package com.ddip.backend.config;

import lombok.extern.slf4j.Slf4j;
import org.redisson.Redisson;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class RedissonConfig {

    @Value("${spring.data.redis.host}")
    private String redisHost;

    @Value("${spring.data.redis.port}")
    private int redisPort;

    private static final String REDISSON_HOST_PREFIX = "redis://";

    @Bean
    public RedissonClient redisson() {
        Config config = new Config();
        String redisAddress = REDISSON_HOST_PREFIX + redisHost + ":" + redisPort;
        log.info("Connecting to Redis at {}", redisAddress);
        config.useSingleServer().setAddress(redisAddress);
        return Redisson.create(config);
    }
}