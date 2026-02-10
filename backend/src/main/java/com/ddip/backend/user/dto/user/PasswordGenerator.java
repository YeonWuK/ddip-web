package com.ddip.backend.user.dto.user;

import java.security.SecureRandom;
import java.util.Random;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

public class PasswordGenerator {
    private static final String LOWER = "abcdefghijklmnopqrstuvwxyz";
    private static final String UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String DIGITS = "0123456789";
    private static final String SPECIAL = "!@#$%^&*_+=-/";

    private static final String ALL_CHARACTERS = LOWER + UPPER + DIGITS + SPECIAL;
    private static final Random RANDOM = new SecureRandom();

    public static String generatePassword(int length) {
        return IntStream.range(0, length)
                .mapToObj(i -> String.valueOf(ALL_CHARACTERS.charAt(RANDOM.nextInt(ALL_CHARACTERS.length()))))
                .collect(Collectors.joining());
    }
}