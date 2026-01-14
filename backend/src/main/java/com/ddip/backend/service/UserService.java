package com.ddip.backend.service;

import com.ddip.backend.dto.user.*;
import com.ddip.backend.entity.User;
import com.ddip.backend.exception.user.UserNotFoundException;
import com.ddip.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;

    public UserResponseDto createUser(UserRequestDto request) {
        request.setPassword(bCryptPasswordEncoder.encode(request.getPassword()));

        User user = User.from(request);
        userRepository.save(user);

        log.info("User created: {}", user.getEmail());

        return UserResponseDto.from(user);
    }

    @Transactional(readOnly = true)
    public User getUser(Long id) {

        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
    }

    @Transactional(readOnly = true)
    public UserResponseDto getUserProfile(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));

        UserResponseDto dto = UserResponseDto.from(user);

        log.info("User profile: {}", dto.getEmail());

        return dto;
    }

    @Transactional(readOnly = true)
    public boolean getIsActive(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException(email));

        return user.getIsActive();
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));

        userRepository.delete(user);
    }

    public UserResponseDto updateUser(Long id, UserUpdateRequestDto updateRequest) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));

        user.update(updateRequest);
        return UserResponseDto.from(user);
    }

    public void updatePassword(Long id, String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));

        String encoded = bCryptPasswordEncoder.encode(newPassword);
        user.updatePassword(encoded);
    }

    @Transactional(readOnly = true)
    public UserResponseDto findUserForPasswordReset(FindPasswordRequestDto dto) {
        User user = userRepository.findByEmailAndUsername(dto.getEmail(), dto.getUsername())
                .orElseThrow(() -> new UserNotFoundException(dto.getEmail()));

        return UserResponseDto.from(user);
    }

    public UserResponseDto putProfile(String email, ProfileRequestDto requestDto) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException(email));

        user.updateProfile(requestDto);
        user.setIsActive();

        return UserResponseDto.from(user);
    }
}