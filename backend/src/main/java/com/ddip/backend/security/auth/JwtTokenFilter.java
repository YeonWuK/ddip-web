package com.ddip.backend.security.auth;

import com.ddip.backend.dto.error.security.ProfileIncompleteDeniedException;
import com.ddip.backend.dto.error.security.TokenExpiredException;
import com.ddip.backend.service.TokenBlackListService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtTokenFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final TokenBlackListService tokenBlackListService;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");

        log.info("Authorization Header = {}", header);

        if(header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);

        if (tokenBlackListService.isBlackList(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        String username = jwtUtils.extractUserEmail(token);

        if (username == null) {
            log.info("Invalid token, Incorrect username");
            filterChain.doFilter(request, response);
            return;
        }

        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            log.info("SecurityContext already has auth, skip");
            filterChain.doFilter(request, response);
            return;
        }

        CustomUserDetails userDetails = (CustomUserDetails) userDetailsService.loadUserByUsername(username);

        if (!jwtUtils.isValidToken(token, userDetails.getEmail())) {
            throw new TokenExpiredException("invalid token or Expired");
        }

        log.info("Successfully validate token");
        setAuthentication(userDetails, request);

        if (!userDetails.getIsActive()) {
            throw new ProfileIncompleteDeniedException("Invalid profile");
        }

        filterChain.doFilter(request, response);
    }

    private void setAuthentication(CustomUserDetails customUserDetails, HttpServletRequest request) {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(customUserDetails, null, customUserDetails.getAuthorities());
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}