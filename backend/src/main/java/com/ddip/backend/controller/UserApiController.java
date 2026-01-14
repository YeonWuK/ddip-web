package com.ddip.backend.controller;

import com.ddip.backend.dto.user.*;
import com.ddip.backend.security.auth.CustomUserDetails;
import com.ddip.backend.security.auth.JwtUtils;
import com.ddip.backend.service.SmsService;
import com.ddip.backend.service.TokenBlackListService;
import com.ddip.backend.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserApiController {

    private final UserService userService;
    private final SmsService smsService;
    private final JwtUtils jwtUtils;
    private final TokenBlackListService tokenBlackListService;

    /**
     * 로그아웃
     */
    @PostMapping("/logout")
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
     * 회원가입
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody UserRequestDto userRequest) {
        UserResponseDto userResponse = userService.createUser(userRequest);

        return ResponseEntity.status(HttpStatus.CREATED).body(userResponse);
    }

    /**
     * 회원정보 수정
     */
    @PatchMapping("/update")
    public ResponseEntity<?> updateUser(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                        @RequestBody UserUpdateRequestDto userUpdateReq) {

        UserResponseDto dto = userService.updateUser(customUserDetails.getUserId(), userUpdateReq);

        return ResponseEntity.ok(dto);
    }

    /**
     * 회원 삭제
     */
    @DeleteMapping
    public ResponseEntity<String> deleteUser(@AuthenticationPrincipal CustomUserDetails userDetails) {
        userService.deleteUser(userDetails.getUserId());

        return ResponseEntity.ok("User Deleted Successfully" + userDetails.getUserId());
    }

    /**
     * 비밀번호 찾기
     */
    @PostMapping("/find-password")
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
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal CustomUserDetails customUserDetails) {

        UserResponseDto dto = userService.getUserProfile(customUserDetails.getUserId());

        return ResponseEntity.ok(dto);
    }

    /**
     *  미완성 프로필 작성
     */
    @PatchMapping("/update-profile")
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                           @RequestBody ProfileRequestDto dto)  {

        UserResponseDto userResponseDto = userService.putProfile(customUserDetails.getEmail(), dto);

        return ResponseEntity.ok(userResponseDto);
    }

    /**
     * accessToken 재발급
     */
    @PostMapping("/refresh-token")
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

        return ResponseEntity.ok("{\"newAccessToken\": \"" + newAccessToken + "\"}");
    }
}
