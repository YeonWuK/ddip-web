package com.ddip.backend.common.utils;

import org.springframework.stereotype.Component;

@Component
public class S3UrlPrefixFactory {

    public String auctionPrefix(Long auctionId) {
        return "auction/" + auctionId;
    }

    public String projectPrefix(Long projectId) {
        return "project/" + projectId;
    }
}
