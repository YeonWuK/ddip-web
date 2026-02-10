package com.ddip.backend.common.security.utils;

import com.ddip.backend.common.security.auth.CustomUserDetails;
import com.ddip.backend.user.domain.User;
import com.ddip.backend.common.exception.security.ProfileIncompleteDeniedException;
import com.ddip.backend.user.validation.user.UserNotFoundException;
import com.ddip.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.stereotype.Component;

import java.util.function.Supplier;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProfileCompleteAuthorizationManager
        implements AuthorizationManager<RequestAuthorizationContext> {

    private final UserRepository userRepository;

    @Override
    public AuthorizationDecision check(Supplier<Authentication> authentication, RequestAuthorizationContext object) {

        Authentication auth = authentication.get();

        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return new AuthorizationDecision(false);
        }

        Object principal = auth.getPrincipal();

        if (!(principal instanceof CustomUserDetails userDetails)) {
            return new AuthorizationDecision(false);
        }

        User user = userRepository.findByEmail(userDetails.getEmail())
                .orElseThrow(() -> new UserNotFoundException(userDetails.getEmail()));

        if (!user.isActive()) {
            throw new ProfileIncompleteDeniedException("프로필을 먼저 완료하세요.");
        }


        return new AuthorizationDecision(true);
    }
}