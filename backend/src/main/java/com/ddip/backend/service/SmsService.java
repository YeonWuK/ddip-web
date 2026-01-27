package com.ddip.backend.service;

import com.ddip.backend.dto.user.MessageDto;
import com.ddip.backend.dto.user.UserResponseDto;
import com.solapi.sdk.message.exception.SolapiMessageNotReceivedException;
import com.solapi.sdk.message.model.Message;
import com.solapi.sdk.message.service.DefaultMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SmsService {

    private final DefaultMessageService messageService;

    @Value("${solapi.from}")
    private String from;

    /**
     * 기본 SMS 전송 메서드
     */
    public void sendSms(String phoneNumber, String text) {

        if (phoneNumber == null || phoneNumber.isBlank()) {
            throw new IllegalArgumentException("전화번호가 유효하지 않습니다.");
        }

        Message message = new Message();
        message.setFrom(from);
        message.setTo(phoneNumber);
        message.setText(text);

        try {
            messageService.send(message);
        } catch (SolapiMessageNotReceivedException e) {
            throw new IllegalStateException("SMS 발송 실패: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new IllegalStateException("SMS 발송 중 예외: " + e.getMessage(), e);
        }
    }

    /**
     * UserResponseDto 기반 SMS (기존 기능 유지)
     */
    public void sendSms(UserResponseDto dto, String password) {

        String text = MessageDto.from(dto, password).getMessage();
        sendSms(dto.getPhoneNumber(), text);
    }

}
