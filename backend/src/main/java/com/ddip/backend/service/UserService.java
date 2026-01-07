package com.ddip.backend.service;

import com.ddip.backend.dto.user.FindPasswordRequestDto;
import com.ddip.backend.dto.user.UserRequestDto;
import com.ddip.backend.dto.user.UserResponseDto;
import com.ddip.backend.dto.user.UserUpdateRequestDto;
import com.ddip.backend.entity.User;
import com.ddip.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;

    @Transactional
    public UserResponseDto createUser(UserRequestDto request) {
        request.setPassword(bCryptPasswordEncoder.encode(request.getPassword()));

        User user = User.from(request);
        userRepository.save(user);

        log.info("User created: {}", user.getEmail());

        return UserResponseDto.from(user);
    }

    public UserResponseDto getUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return UserResponseDto.from(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        userRepository.delete(user);
    }

    @Transactional
    public void updateUser(Long id, UserUpdateRequestDto updateRequest) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.update(updateRequest);
    }

    @Transactional
    public void updatePassword(Long id, String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.updatePassword(newPassword);
    }

    public UserResponseDto findUserForPasswordReset(FindPasswordRequestDto dto) {
        User user = userRepository.findByEmailAndUsername(dto.getEmail(), dto.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return UserResponseDto.from(user);
    }
}