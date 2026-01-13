package com.ddip.backend.config;

import com.ddip.backend.handler.CustomAccessDeniedHandler;
import com.ddip.backend.handler.CustomAuthenticationEntryPoint;
import com.ddip.backend.handler.OAuth2SuccessHandler;
import com.ddip.backend.security.auth.JwtAuthenticationFilter;
import com.ddip.backend.security.auth.JwtTokenFilter;
import com.ddip.backend.security.auth.JwtUtils;
import com.ddip.backend.security.oauth2.CustomOAuth2UserService;
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

                .exceptionHandling(e -> e
                        .authenticationEntryPoint(entryPoint)
                        .accessDeniedHandler(accessDeniedHandler))

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/oauth2/**", "/login/oauth2/**", "/login/oauth2/code/**",
                                "/oauth2/callback/**", "/api/users/refresh-token", "/api/users/register").permitAll()
                        .anyRequest().authenticated()
                )

                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService))
                        .successHandler(oAuth2SuccessHandler)
                )

                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(jwtTokenFilter, JwtAuthenticationFilter.class);

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
        // 와일드카드(*) 대신 특정 origin 명시 (allowCredentials와 함께 사용 불가)
        config.setAllowedOrigins(List.of("http://localhost:3000")); // 프론트엔드 URL
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true); // 쿠키를 포함한 요청을 허용하기 위해 true로 변경
        config.setExposedHeaders(List.of("Authorization")); // Authorization 헤더를 클라이언트에 노출

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}