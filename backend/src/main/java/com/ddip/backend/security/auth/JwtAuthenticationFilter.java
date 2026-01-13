package com.ddip.backend.security.auth;

import com.ddip.backend.dto.user.LoginUserRequest;
import com.ddip.backend.service.TokenBlackListService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;

@Slf4j
public class JwtAuthenticationFilter extends UsernamePasswordAuthenticationFilter {

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final TokenBlackListService tokenBlackListService;
    private final ObjectMapper objectMapper;

    public JwtAuthenticationFilter(AuthenticationManager authenticationManager, TokenBlackListService tokenBlackList, JwtUtils jwtUtils, ObjectMapper objectMapper) {
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.tokenBlackListService = tokenBlackList;
        this.objectMapper = objectMapper;

        setFilterProcessesUrl("/api/users/login");
    }

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws AuthenticationException {
        log.info("[LOGIN FILTER] method={}, uri={}, contentLength={}, contentType={}",
                request.getMethod(), request.getRequestURI(), request.getContentLength(), request.getContentType());
        try{
            // 로그인 시 DB 에서 사용자 조회 후 인증객체 반환
            LoginUserRequest loginUserRequest = objectMapper.readValue(request.getInputStream(), LoginUserRequest.class);
            UsernamePasswordAuthenticationToken authenticationToken =
                    new UsernamePasswordAuthenticationToken(loginUserRequest.getEmail(), loginUserRequest.getPassword());
            return authenticationManager.authenticate(authenticationToken);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void successfulAuthentication(HttpServletRequest request, HttpServletResponse response, FilterChain chain, Authentication authResults) throws IOException {
        String accessToken = jwtUtils.generateToken(authResults.getName());

        response.addHeader("Authorization", "Bearer " + accessToken);

        if(tokenBlackListService.isBlackListed(accessToken)) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            return;
        }

        // refreshToken 생성 및 쿠키에 추가
        String refreshToken = jwtUtils.generateRefreshToken(authResults.getName());
        Cookie refreshTokenCookie = new Cookie("refresh_token", refreshToken);
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(true);
        refreshTokenCookie.setMaxAge(Math.toIntExact(jwtUtils.getRefreshExpiration()));
        response.addCookie(refreshTokenCookie);

        // 프로트엔드 응답 바디에 추가
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{ \"access_token\": \"" + accessToken + "\" }");
    }
}