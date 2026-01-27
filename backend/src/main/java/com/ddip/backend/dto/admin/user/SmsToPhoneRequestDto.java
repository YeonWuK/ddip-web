package com.ddip.backend.dto.admin.user;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SmsToPhoneRequestDto {

    String phoneNumber;

    String message;

}
