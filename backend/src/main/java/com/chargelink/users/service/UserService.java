package com.chargelink.users.service;

import com.chargelink.common.AppException;
import com.chargelink.common.PagedResponse;
import com.chargelink.users.dto.UserDTO;
import com.chargelink.users.dto.UserUpdateRequest;
import com.chargelink.users.entity.User;
import com.chargelink.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private static final Logger adminLog = LoggerFactory.getLogger("chargelink.events.admin");

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserDTO getCurrentUser() {
        User user = resolveCurrentUser();
        return UserDTO.from(user);
    }

    public UserDTO updateProfile(UserUpdateRequest request) {
        User user = resolveCurrentUser();
        if (StringUtils.hasText(request.getFirstName())) user.setFirstName(request.getFirstName());
        if (StringUtils.hasText(request.getLastName()))  user.setLastName(request.getLastName());
        if (StringUtils.hasText(request.getPhone()))     user.setPhone(request.getPhone());
        return UserDTO.from(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public PagedResponse<UserDTO> getAllUsers(String query, Pageable pageable) {
        var page = StringUtils.hasText(query)
                ? userRepository.searchUsers(query, pageable)
                : userRepository.findAll(pageable);
        return PagedResponse.from(page.map(UserDTO::from));
    }

    @Transactional(readOnly = true)
    public UserDTO getUserById(UUID id) {
        return UserDTO.from(findUser(id));
    }

    public UserDTO toggleUserActive(UUID id) {
        User user = findUser(id);
        boolean wasActive = user.isActive();
        user.setActive(!wasActive);
        String admin = SecurityContextHolder.getContext().getAuthentication().getName();
        adminLog.info("[USER_TOGGLED] admin={} target={} active={}", admin, user.getEmail(), !wasActive);
        return UserDTO.from(userRepository.save(user));
    }

    private User findUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("User not found"));
    }

    private User resolveCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("Authenticated user not found"));
    }
}
