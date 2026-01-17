package com.ddip.backend.repository;

import com.ddip.backend.entity.User;
import com.ddip.backend.entity.UserAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAddressRepository extends JpaRepository<UserAddress, Long> {
    List<UserAddress> findAllByUser(User user);
    Optional<UserAddress> findByUserAndIsDefault(User user, boolean isDefault);
}
