package com.ddip.backend.common.security.auth;

import com.ddip.backend.common.exception.security.BlackListedTokenException;
import com.ddip.backend.common.exception.security.TokenExpiredException;
import com.ddip.backend.common.security.service.TokenBlackListService;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
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

        if (tokenBlackListService.isBlackListed(token)) {
            throw new BlackListedTokenException("Token is blacklisted");
        }

        try {
            String email = jwtUtils.extractUserEmail(token);

            log.info("user: {} ", email);

            if (email == null) {
                log.info("Invalid token, Incorrect username");
                filterChain.doFilter(request, response);
                return;
            }

            Authentication existing = SecurityContextHolder.getContext().getAuthentication();

            if (existing != null && existing.isAuthenticated()
                    && !(existing instanceof AnonymousAuthenticationToken)) {
                log.info("SecurityContext already has authenticated user, skip");
                filterChain.doFilter(request, response);
                return;
            }

            CustomUserDetails userDetails = (CustomUserDetails) userDetailsService.loadUserByUsername(email);

            log.info("Successfully validate token");
            setAuthentication(userDetails, request);

            filterChain.doFilter(request, response);

        } catch (ExpiredJwtException e) {
            throw new TokenExpiredException("Token is expired");
        }
    }

    private void setAuthentication(CustomUserDetails customUserDetails, HttpServletRequest request) {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(customUserDetails, null, customUserDetails.getAuthorities());
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String path = request.getServletPath();
        return path.equals("/api/users/login")
                || path.equals("/api/users/register")
                || path.equals("/api/users/update-password")
                || path.equals("/api/users/refresh-token");
    }
}