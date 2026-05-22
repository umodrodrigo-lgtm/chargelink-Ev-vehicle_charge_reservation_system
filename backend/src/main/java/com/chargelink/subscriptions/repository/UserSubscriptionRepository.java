package com.chargelink.subscriptions.repository;

import com.chargelink.subscriptions.entity.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, UUID> {

    @Query("""
            SELECT us FROM UserSubscription us
            WHERE us.user.id = :userId
            AND us.active = true
            AND CURRENT_DATE BETWEEN us.startDate AND us.endDate
            ORDER BY us.startDate DESC
            """)
    Optional<UserSubscription> findActiveSubscription(@Param("userId") UUID userId);

    @Modifying
    @Query("UPDATE UserSubscription us SET us.active = false WHERE us.user.id = :userId AND us.active = true")
    void deactivateAllForUser(@Param("userId") UUID userId);
}
