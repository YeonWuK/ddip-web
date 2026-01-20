package com.ddip.backend.service;

import com.ddip.backend.repository.AuctionRepository;
import com.ddip.backend.repository.MyBidsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class MyBidsService {

    private final MyBidsRepository myBidsRepository;
    private final AuctionRepository auctionRepository;


}
