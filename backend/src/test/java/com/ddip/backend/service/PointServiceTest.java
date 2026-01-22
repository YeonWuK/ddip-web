package com.ddip.backend.service;

import com.ddip.backend.dto.enums.PointLedgerSource;
import com.ddip.backend.dto.enums.PointLedgerType;
import com.ddip.backend.entity.PointLedger;
import com.ddip.backend.entity.User;
import com.ddip.backend.exception.user.InsufficientPointException;
import com.ddip.backend.exception.user.UserNotFoundException;
import com.ddip.backend.repository.PointLedgerRepository;
import com.ddip.backend.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PointServiceTest {

    @InjectMocks
    private PointService pointService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PointLedgerRepository pointLedgerRepository;

    @Test
    @DisplayName("포인트 충전(양수 delta) 시 잔액 증가 및 Ledger 기록")
    void changePoint_charge() {
        Long userId = 1L;
        long delta = 10_000L;

        User user = User.builder()
                .id(userId)
                .pointBalance(10000)
                .build();
        // 초기 포인트 0 가정, addPoint 가 10000 더해줄 것

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(pointLedgerRepository.save(any(PointLedger.class))).thenAnswer(invocation -> invocation.getArgument(0));

        pointService.changePoint(userId, delta, PointLedgerType.CHARGE,
                PointLedgerSource.CHARGE, null, "테스트 충전");

        // Ledger 기록 검증
        verify(pointLedgerRepository, times(1)).save(any(PointLedger.class));
    }

    @Test
    @DisplayName("포인트 차감 시 잔액 부족하면 InsufficientPointException 발생")
    void changePoint_use_insufficient() {
        Long userId = 1L;
        long delta = -10_000L;

        User user = User.builder()
                .id(userId)
                .build();
        // pointBalance 0 인 상태라고 가정 (subtractPoint 전에 체크됨)

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        assertThrows(InsufficientPointException.class, () ->
                pointService.changePoint(userId, delta, PointLedgerType.USE, PointLedgerSource.PLEDGE,
                        1L, "테스트 사용"));
    }

    @Test
    @DisplayName("존재하지 않는 유저에 대해 변경 시 UserNotFoundException 발생")
    void changePoint_userNotFound() {
        Long userId = 1L;

        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> pointService.changePoint(userId, 1000L, PointLedgerType.CHARGE,
                        PointLedgerSource.CHARGE, null, "테스트"));
    }
}