package com.ddip.backend.service;

import com.ddip.backend.dto.auction.AuctionSummaryDto;
import com.ddip.backend.dto.bids.BidsResponseDto;
import com.ddip.backend.dto.mybids.MyBidsSummaryDto;
import com.ddip.backend.dto.user.*;
import com.ddip.backend.entity.User;
import com.ddip.backend.exception.user.UserNotFoundException;
import com.ddip.backend.repository.AuctionRepository;
import com.ddip.backend.repository.BidsRepository;
import com.ddip.backend.repository.MyBidsRepository;
import com.ddip.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final BidsRepository bidsRepository;
    private final MyBidsRepository myBidsRepository;
    private final AuctionRepository auctionRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;

    /**
     * 회원 가입
     */
    public UserResponseDto createUser(UserRequestDto request) {
        request.setPassword(bCryptPasswordEncoder.encode(request.getPassword()));

        User user = User.from(request);
        userRepository.save(user);

        log.info("User created: {}", user.getEmail());

        return UserResponseDto.from(user);
    }


    /**
     * user 엔티티 접근
     */
    @Transactional(readOnly = true)
    public User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
    }


    /**
     * 프로필 조회
     */
    @Transactional(readOnly = true)
    public UserResponseDto getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        return UserResponseDto.from(user);
    }


    /**
     * 마이페이지 조회
     */
    @Transactional(readOnly = true)
    public UserPageResponseDto getUserPage(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        UserResponseDto userResponseDto = UserResponseDto.from(user);

        List<AuctionSummaryDto> auctionSummaries = auctionRepository.findAuctionsByUserId(userId).stream()
                        .map(AuctionSummaryDto::from)
                        .toList();

        List<BidsResponseDto> bidsResponseDtos = bidsRepository.findBidsByUserId(userId).stream()
                .map(BidsResponseDto::from)
                .toList();

        List<MyBidsSummaryDto> myBidsSummaries = myBidsRepository.findMyBidsByUserId(userId).stream()
                .map(MyBidsSummaryDto::from)
                .toList();

        log.info("User profile: {}", userResponseDto.getEmail());

        return new UserPageResponseDto(userResponseDto, auctionSummaries, bidsResponseDtos, myBidsSummaries);
    }


    /**
     * 유저 삭제
     */
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));

        userRepository.delete(user);
    }


    /**
     * 유저 정보 수정
     */
    public UserResponseDto updateUser(Long id, UserUpdateRequestDto updateRequest) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));

        user.update(updateRequest);
        return UserResponseDto.from(user);
    }


    /**
     * 유저 비밀번호 변경
     */
    public void updatePassword(Long id, String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));

        String encoded = bCryptPasswordEncoder.encode(newPassword);
        user.updatePassword(encoded);
    }


    /**
     * 유저 비밀번호 초기화
     */
    @Transactional(readOnly = true)
    public UserResponseDto findUserForPasswordReset(FindPasswordRequestDto dto) {
        User user = userRepository.findByEmailAndUsername(dto.getEmail(), dto.getUsername())
                .orElseThrow(() -> new UserNotFoundException(dto.getEmail()));

        return UserResponseDto.from(user);
    }


    /**
     * 유저 프로필 완성
     */
    public UserResponseDto completeProfile(String email, ProfileRequestDto requestDto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException(email));

        user.updateProfile(requestDto);
        user.setIsActive();

        return UserResponseDto.from(user);
    }
}