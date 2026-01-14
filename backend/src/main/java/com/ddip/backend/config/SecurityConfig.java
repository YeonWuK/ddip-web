package com.ddip.backend.config;

import com.ddip.backend.security.utils.CustomAccessDeniedHandler;
import com.ddip.backend.security.utils.CustomAuthenticationEntryPoint;
import com.ddip.backend.handler.OAuth2SuccessHandler;
import com.ddip.backend.security.auth.JwtAuthenticationFilter;
import com.ddip.backend.security.auth.JwtTokenFilter;
import com.ddip.backend.security.auth.JwtUtils;
import com.ddip.backend.security.oauth2.CustomOAuth2UserService;
import com.ddip.backend.security.utils.ProfileCompleteAuthorizationManager;
import com.ddip.backend.service.TokenBlackListService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final ProfileCompleteAuthorizationManager profileCompleteAuthorizationManager;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final TokenBlackListService tokenBlackListService;
    private final JwtUtils jwtUtils;
    private final CustomAccessDeniedHandler  accessDeniedHandler;
    private final CustomAuthenticationEntryPoint entryPoint;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final JwtTokenFilter jwtTokenFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        AuthenticationManager authenticationManager = authenticationManager(http.getSharedObject(AuthenticationConfiguration.class));
        JwtAuthenticationFilter jwtAuthenticationFilter = new JwtAuthenticationFilter(authenticationManager, tokenBlackListService, jwtUtils);

        http.csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                .exceptionHandling(e -> e
                        .authenticationEntryPoint(entryPoint)
                        .accessDeniedHandler(accessDeniedHandler))

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/error",
                                "/oauth2/**", "/login/oauth2/**", "/login/oauth2/code/**", "/api/users/login",
                                "/oauth2/callback/**", "/api/users/refresh-token", "/api/users/register",
                                "/api/users/find-password").permitAll()
                        .requestMatchers("/api/**").access(profileCompleteAuthorizationManager)
                        .anyRequest().authenticated()
                )

                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService))
                        .successHandler(oAuth2SuccessHandler)
                )

                .addFilterBefore(jwtTokenFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAt(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:3000"));
        config.setAllowCredentials(true);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));

        // 추가: 클라이언트가 Authorization 헤더를 읽을 수 있게 허용
        config.setExposedHeaders(List.of("Authorization", "access_token"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}