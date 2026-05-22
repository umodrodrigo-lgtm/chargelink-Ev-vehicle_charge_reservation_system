package com.chargelink.auth;

import com.chargelink.auth.dto.AuthResponse;
import com.chargelink.auth.dto.LoginRequest;
import com.chargelink.auth.dto.RefreshTokenRequest;
import com.chargelink.auth.dto.RegisterRequest;
import com.chargelink.common.AppException;
import com.chargelink.security.JwtTokenProvider;
import com.chargelink.users.dto.UserDTO;
import com.chargelink.users.entity.RefreshToken;
import com.chargelink.users.entity.User;
import com.chargelink.users.entity.UserRole;
import com.chargelink.users.repository.RefreshTokenRepository;
import com.chargelink.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private static final Logger authLog = LoggerFactory.getLogger("chargelink.events.auth");

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw AppException.conflict("Email already registered");
        }

        User user = User.builder()
                .email(request.getEmail().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .role(UserRole.USER)
                .build();

        user = userRepository.save(user);
        authLog.info("[REGISTER] user={} name=\"{} {}\"", user.getEmail(), user.getFirstName(), user.getLastName());
        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().toLowerCase();
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword())
            );
        } catch (AuthenticationException ex) {
            authLog.warn("[LOGIN_FAILED] email={} reason=\"{}\"", email, ex.getMessage());
            throw AppException.unauthorized("Invalid email or password");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("User not found"));

        refreshTokenRepository.revokeAllUserTokens(user);
        authLog.info("[LOGIN_SUCCESS] user={}", user.getEmail());
        return buildAuthResponse(user);
    }

    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken stored = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> AppException.unauthorized("Refresh token not found"));

        if (!stored.isValid()) {
            throw AppException.unauthorized("Refresh token is expired or revoked");
        }

        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        User user = stored.getUser();
        authLog.info("[TOKEN_REFRESH] user={}", user.getEmail());
        return buildAuthResponse(user);
    }

    public void logout(RefreshTokenRequest request) {
        refreshTokenRepository.findByToken(request.getRefreshToken())
                .ifPresent(token -> {
                    token.setRevoked(true);
                    refreshTokenRepository.save(token);
                    authLog.info("[LOGOUT] user={}", token.getUser().getEmail());
                });
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken  = jwtTokenProvider.generateAccessToken(user);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user);

        RefreshToken storedToken = RefreshToken.builder()
                .token(refreshToken)
                .user(user)
                .expiresAt(LocalDateTime.now().plusSeconds(
                        jwtTokenProvider.getRefreshTokenExpiration() / 1000))
                .build();
        refreshTokenRepository.save(storedToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpiration() / 1000)
                .user(UserDTO.from(user))
                .build();
    }
}
