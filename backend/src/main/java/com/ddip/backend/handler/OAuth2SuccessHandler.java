package com.ddip.backend.handler;

import com.ddip.backend.security.auth.CustomUserDetails;
import com.ddip.backend.security.auth.JwtUtils;
import com.ddip.backend.service.TokenBlackListService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

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

        if(tokenBlackListService.isBlackList(accessToken)) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            return;
        }

        String redirectUri = "exp://192.168.219.8:8081/--/redirect";

        String targetUrl = redirectUri + "?accessToken=" +
                URLEncoder.encode(accessToken, StandardCharsets.UTF_8);

        response.sendRedirect(targetUrl);
    }
}