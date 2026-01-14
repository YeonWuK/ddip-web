package com.ddip.backend.handler;

import com.ddip.backend.security.auth.CustomUserDetails;
import com.ddip.backend.security.auth.JwtUtils;
import com.ddip.backend.service.TokenBlackListService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtUtils jwtUtils;
    private final TokenBlackListService tokenBlackListService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        CustomUserDetails customUserDetails = (CustomUserDetails) authentication.getPrincipal();
        String email = customUserDetails.getEmail();

        String accessToken = jwtUtils.generateToken(email);

        response.addHeader("Authorization", "Bearer " + accessToken);

        if (tokenBlackListService.isBlackListed(accessToken)) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            return;
        }

        String refreshToken = jwtUtils.generateRefreshToken(authentication.getName());
        Cookie refreshTokenCookie = new Cookie("refresh_token", refreshToken);
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(true);
        refreshTokenCookie.setMaxAge(Math.toIntExact(jwtUtils.getRefreshExpiration()));
        response.addCookie(refreshTokenCookie);

        String redirectUrl = "http://localhost:3000/oauth/callback?access_token=" + accessToken;
        response.sendRedirect(redirectUrl);
    }
}