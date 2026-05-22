package com.chargelink.subscriptions.repository;

import com.chargelink.subscriptions.entity.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, UUID> {

    List<SubscriptionPlan> findAllByActiveOrderByPlanOrder(boolean active);

    boolean existsByName(String name);
}
