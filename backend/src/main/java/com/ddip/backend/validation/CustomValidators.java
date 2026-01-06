package com.ddip.backend.validation;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.validation.BindingResult;
import org.springframework.validation.Errors;

@Component
@RequiredArgsConstructor
public class CustomValidators {

    private final EmailValidator emailValidator;

    public void updateValidate(UserUpdateRequestDto dto, BindingResult bindingResult) {
        emailValidator.doValidate(dto, bindingResult);
    }

    @Component
    @RequiredArgsConstructor
    public static class EmailValidator extends AbstractValidator<UserUpdateRequestDto> {

        private final UserRepository userRepository;

        @Override
        protected void doValidate(UserUpdateRequestDto target, Errors errors) {
            String getCurrenUserEmail = getCurrentUserEmail();

            if(!target.getEmail().equals(getCurrenUserEmail) && userRepository.existsByEmail(target.getEmail())) {
                errors.rejectValue("email", "email 중복 오류", "이미 존재하는 이메일 입니다.");
            }
        }
        private String getCurrentUserEmail() {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails) {
                return ((CustomUserDetails) authentication.getPrincipal()).getEmail();
            }
            return null;
        }
    }
}
