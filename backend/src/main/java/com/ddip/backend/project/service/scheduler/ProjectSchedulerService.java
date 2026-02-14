package com.ddip.backend.project.service.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectSchedulerService {

    private final ProjectCloseBatchService projectCloseBatchService;

    @Scheduled(cron = "59 59 23 * * *", zone = "Asia/Seoul")
    public void closeExpireProjects() {
        log.info("Cleaning up expired projects");
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        int batchSize = 200;

        while (true) {
            int processed = projectCloseBatchService.closeExpiredBatch(today, batchSize);
            if (processed == 0) break;
        }
    }

}
