package com.ddip.backend.user.controller;

import com.ddip.backend.user.dto.user.*;
import com.ddip.backend.common.exception.ErrorResponse;
import com.ddip.backend.common.security.auth.CustomUserDetails;
import com.ddip.backend.common.security.auth.JwtUtils;
import com.ddip.backend.common.service.SmsService;
import com.ddip.backend.common.security.service.TokenBlackListService;
import com.ddip.backend.user.service.UserService;
import com.ddip.backend.common.validation.CustomValidators;
import com.ddip.backend.common.validation.ValidationSequence;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
@Tag(name = "User", description = "사용자 계정 API")
public class UserApiController {

    private final UserService userService;
    private final SmsService smsService;
    private final JwtUtils jwtUtils;
    private final TokenBlackListService tokenBlackListService;
    private final CustomValidators customValidators;


    /**
     * 회원가입
     */
    @PostMapping("/register")
    @Operation(summary = "회원가입", description = "신규 사용자를 등록합니다.")
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "201",
                    description = "회원가입 성공",
                    content = @Content(schema = @Schema(implementation = UserResponseDto.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "요청 값 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<?> registerUser(@Validated(ValidationSequence.class) @RequestBody UserRequestDto dto,
                                          BindingResult bindingResult) {

        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(bindingResult);
        }
        customValidators.registerValidate(dto, bindingResult);

        UserResponseDto userResponse = userService.createUser(dto);

        return ResponseEntity.status(HttpStatus.CREATED).body(userResponse);
    }

    /**
     * 회원정보 수정
     */
    @PatchMapping("/update")
    @Operation(summary = "회원정보 수정", description = "인증된 사용자의 회원정보를 수정합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "수정 성공"),
            @ApiResponse(responseCode = "400", description = "요청 값 오류"),
            @ApiResponse(responseCode = "401", description = "인증 필요")
    })
    public ResponseEntity<?> updateUser(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                        @Validated(ValidationSequence.class) @RequestBody UserUpdateRequestDto userUpdateReq,
                                        BindingResult bindingResult) {

        if (bindingResult.hasErrors()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(bindingResult);
        }
        customValidators.updateValidate(userUpdateReq, bindingResult);

        UserResponseDto dto = userService.updateUser(customUserDetails.getUserId(), userUpdateReq);
        return ResponseEntity.ok(dto);
    }

    /**
     * 회원 삭제
     */
    @DeleteMapping
    @Operation(summary = "회원 탈퇴", description = "인증된 사용자 계정을 삭제합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "삭제 성공"),
            @ApiResponse(responseCode = "401", description = "인증 필요")
    })
    public ResponseEntity<String> deleteUser(@AuthenticationPrincipal CustomUserDetails userDetails) {
        userService.deleteUser(userDetails.getUserId());

        return ResponseEntity.ok("User Deleted Successfully" + userDetails.getUserId());
    }

    /**
     * 비밀번호 찾기
     */
    @PostMapping("/find-password")
    @Operation(summary = "비밀번호 찾기", description = "임시 비밀번호를 발급하고 SMS로 전송합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "발급 성공"),
            @ApiResponse(responseCode = "404", description = "유저를 찾을 수 없음")
    })
    public ResponseEntity<Object> resetPassword(@RequestBody FindPasswordRequestDto dto) {

        UserResponseDto userResponse = userService.findUserForPasswordReset(dto);
        String temporaryPassword = PasswordGenerator.generatePassword(10);
        userService.updatePassword(userResponse.getId(), temporaryPassword);
        smsService.sendSms(userResponse, temporaryPassword);
        FindPasswordResponse response = new FindPasswordResponse("임시 비밀번호는" + temporaryPassword + "입니다.");

        return ResponseEntity.ok(response);
    }

    /**
     * 프로필 조회
     */
    @GetMapping("/profile")
    @Operation(summary = "프로필 조회", description = "내 프로필 정보를 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = UserResponseDto.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 필요",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal CustomUserDetails customUserDetails) {

        UserResponseDto dto = userService.getUserProfile(customUserDetails.getUserId());

        return ResponseEntity.ok(dto);
    }

    /**
     * 마이페이지 조회
     */
    @GetMapping("/my-page")
    @Operation(summary = "마이페이지 조회", description = "내 마이페이지 정보를 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = UserPageResponseDto.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 필요",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<?> getMyPage(@AuthenticationPrincipal CustomUserDetails customUserDetails) {

        UserPageResponseDto dto = userService.getUserPage(customUserDetails.getUserId());

        return ResponseEntity.ok(dto);
    }

    /**
     *  미완성 프로필 작성
     */
    @PatchMapping("/update-profile")
    @Operation(summary = "프로필 완성", description = "미완성 프로필 정보를 입력해 업데이트합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "수정 성공"),
            @ApiResponse(responseCode = "400", description = "요청 값 오류"),
            @ApiResponse(responseCode = "401", description = "인증 필요")
    })
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                           @Validated(ValidationSequence.class) @RequestBody ProfileRequestDto dto,
                                           BindingResult bindingResult)  {

        if (bindingResult.hasErrors()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(bindingResult);
        }

        customValidators.profileUpdateValidate(dto, bindingResult);

        UserResponseDto userResponseDto = userService.completeProfile(customUserDetails.getEmail(), dto);

        return ResponseEntity.ok(userResponseDto);
    }

    /**
     * 로그아웃
     */
    @PostMapping("/logout")
    @Operation(summary = "로그아웃", description = "액세스 토큰을 블랙리스트 처리하고 로그아웃합니다.")
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "로그아웃 성공",
                    content = @Content(schema = @Schema(implementation = String.class))
            )
    })
    public ResponseEntity<?> logout(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String accessToken = authHeader.substring(7);
            long expiration = jwtUtils.extractAllClaims(accessToken).getExpiration().getTime() - System.currentTimeMillis();

            tokenBlackListService.addToBlackList(accessToken, expiration);
        }

        SecurityContextHolder.clearContext();
        return ResponseEntity.ok().body("로그아웃 완료");
    }

    /**
     * accessToken 재발급
     */
    @PostMapping("/refresh-token")
    @Operation(summary = "액세스 토큰 재발급", description = "리프레시 토큰으로 새 액세스 토큰을 발급합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "재발급 성공"),
            @ApiResponse(responseCode = "401", description = "리프레시 토큰 유효하지 않음")
    })
    public ResponseEntity<?> refreshAccessToken(HttpServletRequest request) {

        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Refresh token failed");
        }

        String refreshToken = Arrays.stream(cookies)
                .filter(cookie -> "refresh_token".equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElseThrow(null);

        if(refreshToken == null || jwtUtils.isTokenExpired(refreshToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Refresh token expired");
        }

        if(tokenBlackListService.isBlackListed(refreshToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Blacklist refresh token expired");
        }

        String email = jwtUtils.extractUserEmail(refreshToken);
        String newAccessToken = jwtUtils.generateToken(email);

        log.info("Successfully generated new AccessToken {}", newAccessToken);

        return ResponseEntity.ok("{\"newAccessToken\": \"" + newAccessToken + "\"}");
    }

    /**
     * 설문 결과 저장 — 회원가입 완료 후 성향 분류
     */
    @PatchMapping("/survey")
    @Operation(summary = "성향 설문 저장", description = "회원가입 완료 후 성향 설문 결과를 저장합니다.")
    public ResponseEntity<Void> saveSurvey(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody @Validated SurveyRequestDto request
    ) {
        userService.saveUserType(userDetails.getUserId(), request.getUserType());
        return ResponseEntity.ok().build();
    }
}
