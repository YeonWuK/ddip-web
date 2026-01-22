package com.ddip.backend.controller;

import com.ddip.backend.dto.crowd.*;
import com.ddip.backend.security.auth.CustomUserDetails;
import com.ddip.backend.service.CrowdFundingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/crowd")
@RequiredArgsConstructor
public class CrowdFundingController {

    private final CrowdFundingService crowdFundingService;

    /**
     * 크라우드 펀딩 프로젝트 생성 API
     *
     * @param customUserDetails 인증된 사용자 정보
     * @param projectRequestDto 프로젝트 생성 요청 DTO
     * @return 생성된 프로젝트 ID
     */
    @PostMapping(consumes = {"multipart/form-data"} )
    public ResponseEntity<?> createCrowdFunding(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                @Valid @RequestPart(value = "data") ProjectRequestDto projectRequestDto,
                                                @RequestPart(name = "file") List<MultipartFile> multipartFiles) {
        Long userId = customUserDetails.getUserId();
        long projectId = crowdFundingService.createProject(multipartFiles, projectRequestDto , userId);
        return ResponseEntity.ok(projectId);
    }

    /**
     * 크라우드 펀딩 프로젝트 조회 API
     *
     * @param projectId 조회할 프로젝트 ID
     * @return 프로젝트 상세 정보 DTO
     */
    @GetMapping("/{projectId}")
    public ResponseEntity<ProjectResponseDto> getCrowdFunding(@PathVariable Long projectId ){
        ProjectResponseDto response = crowdFundingService.getProjects(projectId);
        return ResponseEntity.ok(response);
    }

    /**
     * 크라우드 펀딩 프로젝트 수정 API
     *
     * 프로젝트 작성자만 수정 가능하도록 인증된 사용자 정보를 사용한다.
     *
     * (현재 비활성화 상태) - 리워드 수정 따로 Project 수정 따로 할지에 대한 논의
     */
    @PatchMapping(value = "/{projectId}", consumes = {"multipart/form-data"})
    public ResponseEntity<?> updateCrowdFunding(
            @AuthenticationPrincipal CustomUserDetails customUserDetails, @PathVariable Long projectId,
            @Valid @RequestPart(value = "data") ProjectUpdateRequestDto requestDto,
            @RequestPart(name = "file") List<MultipartFile> multipartFiles) {

        Long userId = customUserDetails.getUserId();
        crowdFundingService.updateProject(multipartFiles, projectId, userId, requestDto);
        return ResponseEntity.ok().build();

    }

    /**
     * 크라우드 펀딩 프로젝트 삭제 API
     *
     * 프로젝트 작성자만 삭제 가능하도록 인증된 사용자 정보를 사용한다.
     *
     * @param customUserDetails 인증된 사용자 정보
     * @param projectId 삭제할 프로젝트 ID
     * @return 200 OK
     */
    @DeleteMapping("/{projectId}")
    public ResponseEntity<?> deleteCrowdFunding(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                                   @PathVariable Long projectId) {
        Long userId = customUserDetails.getUserId();
        crowdFundingService.deleteProject(projectId, userId);
        return ResponseEntity.ok().build();
    }

    /**
     * Get All Projects 전달
     * @return ProjectResponseDto
     */
    @GetMapping
    public ResponseEntity<List<ProjectResponseDto>> getAllCrowdFunding(){
        List<ProjectResponseDto> allProjects = crowdFundingService.getAllProjects();
        return ResponseEntity.ok(allProjects);
    }

    @PatchMapping("/{projectId}/open")
    public ResponseEntity<?> fundingOpen(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                         @PathVariable Long projectId){
        crowdFundingService.openFunding(customUserDetails.getUserId(), projectId);
        return ResponseEntity.ok().build();
    }

}
