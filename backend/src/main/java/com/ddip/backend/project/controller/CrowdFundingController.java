package com.ddip.backend.project.controller;

import com.ddip.backend.project.dto.project.ProjectDetailResponseDto;
import com.ddip.backend.project.dto.project.ProjectResponseDto;
import com.ddip.backend.project.dto.project.ProjectRequestDto;
import com.ddip.backend.project.dto.project.ProjectUpdateRequestDto;
import com.ddip.backend.common.security.auth.CustomUserDetails;
import com.ddip.backend.project.service.CrowdFundingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Project", description = "크라우드 펀딩 프로젝트 API")
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
    @Operation(summary = "프로젝트 생성", description = "이미지와 프로젝트 정보를 업로드하여 프로젝트를 생성합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "생성 성공"),
            @ApiResponse(responseCode = "400", description = "요청 값 오류"),
            @ApiResponse(responseCode = "401", description = "인증 필요")
    })
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
    @Operation(summary = "프로젝트 상세 조회", description = "특정 프로젝트의 상세 정보를 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "404", description = "프로젝트를 찾을 수 없음")
    })
    public ResponseEntity<ProjectDetailResponseDto> getCrowdFunding(@PathVariable Long projectId ){
        ProjectDetailResponseDto response = crowdFundingService.findProjectDetail(projectId);
        return ResponseEntity.ok(response);
    }

    /**
     * 크라우드 펀딩 프로젝트 수정 API
     *
     * 프로젝트 작성자만 수정 가능하도록 인증된 사용자 정보를 사용한다.
     *
     */
    @PatchMapping(value = "/{projectId}", consumes = {"multipart/form-data"})
    @Operation(summary = "프로젝트 수정", description = "본인 프로젝트 정보를 수정합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "수정 성공"),
            @ApiResponse(responseCode = "400", description = "요청 값 오류"),
            @ApiResponse(responseCode = "401", description = "인증 필요"),
            @ApiResponse(responseCode = "403", description = "수정 권한 없음"),
            @ApiResponse(responseCode = "404", description = "프로젝트를 찾을 수 없음")
    })
    public ResponseEntity<?> updateCrowdFunding(
            @AuthenticationPrincipal CustomUserDetails customUserDetails, @PathVariable Long projectId,
            @Valid @RequestPart(value = "data") ProjectUpdateRequestDto requestDto,
            @RequestPart(name = "file", required = false) List<MultipartFile> multipartFiles) {

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
    @Operation(summary = "프로젝트 삭제", description = "본인 프로젝트를 삭제합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "삭제 성공"),
            @ApiResponse(responseCode = "401", description = "인증 필요"),
            @ApiResponse(responseCode = "403", description = "삭제 권한 없음"),
            @ApiResponse(responseCode = "404", description = "프로젝트를 찾을 수 없음")
    })
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
    @Operation(summary = "프로젝트 목록 조회", description = "전체 프로젝트 목록을 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공")
    })
    public ResponseEntity<List<ProjectResponseDto>> getAllCrowdFunding(){
        List<ProjectResponseDto> allProjects = crowdFundingService.getAllProjects();
        return ResponseEntity.ok(allProjects);
    }

}
