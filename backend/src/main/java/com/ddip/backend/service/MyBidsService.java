package com.ddip.backend.service;

import com.ddip.backend.repository.MyBidsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MyBidsService {

    private final MyBidsRepository myBidsRepository;

}
