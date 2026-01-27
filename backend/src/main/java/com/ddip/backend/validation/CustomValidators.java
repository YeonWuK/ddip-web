package com.ddip.backend.validation;

import com.ddip.backend.dto.user.ProfileRequestDto;
import com.ddip.backend.dto.user.UserRequestDto;
import com.ddip.backend.dto.user.UserUpdateRequestDto;
import com.ddip.backend.repository.UserRepository;
import com.ddip.backend.security.auth.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.validation.BindingResult;
import org.springframework.validation.Errors;

@Component
@RequiredArgsConstructor
public class CustomValidators {

    private final UserUpdateDuplicateValidator updateDuplicateValidator;
    private final UserRegisterDuplicateValidator registerDuplicateValidator;
    private final ProfileUpdateDuplicateValidator profileUpdateDuplicateValidator;

    public void updateValidate(UserUpdateRequestDto dto, BindingResult bindingResult) {
        updateDuplicateValidator.doValidate(dto, bindingResult);
    }

    public void registerValidate(UserRequestDto dto, BindingResult bindingResult) {
        registerDuplicateValidator.doValidate(dto, bindingResult);
    }

    public void profileUpdateValidate(ProfileRequestDto dto, BindingResult bindingResult) {
        profileUpdateDuplicateValidator.doValidate(dto, bindingResult);
    }

    @Component
    @RequiredArgsConstructor
    public static class UserUpdateDuplicateValidator extends AbstractValidator<UserUpdateRequestDto> {

        private final UserRepository userRepository;

        @Override
        protected void doValidate(UserUpdateRequestDto target, Errors errors) {
            String getCurrenUserEmail = getCurrentUserEmail();
            String getCurrentUserName = getCurrentUserName();
            String getCurrentNickName = getCurrentNickName();

            if(!target.getEmail().equals(getCurrenUserEmail) && userRepository.existsByEmail(target.getEmail())) {
                errors.rejectValue("email", "email 중복 오류", "이미 존재하는 이메일 입니다.");
            }

            if(!target.getUsername().equals(getCurrentUserName) && userRepository.existsByUsername(target.getUsername())) {
                errors.rejectValue("username", "username 중복 오류", "이미 존재하는 이름 입니다.");
            }

            if(!target.getNickname().equals(getCurrentNickName) && userRepository.existsByNickname(target.getNickname())) {
                errors.rejectValue("nickname","nickname 중복 오류", "이미 존재하는 닉네임 입니다.");
            }
        }
        private String getCurrentUserEmail() {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails) {
                return ((CustomUserDetails) authentication.getPrincipal()).getEmail();
            }
            return null;
        }

        private String getCurrentUserName() {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails) {
                return ((CustomUserDetails) authentication.getPrincipal()).getName();
            }
            return null;
        }

        private String getCurrentNickName() {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails) {
                return ((CustomUserDetails) authentication.getPrincipal()).getNickname();
            }
            return null;
        }
    }

    @Component
    @RequiredArgsConstructor
    public static class UserRegisterDuplicateValidator extends AbstractValidator<UserRequestDto> {

        private final UserRepository userRepository;

        @Override
        protected void doValidate(UserRequestDto target, Errors errors) {
            if(userRepository.existsByEmail(target.getEmail())) {
                errors.rejectValue("email", "email 중복 오류", "이미 존재하는 이메일 입니다.");
            }
            if(userRepository.existsByUsername(target.getUsername())) {
                errors.rejectValue("username", "username 중복 오류", "이미 존재하는 이름 입니다.");
            }
            if(userRepository.existsByNickname(target.getNickname())) {
                errors.rejectValue("nickname","nickname 중복 오류", "이미 존재하는 닉네임 입니다.");
            }
        }
    }

    @Component
    @RequiredArgsConstructor
    public static class ProfileUpdateDuplicateValidator extends AbstractValidator<ProfileRequestDto> {

        private final UserRepository userRepository;

        @Override
        protected void doValidate(ProfileRequestDto target, Errors errors) {
            String getCurrentUserName = getCurrentUserName();
            String getCurrentNickName = getCurrentNickName();

            if(!target.getUsername().equals(getCurrentUserName) && userRepository.existsByUsername(target.getUsername())) {
                errors.rejectValue("username", "username 중복 오류", "이미 존재하는 이름 입니다.");
            }

            if(!target.getNickname().equals(getCurrentNickName) && userRepository.existsByNickname(target.getNickname())) {
                errors.rejectValue("nickname","nickname 중복 오류", "이미 존재하는 닉네임 입니다.");
            }
        }

        private String getCurrentUserName() {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails) {
                return ((CustomUserDetails) authentication.getPrincipal()).getName();
            }
            return null;
        }

        private String getCurrentNickName() {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails) {
                return ((CustomUserDetails) authentication.getPrincipal()).getNickname();
            }
            return null;
        }
    }
}
